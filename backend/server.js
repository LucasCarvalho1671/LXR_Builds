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
  process.exit(1); // Encerra o processo se a chave não estiver lá
}
if (!GEMINI_API_KEY) {
  console.error(
    "Erro: A variável de ambiente GEMINI_API_KEY não está definida no arquivo .env"
  );
  process.exit(1); // Encerra o processo se a chave não estiver lá
}

// 8. Define uma rota de teste simples para verificar se o servidor está funcionando
app.get("/", (req, res) => {
  res.send("Backend do Assistente de LoL está online!");
});

// 9. Rota para buscar informações básicas de um invocador (Summoner)
// Usa gameName e tagLine (o "Riot ID")
app.get("/api/lol/summoner/:gameName/:tagLine", async (req, res) => {
  const { gameName, tagLine } = req.params;
  // Para Account-v1, a região de roteamento é global (AMERICAS, ASIA, EUROPE, SEA)
  const routingRegionAccount = "americas"; // Usamos americas por padrão, cobrindo BR.

  try {
    const response = await axios.get(
      `https://${routingRegionAccount}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,
      {
        headers: {
          "X-Riot-Token": RIOT_API_KEY,
        },
      }
    );
    res.json(response.data); // Retorna os dados do invocador (inclui o puuid)
  } catch (error) {
    console.error(
      "Erro ao buscar invocador na Riot API:",
      error.response ? error.response.data : error.message
    );
    res.status(error.response ? error.response.status : 500).json({
      error: "Não foi possível encontrar o invocador ou erro na API da Riot.",
      details: error.response ? error.response.data : error.message,
    });
  }
});

// 10. Rota para buscar o histórico de partidas de um jogador usando o PUUID e a região da plataforma
app.get("/api/lol/match-history/:puuid/:platformRegion", async (req, res) => {
  const { puuid, platformRegion } = req.params; // platformRegion aqui é 'br1', 'na1', etc.
  const count = 10; // Limita o número de IDs de partidas

  // *** CORREÇÃO AQUI: Declarar routingRegion com 'let' ANTES do switch ***
  let routingRegion;

  // Mapeia a plataforma para a região de roteamento necessária para Match-v5
  switch (platformRegion) {
    case "br1":
    case "na1":
    case "la1":
    case "la2":
      routingRegion = "americas";
      break;
    case "euw1":
    case "eun1":
    case "tr1":
    case "ru":
      routingRegion = "europe";
      break;
    case "kr":
    case "jp1":
      routingRegion = "asia";
      break;
    case "oc1":
      routingRegion = "sea";
      break;
    default:
      // Define um padrão seguro caso a região da plataforma não seja mapeada
      console.warn(
        `Região de plataforma desconhecida: ${platformRegion}. Usando 'americas' como padrão para roteamento.`
      );
      routingRegion = "americas";
  }

  try {
    // A URL para Match-v5 deve usar a REGION DE ROTEAMENTO (routingRegion)
    const response = await axios.get(
      `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`,
      {
        headers: {
          "X-Riot-Token": RIOT_API_KEY,
        },
      }
    );
    res.json(response.data); // Retorna uma lista de IDs de partidas
  } catch (error) {
    console.error(
      "Erro ao buscar histórico de partidas na Riot API:",
      error.response ? error.response.data : error.message
    );
    res.status(error.response ? error.response.status : 500).json({
      error: "Não foi possível obter o histórico de partidas.",
      details: error.response ? error.response.data : error.message,
    });
  }
});

// 11. Rota para buscar os detalhes de uma partida específica usando o matchId e a região de roteamento
app.get("/api/lol/match-details/:matchId/:routingRegion", async (req, res) => {
  const { matchId, routingRegion } = req.params;
  // Para Match-v5 (detalhes da partida), a região de roteamento é global (AMERICAS, ASIA, EUROPE, SEA)
  // As partidas do BR estão na região de roteamento AMERICAS.
  // Certifique-se de usar a região de roteamento correta baseada na sua região de plataforma original.

  try {
    const response = await axios.get(
      `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
      {
        headers: {
          "X-Riot-Token": RIOT_API_KEY,
        },
      }
    );
    res.json(response.data); // Retorna os detalhes completos da partida
  } catch (error) {
    console.error(
      "Erro ao buscar detalhes da partida na Riot API:",
      error.response ? error.response.data : error.message
    );
    res.status(error.response ? error.response.status : 500).json({
      error: "Não foi possível obter os detalhes da partida.",
      details: error.response ? error.response.data : error.message,
    });
  }
});

