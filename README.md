# FreeRoomESTG

FreeRoomESTG é uma aplicação colaborativa para ajudar os estudantes da ESTG a encontrar salas de estudo disponíveis em tempo real. A aplicação obtém automaticamente os horários das salas através de scraping do ON.IPVC, permitindo reservas, favoritos e visualização da planta da escola.

---

🚀 Instalação inicial

Dentro da pasta backend, correr:

npm init -y
npm install express mongoose cors dotenv
npm install --save-dev nodemon

🔐 Ficheiros de ambiente

Criar um ficheiro .env dentro da pasta backend:

PORT=5000
MONGO_URI=<colocar_aqui_a_connection_string_do_mongodb>


⚠️ Este ficheiro NÃO é enviado para o GitHub, porque contém credenciais sensíveis.

Criar também um .env.example (este SIM vai para o GitHub):

PORT=5000
MONGO_URI=sua_connection_string_aqui

🛠️ Tecnologias utilizadas
Backend

Node.js + Express

MongoDB (Mongoose)

Scraping (Cheerio / Puppeteer)

Socket.IO

JWT

Postman

Frontend

HTML, CSS, JavaScript

Figma

Deploy

Render (backend)

Vercel (frontend)

📁 Estrutura inicial do projeto
FreeRoomESTG/
 ├── backend/
 │    ├── server.js
 │    ├── .env
 │    ├── .env.example
 │    ├── package.json
 │    ├── src/
 │    │    ├── models/
 │    │    ├── controllers/
 │    │    ├── routes/
 │    │    ├── services/
 │    │    └── config/
 │    │         └── db.js
 │    └── node_modules/
 └── frontend/  (a criar futuramente)

👥 Autores

Paulo Simões – 31377

Francisco Matos – 31406

José Oliveira – 31408

Curso: Engenharia Informática — ESTG | IPVC
Unidade Curricular: Sistemas de Informação em Rede (2025/26)
Docente: Prof. Pedro Moreira
