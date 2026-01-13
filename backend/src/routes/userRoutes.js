const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController"); // Confirma se o caminho está certo!

// --- MULTER CONFIG ---
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.params.username + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });
// ---------------------

// Rotas Normais
router.get("/users/:username", userController.getUser);
router.put("/users/:username", userController.updateUser);
router.get("/users/:username/stats", userController.getUserStats);

// Rota da Foto (Só esta usa o upload)
router.put("/users/:username/foto", upload.single('foto'), userController.uploadFoto);

// Rotas Favoritos
router.get("/favoritos/:username", userController.getFavoritos);
router.post("/favoritos", userController.toggleFavorito);

module.exports = router;