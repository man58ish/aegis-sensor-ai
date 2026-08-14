import { SensorData } from '../models/SensorData';

export const initChangeStreams = () => {
  console.log(`[ChangeStream] Primary Process ${process.pid} initializing MongoDB Watch...`);
  
  // Watch for new sensor payloads being inserted
  const changeStream = SensorData.watch([{ $match: { operationType: 'insert' } }]);

  changeStream.on('change', (change) => {
    if (change.operationType === 'insert') {
      const payload = change.fullDocument;
      
      // Next Phase mein hum yahan Upstash Redis Pub/Sub laga kar 
      // data ko WebSockets ke through React UI par push karenge.
      console.log(`[Live Data Alert] New telemetry from ${payload.deviceId} at coordinates [${payload.location.coordinates}]`);
    }
  });

  changeStream.on('error', (error) => {
    console.error(`[ChangeStream Error]`, error);
  });
};