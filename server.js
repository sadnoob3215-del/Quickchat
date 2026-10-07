const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

const users = new Map();

io.on("connection", (socket) => {
    socket.on("join", (name) => {
        name = String(name).trim().slice(0, 20);

        if (!name) {
            return;
        }

        users.set(socket.id, name);

        socket.emit("joined", {
            name
        });

        io.emit("system", `${name}님이 입장했습니다.`);
    });

    socket.on("message", (message) => {
        const name = users.get(socket.id);

        if (!name) return;

        message = String(message).trim();

        if (!message) return;

        // 너무 긴 메시지 방지
        message = message.slice(0, 500);

        io.emit("message", {
            name,
            message
        });
    });

    socket.on("disconnect", () => {
        const name = users.get(socket.id);

        if (name) {
            io.emit("system", `${name}님이 나갔습니다.`);
            users.delete(socket.id);
        }
    });
});

server.listen(PORT, () => {
    console.log(`QuickChat 실행 중: http://localhost:${PORT}`);
});
