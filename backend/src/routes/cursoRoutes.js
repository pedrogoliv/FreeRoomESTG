const express = require("express");
const router = express.Router();
const cursoController = require("../controllers/cursoController");

router.get("/cursos", cursoController.getCursos);

module.exports = router;