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
            // Continua para a próxima partida mesmo se uma falhar
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
        // Erros de status da API da Riot
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

      // Outros erros
      return res.status(500).json({
        error:
          "Ocorreu um erro ao processar sua solicitação. Verifique o console do servidor para mais detalhes.",
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
