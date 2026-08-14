import { Server, Socket } from 'socket.io';

export const registerTelemetrySockets = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    // Client joins the telemetry broadcast room
    socket.join('live_telemetry');
    console.log(`[Socket] Node ${process.pid} connected client: ${socket.id}`);

    socket.on('join_dashboard', () => {
      socket.join('live_telemetry');
    });

    // Handle Two-Way Hardware Emergency Override from UI
    socket.on('EMERGENCY_SHUTDOWN', (data) => {
      console.log(`[Socket Worker ${process.pid}] 🛑 EMERGENCY OVERRIDE RECEIVED from UI:`, data);
      if (process.send) {
        process.send({ type: 'MQTT_EMERGENCY_OUTBOUND', payload: JSON.stringify(data) });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Node ${process.pid} disconnected client ${socket.id} (Reason: ${reason})`);
    });
  });
};