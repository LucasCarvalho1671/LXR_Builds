// server.js

// Importações necessárias
const express = require("express");
const axios = require("axios");
const { getPromptForGame } = require("./prompts.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do Express
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Chaves de API
const API_KEY = process.env.GEMINI_API_KEY;
const RIOT_API_KEY = process.env.RIOT_API_KEY;

// Verificação das chaves de API
if (!API_KEY || !RIOT_API_KEY) {
  console.error(
    "Erro: Chaves de API não configuradas. Verifique seu arquivo .env."
  );
  process.exit(1);
}

// Configuração da IA
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Objeto de cache simples
const summonerCache = {};
const CACHE_LIFETIME = 10 * 60 * 1000; // 10 minutos em milissegundos

// Mapeamento de regiões de servidor para regiões de roteamento da API da Riot
const regionMapping = {
  br1: "americas",
  na1: "americas",
  euw1: "europe",
  eun1: "europe",
  la1: "americas",
  la2: "americas",
  kr: "asia",
  jp1: "asia",
  oc1: "sea",
  ru: "europe",
  tr1: "europe",
};

// Rota para a comunicação com a API do Gemini
app.post("/api/gemini-ask", async (req, res) => {
  const {
    game,
    question,
    summonerName,
    summonerTag,
    platformRegion,
    forceRefresh,
  } = req.body;

  if (game === "lol" && summonerName && summonerTag && platformRegion) {
    const cacheKey = `${summonerName.toLowerCase()}${summonerTag.toLowerCase()}`;
    const cachedData = summonerCache[cacheKey];

    if (
      cachedData &&
      Date.now() - cachedData.timestamp < CACHE_LIFETIME &&
      !forceRefresh
    ) {
      console.log("Usando dados do cache para o invocador:", cacheKey);
      const summonerInfo = cachedData.data;
      const prompt = getPromptForGame(game, question, summonerInfo);

      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return res.json({ response: text });
      } catch (error) {
        console.error("Erro ao gerar conteúdo com a IA:", error.message);
        return res.status(500).json({
          error:
            "Ocorreu um erro ao processar sua solicitação com a IA. Tente novamente mais tarde.",
        });
      }
    }

    try {
      const routingRegion = regionMapping[platformRegion.toLowerCase()];
      if (!routingRegion) {
        return res.status(400).json({
          error: "Região do invocador inválida. Por favor, verifique a tag.",
        });
      }

      // Requisição 1: Obter PUUID
      const riotApiUrlAccount = `https://${routingRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${summonerName}/${summonerTag.replace(
        "#",
        ""
      )}`;
      const riotResponseAccount = await axios.get(riotApiUrlAccount, {
        headers: {
          "X-Riot-Token": RIOT_API_KEY,
        },
      });

      const puuid = riotResponseAccount.data.puuid;

      // Requisição 2: Buscar os IDs das partidas mais recentes
      const riotApiUrlMatches = `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=5`;
      const riotResponseMatches = await axios.get(riotApiUrlMatches, {
        headers: {
          "X-Riot-Token": RIOT_API_KEY,
        },
      });
      const matchIds = riotResponseMatches.data;

      // Requisição 3: Buscar os detalhes de cada partida
      const matchHistory = [];
      if (matchIds && matchIds.length > 0) {
        for (const matchId of matchIds) {
          try {
            const riotApiUrlMatch = `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
            const riotResponseMatch = await axios.get(riotApiUrlMatch, {
              headers: {
                "X-Riot-Token": RIOT_API_KEY,
              },
            });
            matchHistory.push(riotResponseMatch.data);
          } catch (error) {
            console.error(
              `Erro ao buscar detalhes da partida ${matchId}:`,
              error.response?.status,
              error.message
            );
          }
        }
      }

      const summonerInfo = {
        summonerName,
        summonerTag,
        platformRegion,
        puuid,
        matchHistory,
      };

      summonerCache[cacheKey] = {
        timestamp: Date.now(),
        data: summonerInfo,
      };

      const prompt = getPromptForGame(game, question, summonerInfo);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return res.json({ response: text });
    } catch (error) {
      console.error(
        "Erro na cadeia de requisições:",
        error.response?.data || error.message
      );

      if (error.response) {
        switch (error.response.status) {
          case 403:
            return res.status(403).json({
              error: "Sua chave de API da Riot está inválida ou expirou.",
            });
          case 404:
            return res.status(404).json({
              error:
                "Invocador não encontrado. Por favor, verifique o nome e a tag.",
            });
          case 429:
            return res.status(429).json({
              error:
                "Limite de requisições à API da Riot excedido. Tente novamente em um minuto.",
            });
          default:
            return res.status(error.response.status).json({
              error: `Erro da API da Riot: ${error.response.status}. Tente novamente mais tarde.`,
            });
        }
      }

      return res.status(500).json({
        error:
          "Ocorreu um erro ao processar sua solicitação. Verifique o console do servidor para mais detalhes.",
      });
    }
  } else {
    try {
      const summonerInfo = null;
      const prompt = getPromptForGame(game, question, summonerInfo);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return res.json({ response: text });
    } catch (error) {
      console.error("Erro ao obter resposta da IA:", error);
      return res.status(500).json({
        error:
          "Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.",
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
