const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');

function setupSocketProxy(httpServer) {
  // Socket.io server (frontend için)
  const io = new Server(httpServer, {
    path: '/ws',
    cors: { origin: '*' }
  });

  // Ticket-service socket.io client (backend için)
  const ticketServiceSocket = Client('ws://localhost:8086', {
    path: '/ws',
    transports: ['websocket']
  });

  // Event proxy: frontend <-> api-gateway <-> ticket-service
  io.on('connection', (socket) => {
    // Frontend'den gelen eventleri ticket-service'e ilet
    socket.onAny((event, ...args) => {
      ticketServiceSocket.emit(event, ...args);
    });
    // ticket-service'ten gelen eventleri frontend'e ilet
    ticketServiceSocket.onAny((event, ...args) => {
      socket.emit(event, ...args);
    });
  });
}

module.exports = setupSocketProxy;
