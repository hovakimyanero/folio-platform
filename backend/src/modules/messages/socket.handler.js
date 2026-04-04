import jwt from 'jsonwebtoken';

export function socketHandler(io, prisma) {
  // Auth middleware for sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie?.match(/accessToken=([^;]+)/)?.[1];
    if (!token) return next(new Error('Authentication required'));

    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`[WS] User connected: ${userId}`);

    // Join personal room for notifications
    socket.join(userId);

    // Typing indicator
    socket.on('typing', ({ receiverId }) => {
      io.to(receiverId).emit('typing', { userId });
    });

    socket.on('stop_typing', ({ receiverId }) => {
      io.to(receiverId).emit('stop_typing', { userId });
    });

    // Mark messages as read
    socket.on('mark_read', async ({ senderId }) => {
      await prisma.message.updateMany({
        where: { senderId, receiverId: userId, read: false },
        data: { read: true },
      });
      io.to(senderId).emit('messages_read', { userId });
    });

    socket.on('disconnect', () => {
      console.log(`[WS] User disconnected: ${userId}`);
    });
  });
}
