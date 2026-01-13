require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const path = require('path');

const connectDB = require("./src/config/db");

const cursoController = require("./src/controllers/cursoController");

const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const reservaRoutes = require("./src/routes/reservaRoutes");
const salaRoutes = require("./src/routes/salaRoutes");
const cursoRoutes = require("./src/routes/cursoRoutes");

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173", 
    "https://freeroom-estg.vercel.app", 
    "https://freeroomestgvercel.vercel.app" 
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// -------------------------------------

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173", 
      "https://freeroom-estg.vercel.app",
      "https://freeroomestgvercel.vercel.app"
    ],
    methods: ["GET", "POST"]
  }
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

connectDB();

mongoose.connection.once("open", () => {
  cursoController.seedCursos();
});

app.use("/auth", authRoutes);
app.use("/api", userRoutes);
app.use("/api", reservaRoutes);
app.use("/api", salaRoutes);
app.use("/api", cursoRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Servidor a correr na porta ${PORT}`));