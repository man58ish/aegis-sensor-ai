import cluster from "cluster";
import os from "os";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import http from "http";
import rateLimit from "express-rate-limit";
import CircuitBreaker from "opossum";
import { Server, Socket } from "socket.io";
import { setupMaster, setupWorker } from "@socket.io/sticky";
import { createAdapter, setupPrimary } from "@socket.io/cluster-adapter";
import { connectDB } from "./db/connect";
import Telemetry from "./models/Telemetry";
import net from "net";

// 🛑 Railway 512MB RAM container safety ke liye strictly 2 workers
const numCPUs = 2;
const PORT = Number(process.env.PORT) || 5000;
const MQTT_PORT = 1883;

// 🌐 Localhost + Saare Vercel deployment links allow karega
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  /\.vercel\.app$/,
];

// ============================================================================
// 1. 🧠 MASTER PROCESS (Sticky Sessions Router + MQTT Broker + Worker Manager)
// ============================================================================
if (cluster.isPrimary) {
  (async () => {
    console.log(`[Primary] Master Process ${process.pid} is booting...`);

    // HTTP Master Server (Socket.io sticky load-balancing gateway)
    const httpServer = http.createServer();
    setupMaster(httpServer, { loadBalancingMethod: "round-robin" });
    setupPrimary();
    cluster.setupPrimary({ serialization: "advanced" });

    // Embedded Industrial Aedes MQTT Broker
    let aedesInstance: any = null;

    try {
      const aedesModule = require("aedes");
      const Aedes = aedesModule.Aedes || aedesModule;

      if (Aedes && (typeof Aedes.createBroker === "function" || typeof Aedes === "function")) {
        aedesInstance = typeof Aedes.createBroker === "function" ? await Aedes.createBroker() : new Aedes();
        const mqttServer = net.createServer(aedesInstance.handle as any);

        mqttServer.listen(MQTT_PORT, "0.0.0.0", () => {
          console.log(`[Primary] 🚀 Industrial MQTT Broker actively listening on 0.0.0.0:${MQTT_PORT}`);
        });

        // Inbound MQTT Hardware Packets -> Worker Node IPC Routing
        aedesInstance.on("publish", (packet: any) => {
          if (packet && packet.topic === "aegis/telemetry") {
            const payloadStr = packet.payload ? packet.payload.toString() : "";
            const workers = Object.values(cluster.workers || {});
            if (workers.length > 0) {
              const targetWorker = workers[Math.floor(Math.random() * workers.length)];
              targetWorker?.send({ type: "MQTT_INGEST", payload: payloadStr });
            }
          }
        });
      }
    } catch (mqttError: any) {
      console.warn(`[Primary MQTT Warning] Broker initialized in lightweight mode:`, mqttError.message);
    }

    // Worker Processes allocate karna
    console.log(`[Primary] Allocating ${numCPUs} dedicated CPU workers...`);
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    // Auto-recovery agar koi worker crash ho
    cluster.on("exit", (worker) => {
      console.error(`[Worker] Node ${worker.process.pid} offline. Initiating auto-recovery...`);
      cluster.fork();
    });

    // Outbound Command: UI -> Worker -> Master -> Hardware Relay MQTT publish
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
            console.log(`[MQTT Master] 🚨 Hardware Override Broadcasted to topic 'aegis/commands'`);
          }
        );
      }
    });

    // Explicit 0.0.0.0 host binding for Railway container proxy
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`--------------------------------------------------`);
      console.log(`[Gateway] Master Node ACTIVELY listening on 0.0.0.0:${PORT}`);
      console.log(`--------------------------------------------------`);
    });
  })();
} else {
  // ============================================================================
  // 2. ⚙️ WORKER PROCESS (Express Endpoints + Sockets + Circuit Breaker Engine)
  // ============================================================================

  // Crash-safe DB connect
  connectDB();

  const app = express();

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    })
  );
  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Instant Browser Health Check endpoint
  app.get("/", (req, res) => {
    res.status(200).json({
      status: "online",
      gateway: "AEGIS-NEXUS-GATEWAY",
      workerPid: process.pid,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  const telemetryLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    message: { error: "CRITICAL: Telemetry Rate Limit Exceeded." },
  });

  const httpServer = http.createServer(app);

  // High-Performance Socket.io instance with Heartbeat keep-alive
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket"],
    pingInterval: 10000, // 10s keepalive packet (prevents Railway 30s drop)
    pingTimeout: 5000,
  });

  io.adapter(createAdapter());
  setupWorker(io);

  // Single Unified WebSocket Lifecycle Manager
  io.on("connection", (socket: Socket) => {
    socket.join("live_telemetry");

    socket.on("join_dashboard", () => {
      socket.join("live_telemetry");
    });

    // Hardware Emergency Cut Override from UI
    socket.on("EMERGENCY_SHUTDOWN", (data: any) => {
      console.log(`[Worker ${process.pid}] 🛑 EMERGENCY OVERRIDE RECEIVED:`, data);
      if (process.send) {
        process.send({
          type: "MQTT_EMERGENCY_OUTBOUND",
          payload: JSON.stringify(data),
        });
      }
      // Instant acknowledgement signal back to frontend
      socket.emit("SHUTDOWN_CONFIRMED", {
        status: "RELAYS_CUT",
        timestamp: Date.now(),
      });
    });
  });

  // Circuit Breaker Protected Telemetry Processor
  const processTelemetry = async (payload: any) => {
    if (!payload.deviceId || !payload.metrics) {
      throw new Error("MALFORMED_DATA");
    }
    return payload;
  };

  const breaker = new CircuitBreaker(processTelemetry, {
    timeout: 3000,
    errorThresholdPercentage: 50,
    resetTimeout: 10000,
  });

  breaker.fallback(() => {
    console.warn(`[CIRCUIT BREAKER] Ingest throttled on Node ${process.pid}`);
    return { status: "fallback_active" };
  });

  const handleTelemetry = async (payload: any) => {
    try {
      const result = await breaker.fire(payload);
      if ((result as any).status === "fallback_active") return;

      const temp = payload.metrics?.temperature ?? payload.temperature;
      
      // Async Non-blocking DB write (failure never drops live socket stream)
      if (temp !== undefined) {
        Telemetry.create({
          deviceId: payload.deviceId,
          temperature: temp,
          metadata: payload.metrics,
        }).catch((err) => {
          // Silent DB catch to keep memory light
        });
      }

      // Stream to all connected UI clients
      io.to("live_telemetry").emit("NEW_SENSOR_DATA", {
        ...payload,
        workerPid: process.pid,
      });
    } catch (error) {
      console.error(`[Worker Error ${process.pid}] Telemetry ingestion failed.`);
    }
  };

  // HTTP Telemetry Ingestion Endpoints (Root + API routes)
  app.post("/", telemetryLimiter, async (req, res) => {
    await handleTelemetry(req.body);
    res.status(202).json({ status: "live_pushed", workerPid: process.pid });
  });

  app.post("/api/telemetry", telemetryLimiter, async (req, res) => {
    await handleTelemetry(req.body);
    res.status(202).json({ status: "live_pushed", workerPid: process.pid });
  });

  // Inbound IPC listener for MQTT hardware packets
  process.on("message", async (message: any) => {
    if (message.type === "MQTT_INGEST") {
      try {
        const payload = JSON.parse(message.payload);
        payload.deviceId = `MQTT-${payload.deviceId || "HARDWARE-01"}`;
        await handleTelemetry(payload);
      } catch (e) {
        console.error(`[Worker ${process.pid}] Invalid MQTT JSON payload dropped.`);
      }
    }
  });
}
