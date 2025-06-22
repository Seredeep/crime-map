const { MongoClient, ObjectId } = require('mongodb');

// Configuración de MongoDB
const client = new MongoClient(process.env.MONGODB_URI);
let db;

// Conectar a MongoDB
async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db();
  }
  return db;
}

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`✅ Usuario conectado: ${socket.id}`);

    // Manejar unión a chat
    socket.on('chat:join', async ({ chatId, userId }) => {
      try {
        const database = await connectDB();

        // Verificar que el usuario pertenece al chat
        const user = await database.collection('users').findOne({ _id: new ObjectId(userId) });
        if (!user) {
          socket.emit('message:error', 'Usuario no encontrado');
          return;
        }

        // Verificar pertenencia al chat de manera más robusta
        const userChatId = user.chatId ? user.chatId.toString() : null;
        const targetChatId = chatId.toString();

        if (!userChatId || userChatId !== targetChatId) {
          console.log(`❌ Usuario ${user.email} no pertenece al chat ${targetChatId}, su chat es: ${userChatId}`);
          socket.emit('message:error', 'No tienes acceso a este chat');
          return;
        }

        // Verificar que el chat existe y el usuario está en la lista de participantes
        const chat = await database.collection('chats').findOne({ _id: new ObjectId(chatId) });
        if (!chat) {
          socket.emit('message:error', 'Chat no encontrado');
          return;
        }

        const isParticipant = chat.participants.some(participantId =>
          participantId.toString() === userId.toString()
        );

        if (!isParticipant) {
          console.log(`❌ Usuario ${user.email} no está en la lista de participantes del chat ${chatId}`);
          socket.emit('message:error', 'No estás registrado como participante de este chat');
          return;
        }

        // Unirse a la sala del chat
        await socket.join(chatId);
        socket.chatId = chatId;
        socket.userId = userId;
        socket.userName = user.name || user.email;

        // Notificar a otros usuarios
        socket.to(chatId).emit('chat:user-joined', {
          userId,
          userName: user.name || user.email
        });

        console.log(`👥 Usuario ${user.name || user.email} se unió al chat ${chatId}`);
      } catch (error) {
        console.error('Error al unirse al chat:', error);
        socket.emit('message:error', 'Error al unirse al chat');
      }
    });

    // Manejar salida del chat
    socket.on('chat:leave', ({ chatId, userId }) => {
      socket.leave(chatId);
      socket.to(chatId).emit('chat:user-left', {
        userId,
        userName: socket.userName || 'Usuario'
      });
      console.log(`👋 Usuario ${socket.userName} salió del chat ${chatId}`);
    });

    // Manejar envío de mensajes
    socket.on('message:send', async (data, callback) => {
      try {
        const { chatId, message, userId, userName } = data;
        const database = await connectDB();

        // Verificar que el usuario pertenece al chat
        const user = await database.collection('users').findOne({ _id: new ObjectId(userId) });
        if (!user) {
          callback({ success: false, message: 'Usuario no encontrado' });
          return;
        }

        // Verificar pertenencia al chat de manera más robusta
        const userChatId = user.chatId ? user.chatId.toString() : null;
        const targetChatId = chatId.toString();

        if (!userChatId || userChatId !== targetChatId) {
          console.log(`❌ Usuario ${user.email} no pertenece al chat ${targetChatId}, su chat es: ${userChatId}`);
          callback({ success: false, message: 'No tienes acceso a este chat' });
          return;
        }

        // Verificar que el chat existe y el usuario está en la lista de participantes
        const chat = await database.collection('chats').findOne({ _id: new ObjectId(chatId) });
        if (!chat) {
          callback({ success: false, message: 'Chat no encontrado' });
          return;
        }

        const isParticipant = chat.participants.some(participantId =>
          participantId.toString() === userId.toString()
        );

        if (!isParticipant) {
          console.log(`❌ Usuario ${user.email} no está en la lista de participantes del chat ${chatId}`);
          callback({ success: false, message: 'No estás registrado como participante de este chat' });
          return;
        }

        // Guardar mensaje en la base de datos
        const newMessage = {
          chatId,
          userId,
          userName: user.name || user.email,
          message,
          timestamp: new Date(),
          type: 'normal'
        };

        const result = await database.collection('messages').insertOne(newMessage);
        const savedMessage = {
          ...newMessage,
          id: result.insertedId.toString(),
          _id: result.insertedId,
          isOwn: false // Se determinará en el cliente
        };

        // Enviar mensaje a todos los usuarios del chat
        io.to(chatId).emit('message:new', savedMessage);

        // Confirmar al remitente
        callback({ success: true, data: savedMessage });

        console.log(`💬 Mensaje enviado en chat ${chatId} por ${userName}`);
      } catch (error) {
        console.error('Error al enviar mensaje:', error);
        callback({ success: false, message: 'Error al enviar mensaje' });
      }
    });

    // Manejar mensajes de pánico
    socket.on('panic:send', async (data, callback) => {
      try {
        const { chatId, message, userId, userName, location } = data;
        const database = await connectDB();

        // Verificar que el usuario pertenece al chat
        const user = await database.collection('users').findOne({ _id: new ObjectId(userId) });
        if (!user) {
          callback({ success: false, message: 'Usuario no encontrado' });
          return;
        }

        // Verificar pertenencia al chat de manera más robusta
        const userChatId = user.chatId ? user.chatId.toString() : null;
        const targetChatId = chatId.toString();

        if (!userChatId || userChatId !== targetChatId) {
          console.log(`❌ Usuario ${user.email} no pertenece al chat ${targetChatId}, su chat es: ${userChatId}`);
          callback({ success: false, message: 'No tienes acceso a este chat' });
          return;
        }

        // Verificar que el chat existe y el usuario está en la lista de participantes
        const chat = await database.collection('chats').findOne({ _id: new ObjectId(chatId) });
        if (!chat) {
          callback({ success: false, message: 'Chat no encontrado' });
          return;
        }

        const isParticipant = chat.participants.some(participantId =>
          participantId.toString() === userId.toString()
        );

        if (!isParticipant) {
          console.log(`❌ Usuario ${user.email} no está en la lista de participantes del chat ${chatId}`);
          callback({ success: false, message: 'No estás registrado como participante de este chat' });
          return;
        }

        // Guardar mensaje de pánico
        const panicMessage = {
          chatId,
          userId,
          userName: user.name || user.email,
          message,
          timestamp: new Date(),
          type: 'panic',
          metadata: {
            location: location || null,
            priority: 'high'
          }
        };

        const result = await database.collection('messages').insertOne(panicMessage);
        const savedMessage = {
          ...panicMessage,
          id: result.insertedId.toString(),
          _id: result.insertedId,
          isOwn: false
        };

        // Enviar alerta de pánico a todos los usuarios del chat
        io.to(chatId).emit('panic:alert', savedMessage);

        // Confirmar al remitente
        callback({ success: true, data: savedMessage });

        console.log(`🚨 Mensaje de pánico enviado en chat ${chatId} por ${userName}`);
      } catch (error) {
        console.error('Error al enviar mensaje de pánico:', error);
        callback({ success: false, message: 'Error al enviar mensaje de pánico' });
      }
    });

    // Manejar indicador de escritura
    socket.on('chat:typing', ({ chatId, userId, userName }) => {
      socket.to(chatId).emit('chat:typing', { userId, userName });
    });

    socket.on('chat:stop-typing', ({ chatId, userId }) => {
      socket.to(chatId).emit('chat:stop-typing', { userId });
    });

    // Manejar desconexión
    socket.on('disconnect', (reason) => {
      console.log(`❌ Usuario desconectado: ${socket.id} (${reason})`);

      if (socket.chatId && socket.userId) {
        socket.to(socket.chatId).emit('chat:user-left', {
          userId: socket.userId,
          userName: socket.userName || 'Usuario'
        });
      }
    });
  });
}

module.exports = { setupSocketHandlers };
