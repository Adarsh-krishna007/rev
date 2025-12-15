import { Server } from "socket.io";

const userSocketMap = {};

// shared io instance
let io;

/* ================= GET SOCKET ID ================= */
export const getSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

/* ================= INIT SOCKET ================= */
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "https://revf.onrender.com"
      ],
      credentials: true,
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("🔌 New socket connection:", socket.id);

    const userId = socket.handshake.query.userId;

    if (userId && userId !== "undefined") {
      userSocketMap[userId] = socket.id;
      console.log(`✅ User ${userId} connected`);
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);

      if (userId && userId !== "undefined") {
        delete userSocketMap[userId];
        console.log(`🚪 User ${userId} disconnected`);
      }

      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });

  return io;
};

/* ================= EXPORT IO ================= */
export { io };
