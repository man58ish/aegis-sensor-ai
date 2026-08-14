import mongoose from 'mongoose';

// Defining an Enterprise-Grade Time-Series Schema
const telemetrySchema = new mongoose.Schema({
  timestamp: { type: Date, required: true, default: Date.now },
  deviceId: { type: String, required: true },
  temperature: { type: Number, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, {
  // THIS IS THE MAGIC: Converts standard collection to an optimized Time-Series format
  timeseries: {
    timeField: 'timestamp',
    metaField: 'deviceId',
    granularity: 'seconds' // Optimized for high-frequency IoT sensors
  }
});

export default mongoose.models.Telemetry || mongoose.model('Telemetry', telemetrySchema);