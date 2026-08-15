"use client";

import { useEffect, useState } from "react";
import { socket } from "./socket";
import {
  Activity,
  AlertTriangle,
  Cpu,
  Flame,
  Radio,
  RefreshCw,
  ShieldAlert,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";

interface TelemetryData {
  deviceId: string;
  temperature?: number;
  metrics?: {
    temperature?: number;
    vibration?: number;
    pressure?: number;
  };
  workerPid?: number;
  timestamp?: string;
}

export default function AegisDashboard() {
  const [connected, setConnected] = useState(false);
  const [latestData, setLatestData] = useState<TelemetryData | null>(null);
  const [history, setHistory] = useState<TelemetryData[]>([]);
  const [emergencyStatus, setEmergencyStatus] = useState<string | null>(null);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);

  useEffect(() => {
    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join_dashboard");
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("NEW_SENSOR_DATA", (data: TelemetryData) => {
      const formattedData = {
        ...data,
        timestamp: new Date().toLocaleTimeString(),
      };
      setLatestData(formattedData);
      setHistory((prev) => [formattedData, ...prev.slice(0, 19)]);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("NEW_SENSOR_DATA");
    };
  }, []);

  const triggerEmergencyShutdown = () => {
    setIsEmergencyActive(true);
    const payload = {
      action: "KILL_ALL_ACTUATORS",
      timestamp: Date.now(),
      target: latestData?.deviceId || "ALL_HARDWARE",
    };
    socket.emit("EMERGENCY_SHUTDOWN", payload);
    setEmergencyStatus("🚨 EMERGENCY PROTOCOL EMITTED VIA MQTT BUS");

    setTimeout(() => {
      setEmergencyStatus(null);
      setIsEmergencyActive(false);
    }, 4000);
  };

  const temp =
    latestData?.metrics?.temperature ?? latestData?.temperature ?? 0;
  const vibration = latestData?.metrics?.vibration ?? 0;
  const pressure = latestData?.metrics?.pressure ?? 0;

  return (
    <main className="min-h-screen bg-[#030712] bg-grid text-slate-100 p-4 md:p-8 scanline">
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-cyan-900/60 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Radio className="w-8 h-8 text-cyan-400 animate-pulse" />
            <h1 className="text-2xl md:text-3xl font-black tracking-wider text-cyan-400">
              AEGIS // TELEMETRY GATEWAY
            </h1>
          </div>
          <p className="text-xs md:text-sm text-cyan-500/70 mt-1">
            INDUSTRIAL IoT FAULT-TOLERANT CLUSTER MONITOR
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-bold ${
              connected
                ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-400"
                : "bg-rose-950/60 border-rose-500/50 text-rose-400 animate-pulse"
            }`}
          >
            {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {connected ? "LIVE LINK ACTIVE" : "CLUSTER DISCONNECTED"}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-cyan-800/60 bg-slate-900/80 text-cyan-300 text-xs">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Worker PID: {latestData?.workerPid || "Standby"}</span>
          </div>
        </div>
      </header>

      {/* Emergency Notification Banner */}
      {emergencyStatus && (
        <div className="mb-6 p-4 rounded border border-rose-500 bg-rose-950/90 text-rose-200 flex items-center gap-3 glow-red animate-bounce">
          <AlertTriangle className="w-6 h-6 text-rose-400" />
          <span className="font-bold text-sm tracking-wide">{emergencyStatus}</span>
        </div>
      )}

      {/* Live Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Metric 1: Temperature */}
        <div className="p-6 rounded-lg border border-cyan-900/60 bg-slate-950/80 glow-cyan relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs text-cyan-400 font-bold uppercase tracking-widest">
              Core Temperature
            </span>
            <Flame
              className={`w-5 h-5 ${
                temp > 75 ? "text-rose-400 animate-bounce" : "text-cyan-400"
              }`}
            />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-white">{temp.toFixed(1)}</span>
            <span className="text-xl text-cyan-400 font-bold">°C</span>
          </div>
          <div className="mt-4 w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                temp > 75 ? "bg-rose-500" : "bg-cyan-400"
              }`}
              style={{ width: `${Math.min(temp, 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Vibration */}
        <div className="p-6 rounded-lg border border-cyan-900/60 bg-slate-950/80 glow-cyan">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs text-cyan-400 font-bold uppercase tracking-widest">
              Vibration Velocity
            </span>
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-white">{vibration.toFixed(2)}</span>
            <span className="text-xl text-cyan-400 font-bold">mm/s</span>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Threshold: &lt; 4.5 mm/s (ISO 10816 Standard)
          </p>
        </div>

        {/* Metric 3: Pressure */}
        <div className="p-6 rounded-lg border border-cyan-900/60 bg-slate-950/80 glow-cyan">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs text-cyan-400 font-bold uppercase tracking-widest">
              Hydraulic Pressure
            </span>
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-white">{pressure.toFixed(1)}</span>
            <span className="text-xl text-cyan-400 font-bold">bar</span>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Active Device: {latestData?.deviceId || "No Signal"}
          </p>
        </div>
      </div>

      {/* Control Panel & Real-Time Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Emergency Kill Switch */}
        <div className="p-6 rounded-lg border border-rose-900/50 bg-rose-950/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-rose-400 font-bold text-lg mb-2">
              <ShieldAlert className="w-6 h-6" />
              <span>SAFETY INTERLOCK</span>
            </div>
            <p className="text-xs text-rose-300/70 mb-6">
              Emits hardware override signal via Master Node MQTT Broker (Port 1883) to topic <code className="text-rose-300">aegis/commands</code>.
            </p>
          </div>

          <button
            onClick={triggerEmergencyShutdown}
            disabled={isEmergencyActive}
            className={`w-full py-5 rounded font-black text-sm uppercase tracking-widest transition-all ${
              isEmergencyActive
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-rose-600 hover:bg-rose-500 text-white glow-red active:scale-95"
            }`}
          >
            {isEmergencyActive ? "BROADCASTING OVERRIDE..." : "🛑 EMERGENCY SHUTDOWN"}
          </button>
        </div>

        {/* Live Ingest Stream */}
        <div className="lg:col-span-2 p-6 rounded-lg border border-cyan-900/60 bg-slate-950/80">
          <div className="flex items-center justify-between mb-4 border-b border-cyan-900/40 pb-2">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              Live Ingestion Feed
            </span>
            <span className="text-xs text-slate-500">Last 20 Packets</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto font-mono text-xs pr-2">
            {history.length === 0 ? (
              <p className="text-slate-500 italic py-8 text-center">
                Awaiting telemetry stream from Cluster Gateway...
              </p>
            ) : (
              history.map((pkt, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/80"
                >
                  <span className="text-cyan-400 font-bold">{pkt.deviceId}</span>
                  <span className="text-slate-300">
                    T: {pkt.metrics?.temperature ?? pkt.temperature ?? "--"}°C | V:{" "}
                    {pkt.metrics?.vibration ?? "--"} mm/s
                  </span>
                  <span className="text-slate-500">{pkt.timestamp}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}