const User = require("../models/User");
const Curso = require("../models/Curso");

exports.register = async (req, res) => {
  const { curso, numero, username, password } = req.body;

  try {
    if (!curso || !username || !password) {
      return res.status(400).json({ success: false, message: "Faltam campos obrigatórios." });
    }

    const cursoNorm = String(curso).trim();
    const existeCurso = await Curso.exists({ nome: cursoNorm });
    if (!existeCurso) {
      return res.status(400).json({ success: false, message: "Curso inválido." });
    }

    if (numero === undefined || numero === null || String(numero).trim() === "") {
      return res.status(400).json({ success: false, message: "Número é obrigatório." });
    }

    const numeroNorm = String(numero).trim();
    if (!/^\d+$/.test(numeroNorm)) {
      return res.status(400).json({ success: false, message: "Número inválido (apenas dígitos)." });
    }

    const usernameTrim = String(username).trim();

    const existingUser = await User.findOne({ username: usernameTrim });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Username já existe." });
    }

    const existingNumero = await User.findOne({ numero: numeroNorm });
    if (existingNumero) {
      return res.status(400).json({ success: false, message: "Esse número já está registado." });
    }

    const newUser = new User({
      curso: cursoNorm,
      numero: numeroNorm,
      username: usernameTrim,
      password,
      favoritos: [],
    });

    await newUser.save();

    return res.json({
      success: true,
      user: {
        id: newUser._id,
        username: newUser.username,
        curso: newUser.curso,
        numero: newUser.numero,
        favoritos: newUser.favoritos,
        tipo: newUser.tipo,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao registar:", error);
    return res.status(500).json({ success: false, message: "Erro ao registar" });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username: String(username).trim() });

    if (!user) {
      return res.status(401).json({ success: false, message: "Utilizador não encontrado." });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Password errada." });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        curso: user.curso,
        numero: user.numero,
        favoritos: user.favoritos,
        tipo: user.tipo,
      },
    });
  } catch (error) {
    console.error("🔥 CRASH:", error);
    return res.status(500).json({ success: false, message: "Erro no servidor" });
  }
};