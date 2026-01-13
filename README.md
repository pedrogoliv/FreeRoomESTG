# FreeRoomESTG 📚

![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-yellow)
![IPVC](https://img.shields.io/badge/Instituição-ESTG%20|%20IPVC-blue)


**Aplicação web colaborativa para gestão e visualização de ocupação de salas na ESTG.**

O sistema permite consultar horários de salas (com base em dados importados do ON.IPVC), reservar espaços livres e visualizar a planta da escola de forma interativa. A gestão da ocupação é dinâmica, atualizando-se sempre que um utilizador realiza uma reserva diretamente na aplicação.

---

## 🚀 Funcionalidades Principais

* 📍 **Mapa Interativo:** Visualização das plantas dos pisos (1, 2 e 3) com indicação visual das salas.
* 📅 **Consulta de Horários:** Base de dados populada via *web scraping* (ON.IPVC) com a informação letiva das salas.
* 🔒 **Sistema de Reservas:** Permite aos alunos marcar salas como "Ocupadas" diretamente na aplicação.
* ⚡ **Tempo Real:** Atualização instantânea da ocupação das salas via WebSockets (Socket.IO).
* ⚙️ **Gestão Centralizada:** O estado da sala (Livre/Ocupada) cruza o horário letivo importado com as reservas manuais.

---

## 🛠️ Stack Tecnológica

### **Backend (API)**
* **Node.js & Express** - Servidor e API REST.
* **MongoDB (Atlas)** - Base de dados.
* **Socket.IO** - Comunicação em tempo real entre servidor e cliente.
* **Bcrypt.js** - Hashing e segurança de passwords.
* **Dotenv** - Gestão de variáveis de ambiente.

### **Frontend (Interface)**
* **React.js** - Biblioteca para construção da UI.
* **Vite** - Build tool rápida.
* **Socket.IO Client** - Receção de eventos em tempo real.
* **CSS Modules** - Estilização responsiva e componentes visuais.

---

## ⚙️ Configuração e Instalação

### Pré-requisitos
* [Node.js](https://nodejs.org/) instalado.

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

```bash
cd frontend
npm install
```

Inicia a aplicação web:

```bash
npm run dev
```


## 📂 Estrutura do Repositório

```
FreeRoomESTG/
├── backend/         # API, Conexão à BD e Scraping
├── frontend/        # Interface React, Mapas e Componentes
├── .gitignore       # Ficheiros ignorados pelo Git
└── README.md        # Documentação do projeto
```

---

## 🤖 Declaração de Uso de IA

Neste projeto, foi utilizada exclusivamente a ferramenta de Inteligência Artificial **Google Gemini** para auxílio no desenvolvimento de funcionalidades específicas e resolução de problemas técnicos.

**Utilização Específica:**
* **Frontend (CSS/React):** Apoio na estruturação do design responsivo, correções de carregamento de fontes e implementação de efeitos visuais (*glassmorphism*) na Landing Page.
* **Tempo Real (Socket.IO):** Geração de exemplos de implementação para a comunicação bidirecional entre o Backend e o Dashboard (`emit` e `on`), permitindo a atualização automática da ocupação.
* **Segurança (Auth):** Explicação e exemplos de código para a integração do `bcryptjs` no middleware do Mongoose para encriptação de passwords.

**Reflexão e Adaptação:**
O conteúdo gerado pela IA funcionou como ponto de partida e material de consulta técnica. Todo o código foi analisado, testado e significativamente adaptado para corresponder à arquitetura MVC do projeto e às regras de negócio específicas da ESTG. A gestão de estados no React e a lógica de validação de conflitos de horários exigiram intervenção manual e depuração por parte do grupo.

---

## 🎓 Autores

Trabalho realizado no âmbito da Unidade Curricular de **Sistemas de Informação em Rede** (2025/26), Licenciatura em Engenharia Informática — **ESTG | IPVC**.

| Nome | Número | GitHub |
| :--- | :---: | :---: |
| **Paulo Simões** | 31377 | [@paulosimoess](https://github.com/paulosimoess) |
| **Francisco Matos** | 31406 | [@FranciscoOMatos](https://github.com/FranciscoOMatos) |
| **José Oliveira** | 31408 | [@pedrogoliv](https://github.com/pedrogoliv) |

**Docente:** Prof. Pedro Moreira