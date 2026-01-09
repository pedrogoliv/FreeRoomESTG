const express = require("express");
const router = express.Router();
const salaController = require("../controllers/salaController");

router.get("/feriados", salaController.getFeriados);
router.get("/salas-livres", salaController.getSalasLivres);
router.get("/salas", salaController.getAllSalas);
router.get("/salas/:sala/status", salaController.getSalaStatus);

module.exports = router;