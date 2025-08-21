// 1. Carrega as variáveis de ambiente do arquivo .env
require("dotenv").config();

// 2. Importa os módulos necessários
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

// 3. Inicializa o aplicativo Express
const app = express();
const PORT = process.env.PORT || 3000;

// 4. Configura middlewares
app.use(cors());
app.use(express.json());

// Adicione esta linha para servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, "public")));

// 5. Acessa as chaves de API das variáveis de ambiente
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
  process.exit(1);
} else {
  console.log("Variável GEMINI_API_KEY carregada com sucesso.");
}

// 6. Define a lógica para criar os prompts da IA
const getPromptForGame = (game, question, summonerInfo) => {
  let promptText = "";

  const basePrompt = `
    ## Especialidade
    Você é um assistente especializado em meta e estratégias para o jogo ${game}.

    ## Tarefa
    Você deve responder as perguntas do usuário com base no seu conhecimento do jogo, estratégias, builds, composições e dicas. Use suas ferramentas para obter informações atualizadas, se necessário.

    ## Regras
    - Se você não sabe a resposta, responda com 'Não sei' e não tente inventar uma resposta.
    - Se a pergunta não está relacionada ao jogo, responda com 'Essa pergunta não está relacionada ao jogo'.
    - Considere a data atual ${new Date().toLocaleDateString()}.
    - Faça pesquisas atualizadas sobre o patch atual, baseado na data atual, para dar uma resposta coerente.
    - Nunca responda itens que você não tenha certeza de que existe no patch atual.
    - Seja direto e objetivo.
    - Não precisa fazer saudação ou despedida.
    - A resposta deve ser formatada em Markdown.
  `;

  if (game === "lol") {
    let summonerSection = "";
    if (summonerInfo && summonerInfo.summonerName && summonerInfo.summonerTag) {
      summonerSection = `
        ## Informações de Invocador
        - Nome: ${summonerInfo.summonerName}
        - Tag: ${summonerInfo.summonerTag}
        - Região: ${summonerInfo.platformRegion}
      `;
    }

    promptText = `${basePrompt}
      ${summonerSection}
      ---
      Pergunta do usuário: ${question}
    `;
  } else {
    promptText = `${basePrompt}
      ---
      Pergunta do usuário: ${question}
    `;
  }

  return promptText;
};

// 7. Define a rota para a comunicação com a API do Gemini
app.post("/api/gemini-ask", async (req, res) => {
  const { game, question, summonerName, summonerTag, platformRegion } =
    req.body;
  const summonerInfo =
    summonerName && summonerTag && platformRegion
      ? { summonerName, summonerTag, platformRegion }
      : null;
  const prompt = getPromptForGame(game, question, summonerInfo);

  if (prompt.includes("não consegui")) {
    return res.status(400).json({ error: prompt });
  }

  try {
    const geminiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const tools = [
      {
        google_search: {},
      },
    ];

    const response = await axios.post(
      geminiURL,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        tools,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const geminiResponse = response.data.candidates[0].content.parts[0].text;
    res.json({ response: geminiResponse });
  } catch (error) {
    let errorMessage = "Erro desconhecido ao se comunicar com a API do Gemini.";

    if (error.response) {
      console.error("Erro de resposta da API do Gemini:", error.response.data);
      if (error.response.data.error && error.response.data.error.message) {
        errorMessage = `Erro da API: ${error.response.data.error.message}`;
      } else {
        errorMessage = `Erro do servidor: ${error.response.status} - ${error.response.statusText}`;
      }
    } else if (error.request) {
      console.error("Erro de requisição para a API do Gemini:", error.request);
      errorMessage = "A requisição para a API do Gemini não obteve resposta.";
    } else {
      console.error("Erro geral:", error.message);
      errorMessage = `Erro interno: ${error.message}`;
    }

    res.status(500).json({ error: errorMessage });
  }
});

// 8. Rotas para a API da Riot Games
app.get(
  "/api/lol/puuid/:gameName/:tagLine/:platformRegion",
  async (req, res) => {
    const { gameName, tagLine, platformRegion } = req.params;
    const url = `https://${platformRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`;

    try {
      const response = await axios.get(url, {
        headers: {
          "X-Riot-Token": RIOT_API_KEY,
        },
      });
      res.json(response.data);
    } catch (error) {
      console.error(
        "Erro na busca do PUUID:",
        error.response?.data || error.message
      );
      res.status(error.response?.status || 500).json({
        error:
          "Erro ao buscar informações do invocador. Verifique o nome/tag e a chave da API da Riot.",
      });
    }
  }
);

app.get("/api/lol/match-history/:puuid/:platformRegion", async (req, res) => {
  const { puuid, platformRegion } = req.params;
  const url = `https://${platformRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids`;

  try {
    const response = await axios.get(url, {
      headers: {
        "X-Riot-Token": RIOT_API_KEY,
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error(
      "Erro na busca do histórico de partidas:",
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      error:
        "Erro ao buscar histórico de partidas. Verifique o PUUID e a região.",
    });
  }
});

// 9. Inicia o servidor e o faz escutar na porta definida
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
