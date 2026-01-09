const Curso = require("../models/Curso");

// Lista completa retirada do teu server.js original
const CURSOS_SEED = [
  "Design de Ambientes",
  "Design do Produto",
  "Engenharia Alimentar",
  "Engenharia Civil e do Ambiente",
  "Engenharia da Computação Gráfica e Multimédia",
  "Engenharia de Redes e Sistemas de Computadores",
  "Engenharia Informática",
  "Engenharia Mecânica",
  "Engenharia Mecatrónica",
  "Gastronomia e Artes Culinárias",
  "Gestão",
  "Gestão (nocturno)",
  "Tecnologia Alimentar e Nutrição",
  "Turismo",
];

exports.seedCursos = async () => {
  try {
    const count = await Curso.countDocuments();
    if (count === 0) {
      await Curso.insertMany(CURSOS_SEED.map((nome) => ({ nome })));
      console.log("✅ Cursos inseridos na BD (seed inicial).");
    }
  } catch (e) {
    console.error("❌ Erro a seedar cursos:", e);
  }
};

exports.getCursos = async (req, res) => {
  try {
    const cursos = await Curso.find().sort({ nome: 1 }).select("nome -_id");
    res.json({ success: true, cursos: cursos.map((c) => c.nome) });
  } catch (e) {
    console.error("❌ Erro /api/cursos:", e);
    res.status(500).json({ success: false, message: "Erro ao obter cursos" });
  }
};