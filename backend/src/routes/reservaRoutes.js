const express = require("express");
const router = express.Router();
const reservaController = require("../controllers/reservaController");

router.post("/reservar", reservaController.criarReserva);
router.get("/reservas-historico/:username", reservaController.getHistorico);
router.get("/reservas/:username", reservaController.getReservasUser);
router.put("/reservas/:reservaId", reservaController.updateReserva);
router.delete("/reservas/:reservaId", reservaController.deleteReserva);

module.exports = router;