const axios = require("axios");

// Aapka Railway live backend URL
const BACKEND_URL = "https://sincere-radiance-production-bece.up.railway.app";

console.log("==========================================");
console.log("⚡ AEGIS INDUSTRIAL SENSOR SIMULATOR ACTIVE");
console.log(`📡 Streaming to: ${BACKEND_URL}`);
console.log("==========================================\n");

// Har 1.5 second mein random live sensor packet bhejna
setInterval(async () => {
  // 15% chance of overheating anomaly (>100°C)
  const isAnomaly = Math.random() > 0.85;
  const temp = isAnomaly
    ? parseFloat((Math.random() * 30 + 100).toFixed(2)) // 100°C - 130°C (DANGER)
    : parseFloat((Math.random() * 20 + 65).toFixed(2));  // 65°C - 85°C (NORMAL)

  const payload = {
    deviceId: "SIM-EDGE-NODE-01",
    metrics: {
      temperature: temp,
      vibration: parseFloat((Math.random() * 2.5 + 1.2).toFixed(2)),
      pressure: parseFloat((Math.random() * 1.5 + 4.0).toFixed(2)),
    },
    timestamp: new Date().toISOString(),
  };

  try {
    await axios.post(BACKEND_URL, payload);
    if (isAnomaly) {
      console.log(`🚨 [ANOMALY SENT] Temp: ${temp}°C | Triggering Safety Override...`);
    } else {
      console.log(`✔️ [TELEMETRY] Temp: ${temp}°C | Vib: ${payload.metrics.vibration} mm/s`);
    }
  } catch (error) {
    console.error("❌ Link Failed:", error.message);
  }
}, 1500);