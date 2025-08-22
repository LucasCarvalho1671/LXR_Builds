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

// Adicionado para depuração: verifica se a chave da Riot está sendo lida.
console.log(
  "[DEBUG] Valor da RIOT_API_KEY:",
  RIOT_API_KEY ? "Chave carregada" : "Chave não encontrada"
);

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
  tr1: "europe",
};

app.post("/api/gemini-ask", async (req, res) => {
  const {
    game,
    question,
    forceRefresh,
    summonerName,
    summonerTag,
    platformRegion,
    matchCount,
  } = req.body;

  if (game === "lol" && summonerName && summonerTag) {
    const cacheKey = `${summonerName}-${summonerTag}-${platformRegion}`;
    const cachedData = summonerCache[cacheKey];
    const now = Date.now();

    if (
      cachedData &&
      !forceRefresh &&
      now - cachedData.timestamp < CACHE_LIFETIME
    ) {
      console.log(
        `[LOG] Dados do invocador ${summonerName} carregados do cache.`
      );
      const prompt = getPromptForGame(game, question, cachedData.data);
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return res.json({ response: text });
      } catch (error) {
        console.error("[ERRO] Erro ao gerar conteúdo da IA:", error);
        return res
          .status(500)
          .json({ error: "Ocorreu um erro ao gerar a resposta da IA." });
      }
    }

    try {
      console.log(
        `[LOG] Buscando dados do invocador ${summonerName} na Riot API...`
      );

      const summonerUrl = `https://${platformRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${summonerName}/${summonerTag}?api_key=${RIOT_API_KEY}`;
      console.log(`[DEBUG] Requisição para Invocador: ${summonerUrl}`);
      const summonerResponse = await axios.get(summonerUrl);
      const puuid = summonerResponse.data.puuid;
      console.log(`[LOG] PUUID do invocador ${summonerName}: ${puuid}`);

      const lolRegion = regionMapping[platformRegion];
      const summonerIdUrl = `https://${platformRegion}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${RIOT_API_KEY}`;
      console.log(`[DEBUG] Requisição para ID do Invocador: ${summonerIdUrl}`);
      const summonerIdResponse = await axios.get(summonerIdUrl);
      const summonerId = summonerIdResponse.data.id;
      const summonerLevel = summonerIdResponse.data.summonerLevel;

      const leagueUrl = `https://${platformRegion}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}?api_key=${RIOT_API_KEY}`;
      console.log(`[DEBUG] Requisição para Elo/Liga: ${leagueUrl}`);
      const leagueResponse = await axios.get(leagueUrl);
      const rankedSoloDuo = leagueResponse.data.find(
        (entry) => entry.queueType === "RANKED_SOLO_5x5"
      );

      const tier = rankedSoloDuo ? rankedSoloDuo.tier : "Unranked";
      const rank = rankedSoloDuo ? rankedSoloDuo.rank : "";

      console.log(
        `[LOG] Buscando histórico de partidas para o invocador ${summonerName}...`
      );
      const matchHistoryUrl = `https://${lolRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${matchCount}&api_key=${RIOT_API_KEY}`;
      console.log(
        `[DEBUG] Requisição para Histórico de Partidas: ${matchHistoryUrl}`
      );
      const matchHistoryResponse = await axios.get(matchHistoryUrl);
      const matchIds = matchHistoryResponse.data;
      console.log(`[LOG] Encontradas ${matchIds.length} partidas.`);

      const matchDetails = await Promise.all(
        matchIds.map((matchId) =>
          axios.get(
            `https://${lolRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${RIOT_API_KEY}`
          )
        )
      );

      const matchHistory = matchDetails.map((response) => response.data);

      const summonerInfo = {
        summonerName,
        summonerTag,
        platformRegion,
        puuid,
        tier,
        rank,
        summonerLevel,
        matchHistory,
      };

      summonerCache[cacheKey] = {
        data: summonerInfo,
        timestamp: now,
      };

      if (!question) {
        console.log("[LOG] Retornando dados do invocador para o cliente.");
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
        "[ERRO] Ocorreu um erro na requisição da Riot API:",
        error.message
      );
      if (error.response) {
        console.error(
          `[ERRO DETALHADO] Status: ${error.response.status}, Data:`,
          error.response.data
        );
        switch (error.response.status) {
          case 401:
            return res.status(401).json({
              error: "Sua chave de API da Riot está inválida ou expirou.",
            });
          case 403:
            return res.status(403).json({
              error:
                "Acesso negado à API da Riot. Verifique as permissões da sua chave.",
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
          "Ocorreu um erro ao processar sua solicitação. Verifique o console do servidor para mais detalhes.",
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
