import { Server } from "socket.io"

const userSocketMap = {}

export const getSocketId = (receiverId) => {
    return userSocketMap[receiverId]
}

export const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    })

    io.on("connection", (socket) => {
        console.log(`New socket connection: ${socket.id}`)
        
        const userId = socket.handshake.query.userId
        if (userId != "undefined") {
            userSocketMap[userId] = socket.id
            console.log(`User ${userId} connected with socket ${socket.id}`)
        }

        io.emit('getOnlineUsers', Object.keys(userSocketMap))
        console.log('Online users:', Object.keys(userSocketMap))

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`)
            if (userId != "undefined") {
                delete userSocketMap[userId]
                console.log(`User ${userId} disconnected`)
            }
            io.emit('getOnlineUsers', Object.keys(userSocketMap))
        })
    })

    return io
}

export { userSocketMap }
