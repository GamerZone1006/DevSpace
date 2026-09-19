const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const { connectRedis } = require("./config/redis");
const configureSocket = require("./socket");

const connectDB = require("./config/db");

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: { origin: true, credentials: true }
});

configureSocket(io);

connectDB();
connectRedis();

try {
    require("./workers/mediaWorker");
} catch (error) {
    console.error("Media worker failed to start:", error.message);
}

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "DevSpace API is running"
    });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));
app.use("/api/comments", require("./routes/commentRoutes"));
app.use("/api/follow", require("./routes/followRoutes"));
app.use("/api/feed", require("./routes/feedRoutes"));
app.use("/api/watch", require("./routes/watchRoutes"));
app.use("/api/engagement", require("./routes/engagementRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/search", require("./routes/searchRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
