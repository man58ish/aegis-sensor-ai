import mongoose, { Schema, Document } from 'mongoose';

export interface ISensorData extends Document {
  deviceId: string;
  timestamp: Date;
  metrics: {
    temperature: number;
    pressure: number;
    vibration: number;
  };
  location: {
    type: string;
    coordinates: number[];
  };
}

const SensorDataSchema = new Schema({
  deviceId: { type: String, required: true },
  timestamp: { type: Date, required: true },
  metrics: {
    temperature: { type: Number, required: true },
    pressure: { type: Number, required: true },
    vibration: { type: Number, required: true }
  },
  // GeoJSON Point for SpaceX-style Spatial Dashboard Maps
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  }
}, {
  // PRO FEATURE: TimeSeries configuration for high-frequency writes
  timeseries: {
    timeField: 'timestamp',
    metaField: 'deviceId',
    granularity: 'seconds' // Or 'milliseconds' for hyper-frequency
  },
  versionKey: false
});

// 2dsphere index for fast geospatial queries on the map
SensorDataSchema.index({ location: '2dsphere' });

export const SensorData = mongoose.model('SensorData', SensorDataSchema);