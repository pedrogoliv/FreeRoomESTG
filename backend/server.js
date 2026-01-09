require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// Config
const connectDB = require("./src/config/db");

// Controllers (just for seeding)
const cursoController = require("./src/controllers/cursoController");

// Routes
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const reservaRoutes = require("./src/routes/reservaRoutes");
const salaRoutes = require("./src/routes/salaRoutes");
const cursoRoutes = require("./src/routes/cursoRoutes");

// App Init
const app = express();
app.use(cors());
app.use(express.json());

// Database Connection
connectDB();

// Seeding (Once DB is open)
mongoose.connection.once("open", () => {
  cursoController.seedCursos();
});

// Use Routes
// Note: I mapped them to /api/ or /auth/ based on your original file
app.use("/auth", authRoutes); // /auth/login, /auth/registar
app.use("/api", userRoutes);  // /api/users..., /api/favoritos...
app.use("/api", reservaRoutes); // /api/reservas...
app.use("/api", salaRoutes);    // /api/salas...
app.use("/api", cursoRoutes);   // /api/cursos

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor a correr na porta ${PORT}`));