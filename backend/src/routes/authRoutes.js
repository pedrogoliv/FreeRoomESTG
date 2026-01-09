const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/registar", authController.register);
router.post("/register", authController.register); // Alias
router.post("/login", authController.login);

module.exports = router;