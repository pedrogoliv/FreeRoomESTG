const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/users/:username", userController.getUser);
router.put("/users/:username", userController.updateUser);
router.get("/users/:username/stats", userController.getUserStats);
router.get("/favoritos/:username", userController.getFavoritos);
router.post("/favoritos", userController.toggleFavorito);

module.exports = router;