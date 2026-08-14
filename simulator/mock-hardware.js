// simulator/mock-hardware.js
const mqtt = require('mqtt');
const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://127.0.0.1:1883';
const client = mqtt.connect(BROKER_URL);

client.on('connect', () => {
  console.log(`[Hardware SIM] Connected to Broker: ${BROKER_URL}`);
  
  // Har 3 second mein sensor telemetry push karega
  setInterval(() => {
    // Random temperature between 35°C and 95°C
    const temp = Number((Math.random() * (95 - 35) + 35).toFixed(2));
    const payload = JSON.stringify({
      deviceId: "HARDWARE-UNIT-01",
      metrics: { temperature: temp }
    });

    client.publish('aegis/telemetry', payload);
    console.log(`[Hardware SIM] 📡 Broadcasted: ${temp}°C`);
  }, 3000);
});