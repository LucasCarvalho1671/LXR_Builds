// 1. Carrega as variáveis de ambiente do arquivo .env
require("dotenv").config();

// 2. Importa o Express
const express = require("express");
// 3. Importa o CORS (para permitir comunicação entre frontend e backend)
const cors = require("cors");
// 4. Importa o Axios (para fazer requisições HTTP para APIs externas)
const axios = require("axios");

// 5. Inicializa o aplicativo Express
const app = express();
// Define a porta onde o servidor vai rodar. Pega da variável de ambiente ou usa a 3000 como padrão.
const PORT = process.env.PORT || 3000;

// 6. Configura middlewares
// Habilita o CORS para todas as origens (para desenvolvimento). Em produção, você pode restringir.
app.use(cors());
// Permite que o Express parseie JSON no corpo das requisições
app.use(express.json());

// 7. Acessa as chaves de API das variáveis de ambiente
const RIOT_API_KEY = process.env.RIOT_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Verifica se as chaves de API estão definidas
if (!RIOT_API_KEY) {
  console.error(
    "Erro: A variável de ambiente RIOT_API_KEY não está definida no arquivo .env"
  );
}

if (!GEMINI_API_KEY) {
  console.error(
    "Erro: A variável de ambiente GEMINI_API_KEY não está definida no arquivo .env"
  );
}

const getPromptForGame = (game, question, summonerInfo) => {
  // Objeto para mapear games e seus prompts
  const prompts = {
    lol: `Você é um assistente de IA especialista em League of Legends.
${summonerInfo ? `O usuário está fornecendo o nome de invocador: ${summonerInfo.summonerName}, tag: ${summonerInfo.summonerTag}, e região: ${summonerInfo.platformRegion}. ` : ''}
Sua tarefa é responder à pergunta do usuário: "${question}".
Considere as informações fornecidas, as mecânicas do jogo, builds, estratégias e o meta atual.
Formate sua resposta usando Markdown para facilitar a leitura.`,

    valorant: `Você é um assistente de IA especialista em Valorant.
Sua tarefa é responder à pergunta do usuário: "${question}".
Considere os agentes, mapas, táticas, economia e o meta do jogo.
Formate sua resposta usando Markdown.`,

    bdo: `Você é um assistente de IA especialista em Black Desert Online.
Sua tarefa é responder à pergunta do usuário: "${question}".
Considere as classes, mecânicas de grind, sistema de failstacks, e estratégias de gameplay.
Formate sua resposta usando Markdown.`,

    tft: `Você é um assistente de IA especialista em Teamfight Tactics.
Sua tarefa é responder à pergunta do usuário: "${question}".
Considere as sinergias, itens, posicionamento, composições e o meta do jogo.
Formate sua resposta usando Markdown.`,
    
    deltaforce: `Você é um assistente de IA especialista em Delta Force.
Sua tarefa é responder à pergunta do usuário: "${question}".
Considere as armas, táticas de combate, mapas, e estratégias multiplayer.
Formate sua resposta usando Markdown.`,
  };

  return prompts[game] || "Desculpe, não consegui encontrar um prompt para este jogo.";
};

// 8. Rota para a requisição da IA (Gemini)
app.post("/api/gemini-ask", async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "API Key do Gemini não está configurada." });
  }

  const { game, question, summonerName, summonerTag, platformRegion } = req.body;

  if (!game || !question) {
    return res.status(400).json({ error: "Parâmetros 'game' e 'question' são obrigatórios." });
  }

  const summonerInfo = summonerName && summonerTag && platformRegion ? { summonerName, summonerTag, platformRegion } : null;
  const prompt = getPromptForGame(game, question, summonerInfo);

  if (prompt.includes("não consegui")) {
    return res.status(400).json({ error: prompt });
  }

  try {
    const geminiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await axios.post(geminiURL, {
      contents: [{
        parts: [{ text: prompt }]
      }]
    }, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    const geminiResponse = response.data.candidates[0].content.parts[0].text;
    res.json({ response: geminiResponse });

  } catch (error) {
    console.error("Erro na requisição para a API do Gemini:", error.response?.data || error.message);
    res.status(500).json({ error: "Erro ao se comunicar com a API do Gemini. Verifique a chave e o formato da requisição." });
  }
});

// 9. Inicia o servidor na porta especificada
app.listen(PORT, () => {
  console.log(`Servidor backend rodando em http://localhost:${PORT}`);
  console.log(`API Key Riot: ${RIOT_API_KEY ? "Carregada" : "NÃO CARREGADA!"}`);
  console.log(
    `API Key Gemini: ${GEMINI_API_KEY ? "Carregada" : "NÃO CARREGADA!"}`
  );
});