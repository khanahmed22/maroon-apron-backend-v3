import { Server } from "socket.io";

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        try {
          const url = new URL(origin);

          // Admin frontend
          if (origin === process.env.CRIMSON_ADMIN_URL) {
            return callback(null, true);
          }

           // Capacitor Android app
 if (origin === "https://android.maroonapron.com") {
  return callback(null, true);
}
          // Any *.localhost:3001
          if (
            url.hostname.endsWith(".localhost") &&
            url.port === "3001"
          ) {
            return callback(null, true);
          }

          // Production Maroon Apron subdomains
          if (url.hostname.endsWith(process.env.CRIMSON_HOSTNAME)) {
            return callback(null, true);
          }

          callback(new Error("Origin not allowed"));
        } catch {
          callback(new Error("Invalid origin"));
        }
      },
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`Connected: ${socket.id}`);

    socket.on("joinRestaurant", (restId) => {
      socket.join(restId);
      console.log(`${socket.id} joined ${restId}`);
    });

    socket.on("leaveRestaurant", (restId) => {
      socket.leave(restId);
      console.log(`${socket.id} left ${restId}`);
    });

    socket.on("disconnect", () => {
      console.log(`${socket.id} disconnected`);
    });
  });
}

export function getIO() {
  return io;
}