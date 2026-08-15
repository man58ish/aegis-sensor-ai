"use client";

import { useEffect, useState, useRef } from "react";
import { socket } from "./socket";
import {
  Activity,
  AlertTriangle,
  Brain,
  Cpu,
  Flame,
  Radio,
  RefreshCw,
  RotateCcw,
  Sliders,
  Terminal,
  Thermometer,
  Zap,
} from "lucide-react";

interface LogEntry {
  id: string;
  time: string;
  type: "info" | "warn" | "danger" | "ai" | "mqtt";
  text: string;
}

export default function AegisNexusDashboard() {
  const [connected, setConnected] = useState(false);
  const [temp, setTemp] = useState<number>(0.0);
  const [dangerLimit, setDangerLimit] = useState<number>(100);
  const [streamPoints, setStreamPoints] = useState<number[]>([
    25, 30, 28, 45, 60, 85, 110, 118.5, 120.5, 120.5,
  ]);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: "1", time: "42s", type: "ai", text: "Initiating WebGPU Neural Engine..." },
    { id: "2", time: "42s", type: "ai", text: "Phi-3-mini localized. WebGPU accelerated." },
    { id: "3", time: "42s", type: "danger", text: "⚠️ EMERGENCY SHUTDOWN INITIATED. ALL RELAYS CUT." },
    { id: "4", time: "42s", type: "info", text: "🔄 SYSTEM REBOOTING. RESTORING RELAYS..." },
    { id: "5", time: "42s", type: "mqtt", text: "[MQTT-HARDWARE-01] INGEST: Temp 90°C" },
    { id: "6", time: "42s", type: "mqtt", text: "[MQTT-HARDWARE-01] INGEST: Temp 120.5°C" },
    { id: "7", time: "42s", type: "danger", text: "ANOMALY DETECTED: 120.5°C. Triggering AI Override..." },
    { id: "8", time: "42s", type: "danger", text: "⚠️ EMERGENCY SHUTDOWN INITIATED. ALL RELAYS CUT." },
    { id: "9", time: "42s", type: "info", text: "🔄 SYSTEM REBOOTING. RESTORING RELAYS..." },
  ]);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on("connect", () => {
      setConnected(true);
      addLog("info", "Connected to Master Telemetry Cluster Gateway");
    });

    socket.on("disconnect", () => {
      setConnected(false);
      addLog("warn", "Connection to Gateway lost. Retrying link...");
    });

    socket.on("NEW_SENSOR_DATA", (data: any) => {
      const currentTemp = data.metrics?.temperature ?? data.temperature ?? 0;
      setTemp(currentTemp);

      setStreamPoints((prev) => [...prev.slice(1), currentTemp]);

      addLog("mqtt", `[MQTT-HARDWARE-01] INGEST: Temp ${currentTemp.toFixed(1)}°C`);

      if (currentTemp > dangerLimit) {
        addLog(
          "danger",
          `ANOMALY DETECTED: ${currentTemp.toFixed(1)}°C. Triggering AI Override...`
        );
        setAiAnalyzing(true);
        setTimeout(() => setAiAnalyzing(false), 3000);
      }
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("NEW_SENSOR_DATA");
    };
  }, [dangerLimit]);

  const addLog = (type: LogEntry["type"], text: string) => {
    const newEntry: LogEntry = {
      id: Math.random().toString(),
      time: `${new Date().getSeconds()}s`,
      type,
      text,
    };
    setLogs((prev) => [...prev.slice(-30), newEntry]);
  };

  const handleEmergencyShutdown = () => {
    socket.emit("EMERGENCY_SHUTDOWN", { action: "KILL_ALL_RELAYS", timestamp: Date.now() });
    addLog("danger", "⚠️ EMERGENCY SHUTDOWN INITIATED. ALL RELAYS CUT.");
    setTimeout(() => {
      addLog("info", "🔄 SYSTEM REBOOTING. RESTORING RELAYS...");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#020710] text-slate-100 font-mono p-4 md:p-6 flex flex-col justify-between">
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-cyan-950 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-cyan-400 fill-cyan-400" />
          <h1 className="text-xl md:text-2xl font-black tracking-widest text-cyan-300">
            AEGIS // NEXUS
          </h1>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-sm ${
                connected ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
              }`}
            />
            <span
              className={
                connected ? "text-emerald-400 font-bold tracking-wider" : "text-rose-400"
              }
            >
              {connected ? "UPLINK: STABLE" : "UPLINK: OFFLINE"}
            </span>
          </div>

          <span className="text-slate-600">|</span>

          <div className="border border-purple-500/70 bg-purple-950/40 text-purple-300 px-3 py-1.5 rounded-sm font-bold tracking-widest uppercase shadow-[0_0_12px_rgba(168,85,247,0.25)]">
            NEURAL CORE: READY [GPU]
          </div>
        </div>
      </header>

      {/* 3-Column Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: Core Thermal Status & Cognitive Analysis */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Card 1: Core Thermal Status */}
          <div className="border border-cyan-900/50 bg-[#060e1a]/80 p-5 rounded-lg flex flex-col justify-between shadow-lg relative">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold tracking-wider mb-4">
                <span>CORE THERMAL STATUS</span>
                <Thermometer className="w-4 h-4 text-cyan-400" />
              </div>

              {/* Large Digital Display */}
              <div className="flex items-baseline my-2">
                <span className="text-5xl md:text-6xl font-black tracking-tight text-slate-100">
                  {temp < 10 ? `0${temp.toFixed(2)}` : temp.toFixed(2)}
                </span>
                <span className="text-2xl text-cyan-400 ml-2 font-bold">°C</span>
              </div>

              {/* Danger Limit Slider Bar */}
              <div className="mt-6 mb-4">
                <div className="flex justify-between text-[11px] font-bold text-cyan-400 mb-2">
                  <span className="flex items-center gap-1">
                    <Sliders className="w-3 h-3" /> DANGER LIMIT
                  </span>
                  <span>{dangerLimit}°C</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={dangerLimit}
                  onChange={(e) => setDangerLimit(Number(e.target.value))}
                  className="w-full accent-rose-500 bg-slate-900 h-1.5 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Emergency Shutdown Button */}
            <button
              onClick={handleEmergencyShutdown}
              className="w-full mt-4 py-3 border border-rose-600/80 bg-rose-950/20 hover:bg-rose-900/40 text-rose-400 font-bold text-xs uppercase tracking-widest rounded transition-all active:scale-95 shadow-[0_0_15px_rgba(225,29,72,0.2)]"
            >
              EMERGENCY SHUTDOWN
            </button>
          </div>

          {/* Card 2: Cognitive Analysis */}
          <div className="border border-cyan-900/50 bg-[#060e1a]/80 p-5 rounded-lg flex-1 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-fuchsia-400 tracking-wider">
              <Brain className="w-4 h-4" />
              <span>COGNITIVE ANALYSIS</span>
            </div>

            <div className="py-6 flex flex-col items-center justify-center text-center">
              {aiAnalyzing ? (
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="w-8 h-8 text-fuchsia-400 animate-spin" />
                  <span className="text-xs text-fuchsia-300 font-bold mt-2">
                    EVALUATING THERMAL SHOCK RISK...
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-cyan-800/80 border-t-cyan-400 animate-spin" />
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider">
                    AWAITING TELEMETRY ANOMALIES
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-500 border-t border-slate-900 pt-3">
              <div className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-[9px]">
                N
              </div>
              <span>Next.js Edge Runtime Active</span>
            </div>
          </div>
        </div>

        {/* Center Column: Live Telemetry Stream Waveform Chart */}
        <div className="lg:col-span-6 border border-cyan-900/50 bg-[#060e1a]/80 p-5 rounded-lg flex flex-col">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 tracking-wider mb-6">
            <Activity className="w-4 h-4" />
            <span>LIVE TELEMETRY STREAM</span>
          </div>

          {/* Chart Container with Y-Axis and Area Fill */}
          <div className="flex-1 flex gap-3 relative min-h-[300px]">
            {/* Y-Axis Labels */}
            <div className="flex flex-col justify-between text-[11px] text-slate-500 font-mono py-2 select-none">
              <span>126</span>
              <span>117</span>
              <span>108</span>
              <span>99</span>
            </div>

            {/* Grid & Chart Area */}
            <div className="flex-1 border border-cyan-950/80 rounded relative bg-[#030a14] overflow-hidden flex items-end">
              {/* Horizontal Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-b border-cyan-500 w-full" />
                <div className="border-b border-cyan-500 w-full" />
                <div className="border-b border-cyan-500 w-full" />
                <div className="border-b border-rose-500 border-dashed w-full" />
              </div>

              {/* Danger Threshold Line (Dotted Red) */}
              <div
                className="absolute w-full border-b border-rose-500 border-dashed pointer-events-none z-10"
                style={{ bottom: `${Math.min(dangerLimit, 100)}%` }}
              />

              {/* Real-Time Waveform Fill */}
              <div className="w-full h-full flex items-end">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  {/* Area Fill */}
                  <polygon
                    fill="url(#cyanGradient)"
                    points={`0,300 ${streamPoints
                      .map((val, idx) => {
                        const x = (idx / (streamPoints.length - 1)) * 500;
                        const y = 300 - (val / 150) * 280;
                        return `${x},${y}`;
                      })
                      .join(" ")} 500,300`}
                  />

                  {/* Main Line Stroke */}
                  <polyline
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="2.5"
                    points={streamPoints
                      .map((val, idx) => {
                        const x = (idx / (streamPoints.length - 1)) * 500;
                        const y = 300 - (val / 150) * 280;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: System Terminal Logs */}
        <div className="lg:col-span-3 border border-cyan-900/50 bg-[#060e1a]/80 p-5 rounded-lg flex flex-col">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 tracking-wider mb-4 border-b border-cyan-950 pb-3">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>&gt;_ SYSTEM.OUT</span>
          </div>

          {/* Terminal Console Output */}
          <div className="flex-1 overflow-y-auto max-h-[480px] space-y-2.5 text-[11px] font-mono pr-2">
            {logs.map((log) => (
              <div key={log.id} className="leading-relaxed break-words">
                <span className="text-cyan-600 font-bold mr-2">[{log.time}]</span>
                {log.type === "danger" && (
                  <span className="text-rose-400 font-bold">{log.text}</span>
                )}
                {log.type === "warn" && <span className="text-amber-400">{log.text}</span>}
                {log.type === "ai" && <span className="text-purple-400">{log.text}</span>}
                {log.type === "mqtt" && (
                  <span className="text-amber-300 font-semibold">{log.text}</span>
                )}
                {log.type === "info" && <span className="text-cyan-300">{log.text}</span>}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}