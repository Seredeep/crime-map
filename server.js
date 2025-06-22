const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Configurar Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

console.log('🚀 Iniciando servidor...');

app.prepare().then(() => {
  console.log('✅ Next.js preparado');

  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('❌ Error manejando request:', req.url, err);
      res.statusCode = 500;
      res.end('Error interno del servidor');
    }
  });

  // Intentar configurar Socket.IO
  let io;
  try {
    const { Server } = require('socket.io');

    io = new Server(server, {
      path: '/socket.io',
      cors: {
        origin: dev ? ['http://localhost:3000'] : [process.env.NEXT_PUBLIC_APP_URL || '*'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    console.log('✅ Socket.IO configurado');

    // Configurar handlers básicos de Socket.IO
    io.on('connection', (socket) => {
      console.log(`✅ Usuario conectado: ${socket.id}`);

      // Handlers básicos sin dependencias externas
      socket.on('chat:join', ({ chatId, userId }) => {
        socket.join(chatId);
        socket.chatId = chatId;
        socket.userId = userId;
        console.log(`👥 Usuario se unió al chat ${chatId}`);
      });

      socket.on('chat:leave', ({ chatId }) => {
        socket.leave(chatId);
        console.log(`👋 Usuario salió del chat ${chatId}`);
      });

      socket.on('chat:typing', ({ chatId, userId, userName }) => {
        socket.to(chatId).emit('chat:typing', { userId, userName });
      });

      socket.on('chat:stop-typing', ({ chatId, userId }) => {
        socket.to(chatId).emit('chat:stop-typing', { userId });
      });

      socket.on('disconnect', (reason) => {
        console.log(`❌ Usuario desconectado: ${socket.id} (${reason})`);
      });
    });

    // Intentar cargar handlers avanzados
    try {
      const { setupSocketHandlers } = require('./src/lib/socketHandlers');
      setupSocketHandlers(io);
      console.log('✅ Handlers avanzados de Socket.IO cargados');
    } catch (handlerError) {
      console.warn('⚠️ No se pudieron cargar los handlers avanzados:', handlerError.message);
      console.log('📡 Usando handlers básicos de Socket.IO');
    }

  } catch (socketError) {
    console.warn('⚠️ No se pudo configurar Socket.IO:', socketError.message);
    console.log('📡 Servidor funcionando sin WebSockets (solo HTTP)');
  }

  server
    .once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Puerto ${port} ya está en uso`);
        console.log('💡 Intenta cerrar otros procesos o usar otro puerto');
      } else {
        console.error('❌ Error del servidor:', err);
      }
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`🎉 Servidor listo en http://${hostname}:${port}`);
      if (io) {
        console.log('🔌 WebSockets disponibles en /socket.io');
      } else {
        console.log('📡 Solo HTTP disponible (sin WebSockets)');
      }
      console.log('');
      console.log('🚀 ¡Aplicación lista para usar!');
    });

}).catch((err) => {
  console.error('❌ Error preparando Next.js:', err);
  console.log('');
  console.log('💡 Intenta usar el servidor estándar de Next.js:');
  console.log('   npm run dev:next');
  process.exit(1);
});
