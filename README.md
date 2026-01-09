# FreeRoomESTG 📚

![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-yellow)
![IPVC](https://img.shields.io/badge/Instituição-ESTG%20|%20IPVC-blue)
![License](https://img.shields.io/badge/License-MIT-green)

**Aplicação web colaborativa para gestão e visualização de ocupação de salas na ESTG.**

O sistema permite consultar horários em tempo real (via scraping do ON.IPVC), reservar espaços livres e visualizar a planta da escola de forma interativa, facilitando a vida aos estudantes que procuram um local tranquilo para estudar.

---

## 🚀 Funcionalidades Principais

* 📍 **Mapa Interativo:** Visualização das plantas dos pisos (1, 2 e 3) com indicação visual das salas.
* 📅 **Horários em Tempo Real:** Scraping automático da plataforma ON.IPVC para saber se uma sala está a ter aulas.
* 🔒 **Reservas:** Sistema para os alunos marcarem salas livres para estudo de grupo.
* ⚡ **Atualização ao Vivo:** Backend otimizado para fornecer dados atualizados rapidamente.

---

## 🛠️ Stack Tecnológica

O projeto está dividido em dois módulos principais:

### **Backend (API)**
* ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=flat&logo=node.js&logoColor=white) **Node.js & Express** - Servidor e API REST.
* ![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=flat&logo=mongodb&logoColor=white) **MongoDB (Atlas)** - Base de dados NoSQL.
* 🤖 **Puppeteer/Cheerio** - Web scraping de horários.
* 🔐 **Dotenv** - Gestão de variáveis de ambiente.

### **Frontend (Interface)**
* ![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB) **React.js** - Biblioteca para construção da UI.
* ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white) **Vite** - Build tool rápida.
* 🎨 **CSS Modules** - Estilização dos componentes e mapas.

---

## ⚙️ Configuração e Instalação

Para correres o projeto localmente, precisas de configurar tanto o servidor (backend) como a interface (frontend).

### Pré-requisitos
* [Node.js](https://nodejs.org/) instalado.
* Git instalado.

### 1. Configurar o Backend

Navega até à pasta do servidor e instala as dependências:

```bash
cd backend
npm install
```

Cria um ficheiro `.env` na pasta `backend/` com as tuas credenciais (exemplo):

```env
PORT=5000
# Substitui <password> pela tua password real do MongoDB
MONGO_URI=mongodb+srv://pedrogoliv:<password>@salasocupadas.odtfbm2.mongodb.net/freeroom_estg?appName=SalasOCUPADAS
```

Inicia o servidor:

```bash
npm run dev
```

### 2. Configurar o Frontend

Abre um **novo terminal**, navega até à pasta do frontend e instala as dependências:

```bash
cd frontend
npm install
```

Inicia a aplicação web:

```bash
npm run dev
```

O site estará disponível em `http://localhost:5173`.

---

## 📂 Estrutura do Repositório

```
FreeRoomESTG/
├── backend/         # API, Conexão à BD e Scraping
├── frontend/        # Interface React, Mapas e Componentes
├── .gitignore       # Ficheiros ignorados pelo Git
└── README.md        # Documentação do projeto
```

---

## 🎓 Autores

Trabalho realizado no âmbito da Unidade Curricular de **Sistemas de Informação em Rede** (2025/26), Licenciatura em Engenharia Informática — **ESTG | IPVC**.

| Nome | Número | GitHub |
| :--- | :---: | :---: |
| **Paulo Simões** | 31377 | [@user](https://github.com/) |
| **Francisco Matos** | 31406 | [@user](https://github.com/) |
| **José Oliveira** | 31408 | [@pedrogoliv](https://github.com/pedrogoliv) |

**Docente:** Prof. Pedro Moreira