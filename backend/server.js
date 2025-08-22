// server.js

const express = require("express");
const axios = require("axios");
const { getPromptForGame } = require("./prompts.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const API_KEY = process.env.GEMINI_API_KEY;
const RIOT_API_KEY = process.env.RIOT_API_KEY;

if (!API_KEY || !RIOT_API_KEY) {
  console.error(
    "Erro: Chaves de API não configuradas. Verifique seu arquivo .env."
  );
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const summonerCache = {};
const CACHE_LIFETIME = 10 * 60 * 1000;

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
  tr1: "turkey",
};

app.post("/api/gemini-ask", async (req, res) => {
  const { game, question, summonerName, summonerTag, platformRegion, forceRefresh, matchCount = 5 } = req.body;

  if (game === "lol" && summonerName && summonerTag && platformRegion) {
    const cacheKey = `${summonerName.toLowerCase()}${summonerTag.toLowerCase()}-${matchCount}`;
    const cachedData = summonerCache[cacheKey];

    const isInitialFetch = !question;
    
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_LIFETIME && !forceRefresh) {
      console.log("Usando dados do cache para o invocador:", cacheKey);
      const summonerInfo = cachedData.data;

      if (isInitialFetch) {
        return res.json(summonerInfo);
      } else {
        const prompt = getPromptForGame(game, question, summonerInfo);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return res.json({ response: text });
      }
    }

    try {
      const routingRegion = regionMapping[platformRegion.toLowerCase()];
      if (!routingRegion) {
        return res.status(400).json({
          error: "Região do invocador inválida. Por favor, verifique a tag.",
        });
      }

      const riotApiUrlAccount = `https://${routingRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${summonerName}/${summonerTag.replace("#", "")}`;
      const riotResponseAccount = await axios.get(riotApiUrlAccount, {
        headers: {
          "X-Riot-Token": RIOT_API_KEY,
        },
      });

      const puuid = riotResponseAccount.data.puuid;

      const riotApiUrlMatches = `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${matchCount}`;
      const riotResponseMatches = await axios.get(riotApiUrlMatches, {
        headers: {
          "X-Riot-Token": RIOT_API_KEY,
        },
      });
      const matchIds = riotResponseMatches.data;

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

      if (isInitialFetch) {
        return res.json(summonerInfo);
      } else {
        const prompt = getPromptForGame(game, question, summonerInfo);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return res.json({ response: text });
      }
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