// 12. Rota principal para analisar o desempenho do jogador e chamar a IA Gemini
app.get(
  "/api/analyze-player-performance/:gameName/:tagLine/:platformRegion",
  async (req, res) => {
    const { gameName, tagLine, platformRegion } = req.params;
    let puuid;
    let matchIds = [];
    let matchDetails = [];

    // 1. Obter o PUUID do invocador
    try {
      // Chamando a rota interna do seu próprio backend para obter o PUUID
      const summonerResponse = await axios.get(
        `http://localhost:${PORT}/api/lol/summoner/${gameName}/${tagLine}`
      );
      puuid = summonerResponse.data.puuid;
      if (!puuid) {
        return res
          .status(404)
          .json({ error: "PUUID não encontrado para o invocador." });
      }
    } catch (error) {
      console.error(
        "Erro ao obter PUUID do invocador:",
        error.response ? error.response.data : error.message
      );
      return res.status(500).json({
        error: "Erro ao obter PUUID do invocador.",
        details: error.response ? error.response.data.error : error.message,
      });
    }

    // 2. Obter os IDs das partidas
    try {
      // Chamando a rota interna do seu próprio backend para obter os IDs das partidas
      const historyResponse = await axios.get(
        `http://localhost:${PORT}/api/lol/match-history/${puuid}/${platformRegion}`
      );
      matchIds = historyResponse.data;
      if (!matchIds || matchIds.length === 0) {
        return res.status(404).json({
          error: "Nenhum histórico de partidas encontrado para análise.",
        });
      }
    } catch (error) {
      console.error(
        "Erro ao obter IDs de partidas para análise:",
        error.response ? error.response.data : error.message
      );
      return res.status(500).json({
        error: "Erro ao obter IDs de partidas para análise.",
        details: error.response ? error.response.data.error : error.message,
      });
    }

    // 3. Obter os detalhes de cada partida
    // Define a routingRegion para os detalhes da partida (que será usada para todas as partidas)
    let routingRegionMatchDetails;
    switch (platformRegion) {
      case "br1":
      case "na1":
      case "la1":
      case "la2":
        routingRegionMatchDetails = "americas";
        break;
      case "euw1":
      case "eun1":
      case "tr1":
      case "ru":
        routingRegionMatchDetails = "europe";
        break;
      case "kr":
      case "jp1":
        routingRegionMatchDetails = "asia";
        break;
      case "oc1":
        routingRegionMatchDetails = "sea";
        break;
      default:
        routingRegionMatchDetails = "americas";
    }

    // Cria um array de promessas para buscar os detalhes de cada partida em paralelo
    const matchDetailPromises = matchIds.map((matchId) =>
      axios.get(
        `http://localhost:${PORT}/api/lol/match-details/${matchId}/${routingRegionMatchDetails}`
      )
    );

    try {
      const responses = await Promise.all(matchDetailPromises);
      matchDetails = responses.map((res) => res.data);
    } catch (error) {
      console.error(
        "Erro ao obter detalhes de uma ou mais partidas:",
        error.response ? error.response.data : error.message
      );
      // Em caso de erro em UMA partida, ainda podemos tentar analisar as outras.
      // Aqui, estamos retornando um erro, mas você pode refinar para pular partidas com erro.
      return res.status(500).json({
        error: "Erro ao obter detalhes de uma ou mais partidas.",
        details: error.response ? error.response.data.error : error.message,
      });
    }

    // 4. Analisar os dados das partidas e preparar o prompt para o Gemini
    let analysisSummary = `Análise de desempenho do jogador ${gameName}#${tagLine} nas últimas ${matchDetails.length} partidas:\n\n`;
    let gamesPlayed = 0;
    let totalKills = 0;
    let totalDeaths = 0;
    let totalAssists = 0;
    let totalCs = 0;
    let totalDamage = 0;
    let totalVisionScore = 0;
    let wins = 0;
    let championStats = {}; // { ChampionName: { games: X, kills: Y, deaths: Z, assists: A, wins: B, losses: C, kdaAvg: X, winRate: Y } }

    matchDetails.forEach((match) => {
      gamesPlayed++;
      const participant = match.info.participants.find(
        (p) => p.puuid === puuid
      );
      if (participant) {
        totalKills += participant.kills;
        totalDeaths += participant.deaths;
        totalAssists += participant.assists;
        totalCs +=
          participant.totalMinionsKilled + participant.neutralMinionsKilled;
        totalDamage += participant.totalDamageDealtToChampions;
        totalVisionScore += participant.visionScore;
        if (participant.win) {
          wins++;
        }

        const champName = participant.championName;
        if (!championStats[champName]) {
          championStats[champName] = {
            games: 0,
            kills: 0,
            deaths: 0,
            assists: 0,
            wins: 0,
            losses: 0,
          };
        }
        championStats[champName].games++;
        championStats[champName].kills += participant.kills;
        championStats[champName].deaths += participant.deaths;
        championStats[champName].assists += participant.assists;
        if (participant.win) {
          championStats[champName].wins++;
        } else {
          championStats[champName].losses++;
        }
      }
    });

    if (gamesPlayed > 0) {
      analysisSummary += `Partidas analisadas: ${gamesPlayed}\n`;
      analysisSummary += `KDA Médio: ${(totalKills / gamesPlayed).toFixed(
        1
      )} / ${(totalDeaths / gamesPlayed).toFixed(1)} / ${(
        totalAssists / gamesPlayed
      ).toFixed(1)}\n`;
      analysisSummary += `Taxa de Vitórias: ${(
        (wins / gamesPlayed) *
        100
      ).toFixed(1)}%\n`;
      analysisSummary += `CS Médio por Partida: ${(
        totalCs / gamesPlayed
      ).toFixed(1)}\n`;
      analysisSummary += `Dano Médio a Campeões por Partida: ${(
        totalDamage / gamesPlayed
      ).toFixed(0)}\n`;
      analysisSummary += `Visão Média por Partida: ${(
        totalVisionScore / gamesPlayed
      ).toFixed(1)}\n\n`;

      analysisSummary += "Estatísticas Detalhadas por Campeão:\n";
      for (const champ in championStats) {
        const stats = championStats[champ];
        const champKDA = `${(stats.kills / stats.games).toFixed(1)}/${(
          stats.deaths / stats.games
        ).toFixed(1)}/${(stats.assists / stats.games).toFixed(1)}`;
        const champWinRate = `${((stats.wins / stats.games) * 100).toFixed(
          1
        )}%`;
        analysisSummary += `- ${champ}: ${stats.games} jogos, KDA: ${champKDA}, Vitórias: ${champWinRate}\n`;
      }
    } else {
      analysisSummary +=
        "Não foi possível coletar dados de partidas suficientes para análise.\n";
    }

    // Exemplo de como construir o prompt para o Gemini
    const geminiPrompt = `Com base na seguinte análise detalhada de desempenho de um jogador de League of Legends:\n\n${analysisSummary}\n\nPor favor, identifique os 3 principais **pontos fortes** e os 3 principais **pontos fracos** deste jogador. Em seguida, forneça 3 a 5 **sugestões de melhoria específicas, acionáveis e práticas** para ele, considerando as estatísticas apresentadas. As sugestões devem ser claras e fáceis de entender para um jogador casual que deseja melhorar.`;

    // 5. Enviar para a API Gemini
    let geminiResponseText =
      "Não foi possível obter a análise da IA. Tente novamente mais tarde.";
    try {
      const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const geminiPayload = {
        contents: [
          {
            parts: [{ text: geminiPrompt }],
          },
        ],
      };
      const geminiConfig = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      const geminiResponse = await axios.post(
        geminiApiUrl,
        geminiPayload,
        geminiConfig
      );
      // A resposta do Gemini pode vir em múltiplos 'parts' ou 'candidates'. Ajuste conforme a estrutura real.
      if (
        geminiResponse.data &&
        geminiResponse.data.candidates &&
        geminiResponse.data.candidates.length > 0 &&
        geminiResponse.data.candidates[0].content &&
        geminiResponse.data.candidates[0].content.parts &&
        geminiResponse.data.candidates[0].content.parts.length > 0
      ) {
        geminiResponseText =
          geminiResponse.data.candidates[0].content.parts[0].text;
      } else {
        geminiResponseText = "A IA não retornou uma análise compreensível.";
      }
    } catch (error) {
      console.error(
        "Erro ao chamar a API Gemini:",
        error.response ? error.response.data : error.message
      );
      geminiResponseText = `Erro ao obter análise da IA: ${
        error.response ? error.response.data.error.message : error.message
      }`;
    }

    // 6. Retornar a análise completa (ou apenas a resposta do Gemini)
    res.json({
      playerSummary: analysisSummary,
      geminiAnalysis: geminiResponseText,
    });
  }
);
// 13. Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor backend rodando em http://localhost:${PORT}`);
  console.log(`API Key Riot: ${RIOT_API_KEY ? "Carregada" : "NÃO CARREGADA!"}`);
  console.log(
    `API Key Gemini: ${GEMINI_API_KEY ? "Carregada" : "NÃO CARREGADA!"}`
  );
});
