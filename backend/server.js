// server.js

// Importações necessárias
const express = require("express");
const axios = require("axios");
const { getPromptForGame } = require("./prompts.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.env || 3000;

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
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

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
  const { game, question, summonerName, summonerTag, platformRegion } =
    req.body;

  if (game === "lol" && summonerName && summonerTag && platformRegion) {
    try {
      // 1. Obter a região de roteamento a partir da região do servidor
      const routingRegion = regionMapping[platformRegion.toLowerCase()];
      if (!routingRegion) {
        return res.status(400).json({
          error: "Região do invocador inválida. Por favor, verifique a tag.",
        });
      }

      // 2. Usar a região de roteamento para obter o PUUID
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

      // 3. Buscar os IDs das partidas mais recentes
      const riotApiUrlMatches = `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=5`;
      const riotResponseMatches = await axios.get(riotApiUrlMatches, {
        headers: {
          "X-Riot-Token": RIOT_API_KEY,
        },
      });
      const matchIds = riotResponseMatches.data;

      // 4. Buscar os detalhes de cada partida
      const matchHistory = [];
      for (const matchId of matchIds) {
        const riotApiUrlMatch = `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
        const riotResponseMatch = await axios.get(riotApiUrlMatch, {
          headers: {
            "X-Riot-Token": RIOT_API_KEY,
          },
        });
        matchHistory.push(riotResponseMatch.data);
      }

      const summonerInfo = {
        summonerName,
        summonerTag,
        platformRegion,
        puuid,
        matchHistory, // Agora contém os detalhes completos
      };

      const prompt = getPromptForGame(game, question, summonerInfo);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return res.json({ response: text });
    } catch (error) {
      console.error(
        "Erro ao obter resposta:",
        error.response?.data || error.message
      );
      if (error.response?.status === 404) {
        return res.status(404).json({
          error:
            "Invocador não encontrado. Por favor, verifique o nome e a tag.",
        });
      }
      return res.status(500).json({
        error:
          "Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.",
      });
    }
  } else {
    // Lógica para outros jogos ou LoL sem informações de invocador
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
