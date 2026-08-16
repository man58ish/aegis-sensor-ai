"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import {
  Activity,
  Brain,
  Play,
  Square,
  RefreshCw,
  Sliders,
  Terminal,
  Thermometer,
  Zap,
} from "lucide-react";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  "https://sincere-radiance-production-bece.up.railway.app";

const socket: Socket = io(SOCKET_URL, {
  transports: ["websocket"], // Enforces pure websocket to prevent connection drops
  withCredentials: true,
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

interface LogEntry {
  id: string;
  time: string;
  type: "info" | "warn" | "danger" | "ai" | "mqtt";
  text: string;
}

export default function AegisNexusDashboard() {
  const [connected, setConnected] = useState(false);
  const [temp, setTemp] = useState<number>(65.0);
  const [dangerLimit, setDangerLimit] = useState<number>(100);
  
  // 🚀 Missing states restored
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isShutdown, setIsShutdown] = useState<boolean>(false);
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);

  const [streamPoints, setStreamPoints] = useState<number[]>([
    45, 52, 60, 65, 70, 68, 72, 75, 69, 65.0,
  ]);

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: "1", time: "00s", type: "ai", text: "Initiating WebGPU Neural Engine..." },
    { id: "2", time: "01s", type: "ai", text: "Phi-3-mini localized. WebGPU accelerated." },
    { id: "3", time: "02s", type: "info", text: "Awaiting Live Telemetry Ingestion..." },
  ]);

  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (type: LogEntry["type"], text: string) => {
    const newEntry: LogEntry = {
      id: Math.random().toString(),
      time: `${new Date().getSeconds()}s`,
      type,
      text,
    };
    setLogs((prev) => [...prev.slice(-40), newEntry]);
  };

  const updateTelemetryUI = (currentTemp: number, deviceId: string) => {
    if (isShutdown) return; // 🛑 Stops updating if relays are cut

    setTemp(currentTemp);
    setStreamPoints((prev) => [...prev.slice(1), currentTemp]);
    addLog("mqtt", `[${deviceId}] INGEST: Temp ${currentTemp.toFixed(1)}°C`);

    if (currentTemp > dangerLimit) {
      addLog(
        "danger",
        `ANOMALY DETECTED: ${currentTemp.toFixed(1)}°C. Triggering AI Override...`
      );
      setAiAnalyzing(true);
      setTimeout(() => setAiAnalyzing(false), 2500);
    }
  };

  // 1. Socket Connection Listeners
  useEffect(() => {
    socket.on("connect", () => {
      setConnected(true);
      console.log("Connected to Gateway"); // Silent in UI, logs to browser console
      socket.emit("join_dashboard");
    });

    socket.on("disconnect", () => {
      setConnected(false);
      console.warn("Connection to Gateway lost."); 
    });

    socket.on("NEW_SENSOR_DATA", (data: any) => {
      const currentTemp = data.metrics?.temperature ?? data.temperature ?? 0;
      updateTelemetryUI(currentTemp, data.deviceId || "MQTT-HARDWARE-01");
    });

    socket.on("SHUTDOWN_CONFIRMED", () => {
      addLog("danger", "✅ SYSTEM CONFIRMED: ALL HARDWARE RELAYS CUT.");
      setIsShutdown(true);
      setAiAnalyzing(false);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("NEW_SENSOR_DATA");
      socket.off("SHUTDOWN_CONFIRMED");
    };
  }, [dangerLimit, isShutdown]);

  // 2. In-Browser Simulator Engine (Restored)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isSimulating && !isShutdown) {
      addLog("info", "▶️ UI Simulation Stream Engine Activated");

      interval = setInterval(() => {
        const isAnomaly = Math.random() > 0.8;
        const simulatedTemp = isAnomaly
          ? parseFloat((Math.random() * 25 + dangerLimit + 2).toFixed(1))
          : parseFloat((Math.random() * 20 + 65).toFixed(1));

        updateTelemetryUI(simulatedTemp, "SIM-NODE-ALPHA");
      }, 1500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulating, dangerLimit, isShutdown]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // 3. Emergency Logic (Restored)
  const handleEmergencyShutdown = () => {
    socket.emit("EMERGENCY_SHUTDOWN", { action: "KILL_ALL_RELAYS", timestamp: Date.now() });
    setIsShutdown(true);
    setIsSimulating(false); // Stop simulator automatically
    setTemp(0.0);
    addLog("danger", "⚠️ EMERGENCY SHUTDOWN INITIATED. ALL RELAYS CUT.");
  };

  const handleSystemReboot = () => {
    setIsShutdown(false);
    setTemp(65.0);
    addLog("info", "🔄 SYSTEM REBOOTING. RESTORING HARDWARE RELAYS...");
  };

  return (
    // FULL SCREEN FIXED LAYOUT (h-screen & overflow-hidden)
    <div className="h-screen w-full bg-[#020509] text-slate-100 font-mono flex flex-col overflow-hidden relative">
      
      {/* Scrollbar & Cyberpunk Overlay CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34,211,238,0.2); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34,211,238,0.6); }
      `}} />
      
      <div 
        className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.04] mix-blend-overlay"
        style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 4px, 3px 100%' }} 
      />

      {/* STICKY HEADER (flex-none ensures it never shrinks or moves) */}
      <header className="flex-none flex flex-wrap items-center justify-between p-4 md:px-6 md:py-4 border-b border-cyan-500/20 bg-slate-900/40 backdrop-blur-md z-10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-cyan-400 fill-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <h1 className="text-xl md:text-2xl font-black tracking-widest text-cyan-50 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">
            AEGIS <span className="text-cyan-500/50">//</span> NEXUS
          </h1>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {/* 🚀 RESTORED SIMULATOR BUTTON */}
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            disabled={isShutdown}
            className={`flex items-center gap-2 px-3 py-1.5 rounded font-bold tracking-wider transition-all cursor-pointer ${
              isShutdown
                ? "border border-slate-800 text-slate-600 cursor-not-allowed"
                : isSimulating
                ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.7)] animate-pulse"
                : "border border-cyan-500/30 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-900/40 hover:border-cyan-400"
            }`}
          >
            {isSimulating ? (
              <><Square className="w-3.5 h-3.5 fill-black" /> STOP SIMULATOR</>
            ) : (
              <><Play className="w-3.5 h-3.5 fill-cyan-400" /> START SIMULATOR</>
            )}
          </button>

          <span className="text-slate-700">|</span>

          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isShutdown ? "bg-rose-500 animate-ping" : connected || isSimulating ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-rose-500"}`} />
            <span className={isShutdown ? "text-rose-400 font-bold tracking-wider" : connected || isSimulating ? "text-emerald-400 font-bold tracking-wider drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]" : "text-rose-500"}>
              {isShutdown ? "UPLINK: KILLED" : isSimulating ? "UPLINK: SIMULATING" : connected ? "UPLINK: STABLE" : "UPLINK: OFFLINE"}
            </span>
          </div>

          <span className="text-slate-700 hidden sm:inline">|</span>

          <div className={`hidden sm:block border px-3 py-1.5 rounded-sm font-bold tracking-widest uppercase transition-all ${aiAnalyzing ? "border-purple-400 bg-purple-950/80 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.6)] animate-pulse" : "border-purple-500/30 bg-purple-950/20 text-purple-400"}`}>
            {aiAnalyzing ? "NEURAL CORE: EVALUATING..." : "NEURAL CORE: READY [GPU]"}
          </div>
        </div>
      </header>

      {/* SCROLLABLE MAIN CONTENT AREA */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6 z-10">
        
        {/* Left Column */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="border border-cyan-500/10 bg-slate-900/20 backdrop-blur-md p-5 rounded-xl flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-cyan-500/30 transition-colors">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold tracking-wider mb-4">
                <span>CORE THERMAL STATUS</span>
                <Thermometer className="w-4 h-4 text-cyan-400" />
              </div>

              <div className="flex items-baseline my-2">
                <span className={`text-5xl md:text-6xl font-black tracking-tight drop-shadow-md ${isShutdown ? "text-slate-600" : temp > dangerLimit ? "text-rose-400 animate-pulse drop-shadow-[0_0_15px_rgba(225,29,72,0.6)]" : "text-slate-100"}`}>
                  {temp < 10 ? `0${temp.toFixed(2)}` : temp.toFixed(2)}
                </span>
                <span className="text-2xl text-cyan-500 ml-2 font-bold">°C</span>
              </div>

              <div className="mt-6 mb-4">
                <div className="flex justify-between text-[11px] font-bold text-cyan-500 mb-2">
                  <span className="flex items-center gap-1"><Sliders className="w-3 h-3" /> DANGER LIMIT</span>
                  <span>{dangerLimit}°C</span>
                </div>
                <input
                  type="range"
                  min="50" max="150"
                  value={dangerLimit}
                  onChange={(e) => setDangerLimit(Number(e.target.value))}
                  className="w-full accent-rose-500 bg-slate-800 h-1 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* 🚀 RESTORED DYNAMIC REBOOT/SHUTDOWN BUTTON */}
            {isShutdown ? (
              <button onClick={handleSystemReboot} className="w-full mt-4 py-3 border border-emerald-500/50 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 font-bold text-xs uppercase tracking-widest rounded transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                RESTORE RELAYS (REBOOT)
              </button>
            ) : (
              <button onClick={handleEmergencyShutdown} className="w-full mt-4 py-3 border border-rose-500/50 bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 font-bold text-xs uppercase tracking-widest rounded transition-all shadow-[0_0_15px_rgba(225,29,72,0.2)] hover:shadow-[0_0_20px_rgba(225,29,72,0.4)]">
                EMERGENCY SHUTDOWN
              </button>
            )}
          </div>

          <div className="border border-cyan-500/10 bg-slate-900/20 backdrop-blur-md p-5 rounded-xl flex-1 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-cyan-500/30 transition-colors">
            <div className="flex items-center gap-2 text-xs font-bold text-fuchsia-400 tracking-wider">
              <Brain className="w-4 h-4" />
              <span>COGNITIVE ANALYSIS</span>
            </div>

            <div className="py-6 flex flex-col items-center justify-center text-center">
              {aiAnalyzing ? (
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="w-8 h-8 text-fuchsia-400 animate-spin" />
                  <span className="text-xs text-fuchsia-300 font-bold mt-2 animate-pulse drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]">
                    EVALUATING SHOCK RISK...
                  </span>
                </div>
              ) : isShutdown ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-rose-400 font-bold">SYSTEM ISOLATED</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 opacity-60">
                  <div className="w-10 h-10 rounded-full border border-cyan-800/50 border-t-cyan-400 animate-spin" />
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider">
                    AWAITING ANOMALIES
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center Column: Live Graph */}
        <div className="lg:col-span-6 border border-cyan-500/10 bg-slate-900/20 backdrop-blur-md p-5 rounded-xl flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 tracking-wider mb-6">
            <Activity className="w-4 h-4" />
            <span>LIVE TELEMETRY STREAM</span>
          </div>

          <div className="flex-1 flex gap-3 relative min-h-[300px]">
            <div className="flex flex-col justify-between text-[11px] text-slate-500 font-mono py-2 select-none">
              <span>150</span><span>120</span><span>90</span><span>60</span><span>30</span>
            </div>

            <div className="flex-1 border border-cyan-900/40 rounded relative bg-black/20 overflow-hidden flex items-end">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-b border-cyan-500/50 w-full" />
                <div className="border-b border-cyan-500/50 w-full" />
                <div className="border-b border-cyan-500/50 w-full" />
                <div className="border-b border-cyan-500/50 w-full" />
              </div>

              <div className="absolute w-full border-b border-rose-500/60 border-dashed pointer-events-none z-10" style={{ bottom: `${(dangerLimit / 150) * 100}%` }} />

              <div className="w-full h-full flex items-end">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 300" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>
                  <polygon fill="url(#cyanGradient)" points={`0,300 ${streamPoints.map((val, idx) => `${(idx / (streamPoints.length - 1)) * 500},${300 - Math.min(Math.max((val / 150) * 300, 0), 300)}`).join(" ")} 500,300`} />
                  <polyline fill="none" stroke="#22d3ee" strokeWidth="2.5" points={streamPoints.map((val, idx) => `${(idx / (streamPoints.length - 1)) * 500},${300 - Math.min(Math.max((val / 150) * 300, 0), 300)}`).join(" ")} />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: LOGS (Contained Scroll) */}
        <div className="lg:col-span-3 border border-cyan-500/10 bg-slate-900/20 backdrop-blur-md p-5 rounded-xl flex flex-col h-full overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-cyan-500/30 transition-colors">
          <div className="flex-none flex items-center gap-2 text-xs font-bold text-slate-300 tracking-wider mb-4 border-b border-cyan-500/20 pb-3">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>&gt;_ SYSTEM.OUT</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 text-[11px] font-mono custom-scrollbar">
            {logs.map((log) => (
              <div key={log.id} className="leading-relaxed break-words">
                <span className="text-cyan-700 font-bold mr-2">[{log.time}]</span>
                {log.type === "danger" && <span className="text-rose-400 font-bold drop-shadow-[0_0_5px_rgba(225,29,72,0.8)]">{log.text}</span>}
                {log.type === "warn" && <span className="text-amber-400">{log.text}</span>}
                {log.type === "ai" && <span className="text-purple-400">{log.text}</span>}
                {log.type === "mqtt" && <span className="text-cyan-100/70">{log.text}</span>}
                {log.type === "info" && <span className="text-cyan-400">{log.text}</span>}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
}
