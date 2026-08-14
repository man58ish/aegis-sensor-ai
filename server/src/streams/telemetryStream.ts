import { Transform, TransformCallback } from 'stream';

export interface TelemetryPayload {
  deviceId: string;
  timestamp: number;
  metrics: {
    temperature: number;
    pressure: number;
    vibration: number;
  };
}

export class TelemetryValidationStream extends Transform {
  constructor() {
    // Object mode true allows stream to pass objects instead of raw buffers
    super({ objectMode: true });
  }

  _transform(chunk: any, encoding: string, callback: TransformCallback): void {
    try {
      // Parse buffer to JSON
      const data = typeof chunk === 'string' || Buffer.isBuffer(chunk) 
        ? JSON.parse(chunk.toString()) 
        : chunk;

      // Schema Validation Logic (Lightweight)
      if (!data.deviceId || !data.metrics) {
        throw new Error('Malformed Telemetry Payload');
      }

      // Attach server-side timestamp for accuracy
      data.serverTimestamp = Date.now();

      // Pass validated data to the next stream (e.g., Database write stream)
      this.push(data);
      callback();
    } catch (error) {
      // Push error to stream error handler without crashing the server
      callback(error as Error);
    }
  }
}