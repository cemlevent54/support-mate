const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');
const logger = require('./logger.config.js');

function setupSocketProxy(httpServer) {
  // Socket.io server (frontend için)
  const io = new Server(httpServer, {
    path: '/ws/socket.io/',
    cors: { origin: '*' }
  });

  // Ticket-service socket.io client (backend için)
  const ticketServiceSocket = Client('ws://localhost:8086', {
    path: '/socket.io/',
    transports: ['websocket']
  });

  io.on('connection', (socket) => {
    logger.info(`[SOCKET][GATEWAY] Frontend client connected: ${socket.id}`);

    socket.onAny((event, ...args) => {
      logger.info(`[SOCKET][GATEWAY] Event from frontend: ${event} | Payload: ${JSON.stringify(args)}`);
      ticketServiceSocket.emit(event, ...args);
    });

    ticketServiceSocket.onAny((event, ...args) => {
      logger.info(`[SOCKET][GATEWAY] Event from ticket-service: ${event} | Payload: ${JSON.stringify(args)}`);
      socket.emit(event, ...args);
    });

    socket.on('disconnect', () => {
      logger.info(`[SOCKET][GATEWAY] Frontend client disconnected: ${socket.id}`);
    });
  });

  ticketServiceSocket.on('connect', () => {
    logger.info('[SOCKET][GATEWAY] Connected to ticket-service socket');
  });
  ticketServiceSocket.on('disconnect', () => {
    logger.info('[SOCKET][GATEWAY] Disconnected from ticket-service socket');
  });
  ticketServiceSocket.on('connect_error', (err) => {
    logger.error(`[SOCKET][GATEWAY] Connection error to ticket-service: ${err.message}`);
  });
}

module.exports = setupSocketProxy;
