import cluster from "cluster";
import os from "os";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import http from "http";
import rateLimit from "express-rate-limit";
import CircuitBreaker from "opossum";
import { Server } from "socket.io";
import { setupMaster, setupWorker } from "@socket.io/sticky";
import { createAdapter, setupPrimary } from "@socket.io/cluster-adapter";
import { connectDB } from "./db/connect";
import Telemetry from "./models/Telemetry";
import net from "net";
import { registerTelemetrySockets } from "./sockets/telemetrySocket";

const numCPUs = os.cpus().length;
const PORT = process.env.PORT || 5000;
const MQTT_PORT = 1883;

if (cluster.isPrimary) {
  (async () => {
    console.log(`[Primary] Master Process ${process.pid} is booting...`);

    // 1. HTTP Master Server (Socket.io sticky sessions gateway)
    const httpServer = http.createServer();
    setupMaster(httpServer, { loadBalancingMethod: "round-robin" });
    setupPrimary();
    cluster.setupPrimary({ serialization: "advanced" });

    // 2. 🧠 Global Scope declaration for Aedes
    let aedesInstance: any = null;

    try {
      const aedesModule = require("aedes");
      const Aedes = aedesModule.Aedes;

      if (!Aedes || typeof Aedes.createBroker !== "function") {
        throw new Error(
          `Aedes.createBroker not found! Keys available: ${Object.keys(aedesModule).join(", ")}`,
        );
      }

      aedesInstance = await Aedes.createBroker();
      const mqttServer = net.createServer(aedesInstance.handle as any);

      mqttServer.listen(MQTT_PORT, "0.0.0.0", () => {
        console.log(
          `[Primary] 🚀 Industrial MQTT Broker actively listening on 0.0.0.0:${MQTT_PORT}`,
        );
      });

      aedesInstance.on("publish", (packet: any, client: any) => {
        if (packet && packet.topic === "aegis/telemetry") {
          const payloadStr = packet.payload ? packet.payload.toString() : "";
          console.log(`[MQTT Primary] 📥 Caught raw publish:`, payloadStr);

          const workers = Object.values(cluster.workers || {});
          if (workers.length > 0) {
            const randomWorker =
              workers[Math.floor(Math.random() * workers.length)];
            randomWorker?.send({ type: "MQTT_INGEST", payload: payloadStr });
            console.log(
              `[MQTT Primary] 🔀 Routed payload to Worker PID: ${randomWorker?.process.pid}`,
            );
          }
        }
      });
    } catch (mqttError: any) {
      console.error(
        `[MQTT FATAL] Broker failed to initialize:`,
        mqttError.message,
      );
    }

    // 3. Spawn Distributed Workers
    console.log(`[Primary] Allocating ${numCPUs} CPU cores to Web Workers...`);
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    // 4. Auto-healing nodes
    cluster.on("exit", (worker) => {
      console.error(
        `[Worker] Node ${worker.process.pid} went offline. Initiating auto-recovery...`,
      );
      cluster.fork();
    });

    // 5. Two-Way MQTT: Outbound command from UI -> Master -> Hardware via Port 1883
    cluster.on("message", (worker, message: any) => {
      if (message.type === "MQTT_EMERGENCY_OUTBOUND" && aedesInstance) {
        aedesInstance.publish(
          {
            topic: "aegis/commands",
            payload: Buffer.from(message.payload),
            qos: 1,
            retain: false,
          },
          () => {
            console.log(
              `[MQTT Master] 🚨 Hardware Override Broadcasted to topic 'aegis/commands'`,
            );
          },
        );
      }
    });

    // 6. Open the Main Gateway
    httpServer.listen(PORT, () => {
      console.log(`--------------------------------------------------`);
      console.log(`[Gateway] Master Node ACTIVELY listening on port: ${PORT}`);
      console.log(`--------------------------------------------------`);
    });
  })();
} else {
  // ==========================================
  // ⚙️ DISTRIBUTED WORKER PROCESS
  // ==========================================

  connectDB();
  const app = express();

  app.use(
    cors({
      origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
      credentials: true,
    }),
  );
  app.use(helmet());
  app.use(express.json());

  app.get("/", (req, res) => {
    res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aegis Gateway</title>
  <style>
    body { background: #02050a; color: #22d3ee; font-family: monospace; padding: 2rem; }
  </style>
</head>
<body>
  <h2>🟢 Aegis Worker Node Active</h2>
  <p>PID: ${process.pid}</p>
</body>
</html>`);
  });

  const telemetryLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { error: "CRITICAL: Telemetry Rate Limit Exceeded." },
  });

  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["polling", "websocket"],
  });

  io.adapter(createAdapter());
  setupWorker(io);

  // 🚀 Modular Socket Event Handlers
  registerTelemetrySockets(io);

  io.on("connection", (socket) => {
    socket.join("live_telemetry");
    socket.on("join_dashboard", () => {
      socket.join("live_telemetry");
    });

    // Handle Emergency Shutdown command from Frontend UI
    socket.on("EMERGENCY_SHUTDOWN", (data) => {
      console.log(
        `[Worker ${process.pid}] 🛑 EMERGENCY OVERRIDE RECEIVED from UI:`,
        data,
      );
      if (process.send) {
        process.send({
          type: "MQTT_EMERGENCY_OUTBOUND",
          payload: JSON.stringify(data),
        });
      }
    });
  });

  const processTelemetry = async (payload: any) => {
    if (!payload.deviceId || !payload.metrics)
      throw new Error("MALFORMED_DATA");
    return payload;
  };

  const breaker = new CircuitBreaker(processTelemetry, {
    timeout: 3000,
    errorThresholdPercentage: 50,
    resetTimeout: 10000,
  });

  breaker.fallback(() => {
    console.warn(`[CIRCUIT BREAKER] Fallback triggered on Node ${process.pid}`);
    return { status: "fallback_active", error: "System overloaded." };
  });

  const handleTelemetry = async (payload: any) => {
    try {
      const result = await breaker.fire(payload);
      if ((result as any).status === "fallback_active") return;

      const temp = payload.metrics?.temperature;
      if (temp !== undefined) {
        Telemetry.create({
          deviceId: payload.deviceId,
          temperature: temp,
          metadata: payload.metrics,
        }).catch((err) => console.error("[DB ERROR]", err.message));
      }

      io.to("live_telemetry").emit("NEW_SENSOR_DATA", {
        ...payload,
        workerPid: process.pid,
      });
    } catch (error) {
      console.error(
        `[Worker Error ${process.pid}] Telemetry processing failed.`,
      );
    }
  };

  app.post("/api/telemetry", telemetryLimiter, async (req, res) => {
    await handleTelemetry(req.body);
    res.status(202).json({ status: "live_pushed", workerPid: process.pid });
  });

  process.on("message", async (message: any) => {
    if (message.type === "MQTT_INGEST") {
      try {
        const payload = JSON.parse(message.payload);
        payload.deviceId = `MQTT-${payload.deviceId}`;
        await handleTelemetry(payload);
      } catch (e) {
        console.error(
          `[Worker ${process.pid}] Invalid MQTT JSON format dropped.`,
        );
      }
    }
  });
}
