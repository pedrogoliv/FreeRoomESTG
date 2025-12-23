FreeRoomESTG 📚
Aplicação web colaborativa para gestão e visualização de ocupação de salas na ESTG. O sistema permite consultar horários em tempo real (via scraping do ON.IPVC), reservar espaços livres e visualizar a planta da escola, facilitando a vida aos estudantes que procuram um local para estudar.

🛠️ Stack Tecnológica
Backend: Node.js, Express

Base de Dados: MongoDB (Atlas)

Outros: Mongoose, Cheerio/Puppeteer (Scraping), Dotenv

⚙️ Configuração e Instalação
1. Preparar o Backend
Certifica-te que tens o Node.js instalado. Depois, navega até à pasta do servidor e instala as dependências:

cd backend
npm install

2. Variáveis de Ambiente
O projeto necessita de credenciais de acesso à base de dados. Cria um ficheiro .env na raiz da pasta backend com a seguinte estrutura:

PORT=5000
MONGO_URI=mongodb+srv://pedrogoliv:freeroomestgsir@salasocupadas.odtfbm2.mongodb.net/freeroom_estg?appName=SalasOCUPADAS

3. Correr o Projeto
Para iniciar o servidor em modo de desenvolvimento (com hot-reload via nodemon):
npm run dev


🎓 Autores
Trabalho realizado no âmbito da Unidade Curricular de Sistemas de Informação em Rede (2025/26), Licenciatura em Engenharia Informática — ESTG | IPVC.

Paulo Simões (31377)

Francisco Matos (31406)

José Oliveira (31408)

Docente: Prof. Pedro Moreira