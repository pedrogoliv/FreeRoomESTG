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

## 📂 Estrutura do Repositório

```
FreeRoomESTG/
├── backend/         # API, Conexão à BD e Scraping
├── frontend/        # Interface React, Mapas e Componentes
└── README.md        # Documentação do projeto
```

---

## 🤖 Declaração de Uso de IA

Neste projeto, foi utilizada a ferramenta de Inteligência Artificial **Google Gemini** como recurso principal de auxílio ao desenvolvimento.

**Utilização Específica:**
* **Frontend (CSS/React):** Apoio integral na estruturação do design responsivo, criação dos componentes visuais e definição do estilo gráfico da aplicação.
* **Backend e Base de Dados:** Suporte na estruturação da API REST, definição dos modelos de dados e lógica dos controladores.
* **Funcionalidades e Integração:** Auxílio na implementação da lógica de comunicação em tempo real e autenticação.

**Reflexão e Adaptação:**
O conteúdo gerado pela IA funcionou como base estrutural e material de consulta técnica acelerada. Todo o código gerado foi posteriormente **analisado, testado e adaptado** para garantir o funcionamento correto do sistema.
A gestão de estados no React e a lógica de validação de conflitos de horários, em particular, exigiram intervenção manual, ajustes de lógica e depuração por parte do grupo para cumprir os requisitos específicos do projeto.

---

## 🎓 Autores

Trabalho realizado no âmbito da Unidade Curricular de **Sistemas de Informação em Rede** (2025/26), Licenciatura em Engenharia Informática — **ESTG | IPVC**.

| Nome | Número | GitHub |
| :--- | :---: | :---: |
| **Paulo Simões** | 31377 | [@paulosimoess](https://github.com/paulosimoess) |
| **Francisco Matos** | 31406 | [@FranciscoOMatos](https://github.com/FranciscoOMatos) |
| **José Oliveira** | 31408 | [@pedrogoliv](https://github.com/pedrogoliv) |

**Docente:** Prof. Pedro Moreira