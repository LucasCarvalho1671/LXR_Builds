// 1. Carrega as variáveis de ambiente do arquivo .env
require("dotenv").config();

// 2. Importa o Express
const express = require("express");
// 3. Importa o CORS (para permitir comunicação entre frontend e backend)
const cors = require("cors");
// 4. Importa o Axios (para fazer requisições HTTP para APIs externas)
const axios = require("axios");
// 5. Importa a Google Generative AI
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 6. Inicializa o aplicativo Express
const app = express();
// Define a porta onde o servidor vai rodar. Pega da variável de ambiente ou usa a 3000 como padrão.
const PORT = process.env.PORT || 3000;

// 7. Configura middlewares
// Habilita o CORS para todas as origens (para desenvolvimento). Em produção, você pode restringir.
app.use(cors());
// Permite que o Express parseie JSON no corpo das requisições
app.use(express.json());

// 8. Acessa as chaves de API das variáveis de ambiente
const RIOT_API_KEY = process.env.RIOT_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 9. Inicializa o modelo Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Use gemini-1.5-flash para respostas rápidas

// Verifica se as chaves de API estão definidas
if (!RIOT_API_KEY) {
  console.error(
    "Erro: A variável de ambiente RIOT_API_KEY não está definida no arquivo .env"
  );
  // process.exit(1); // Encerra o processo se a chave não estiver lá
}
if (!GEMINI_API_KEY) {
  console.error(
    "Erro: A variável de ambiente GEMINI_API_KEY não está definida no arquivo .env"
  );
  // process.exit(1); // Encerra o processo se a chave não estiver lá
}

// 10. Função auxiliar para mapear região de plataforma para região de roteamento
const getRoutingRegion = (platformRegion) => {
  const mapping = {
    br1: "americas",
    la1: "americas",
    la2: "americas",
    na1: "americas",
    eun1: "europe",
    euw1: "europe",
    jp1: "asia",
    kr: "asia",
    oc1: "sea", // Oceania
    ph2: "sea", // Philippines
    sg2: "sea", // Singapore
    th2: "sea", // Thailand
    tw2: "sea", // Taiwan
    vn2: "sea", // Vietnam
  };
  return mapping[platformRegion.toLowerCase()] || "americas"; // Padrão para americas
};

// --- ROTAS DO SERVIDOR ---

// Rota para obter o PUUID de um jogador de LoL
app.get(
  "/api/lol/summoner-puuid/:gameName/:tagLine/:platformRegion",
  async (req, res) => {
    const { gameName, tagLine, platformRegion } = req.params;
    const routingRegion = getRoutingRegion(platformRegion); // Obtém a região de roteamento

    try {
      const response = await axios.get(
        `https://${routingRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,
        {
          headers: {
            "X-Riot-Token": RIOT_API_KEY,
          },
        }
      );
      res.json(response.data); // Retorna o PUUID
    } catch (error) {
      console.error("Erro ao obter PUUID:", error.message);
      res
        .status(error.response?.status || 500)
        .json({
          error: error.response?.data || "Erro ao obter PUUID do jogador.",
        });
    }
  }
);

// Rota para buscar o histórico de partidas de um jogador usando o PUUID e a região da plataforma
app.get("/api/lol/match-history/:puuid/:platformRegion", async (req, res) => {
  const { puuid, platformRegion } = req.params;
  const count = 10; // Número de partidas mais recentes
  const routingRegion = getRoutingRegion(platformRegion); // Obtém a região de roteamento

  try {
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
    console.error("Erro ao buscar histórico de partidas:", error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || "Erro ao buscar histórico de partidas.",
    });
  }
});

// Rota para buscar detalhes de uma partida específica
app.get("/api/lol/match-details/:matchId/:platformRegion", async (req, res) => {
  const { matchId, platformRegion } = req.params;
  const routingRegion = getRoutingRegion(platformRegion); // Obtém a região de roteamento

  try {
    const response = await axios.get(
      `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
      {
        headers: {
          "X-Riot-Token": RIOT_API_KEY,
        },
      }
    );
    res.json(response.data); // Retorna os detalhes da partida
  } catch (error) {
    console.error("Erro ao buscar detalhes da partida:", error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || "Erro ao buscar detalhes da partida.",
    });
  }
});

// Rota para análise de desempenho do jogador com IA
app.post("/api/analyze-player-performance", async (req, res) => {
  const { puuid, platformRegion } = req.body;

  if (!puuid || !platformRegion) {
    return res.status(400).json({ error: "PUUID e região são obrigatórios." });
  }

  try {
    // 1. Obter histórico de partidas
    const matchIdsResponse = await axios.get(
      `http://localhost:${PORT}/api/lol/match-history/${puuid}/${platformRegion}`
    );
    const matchIds = matchIdsResponse.data;

    if (!matchIds || matchIds.length === 0) {
      return res
        .status(404)
        .json({ error: "Nenhuma partida encontrada para este jogador." });
    }

    // 2. Obter detalhes de cada partida e filtrar pelo PUUID do jogador
    const matchesDetailsPromises = matchIds.map((matchId) =>
      axios.get(
        `http://localhost:${PORT}/api/lol/match-details/${matchId}/${platformRegion}`
      )
    );
    const matchesDetailsResponses = await Promise.all(matchesDetailsPromises);

    let playerMatchesData = [];
    matchesDetailsResponses.forEach((res) => {
      const match = res.data;
      const participant = match.info.participants.find(
        (p) => p.puuid === puuid
      );
      if (participant) {
        playerMatchesData.push({
          matchId: match.metadata.matchId,
          championName: participant.championName,
          kills: participant.kills,
          deaths: participant.deaths,
          assists: participant.assists,
          win: participant.win,
          goldEarned: participant.goldEarned,
          cs: participant.totalMinionsKilled + participant.neutralMinionsKilled,
          damageDealt: participant.totalDamageDealtToChampions,
          visionScore: participant.visionScore,
          gameDuration: match.info.gameDuration, // em segundos
        });
      }
    });

    if (playerMatchesData.length === 0) {
      return res.status(404).json({
        error: "Dados de partidas detalhados não encontrados para o jogador.",
      });
    }

    // 3. Gerar um resumo dos dados do jogador para a IA
    const playerSummary = playerMatchesData
      .map((match) => {
        const kda =
          match.deaths === 0
            ? "Perfect KDA"
            : ((match.kills + match.assists) / match.deaths).toFixed(2);
        const winLoss = match.win ? "Vitória" : "Derrota";
        const durationMinutes = (match.gameDuration / 60).toFixed(1);

        return `Partida ${match.matchId}: ${winLoss}, Campeão: ${match.championName}, KDA: ${match.kills}/${match.deaths}/${match.assists} (${kda}), Ouro: ${match.goldEarned}, CS: ${match.cs}, Dano: ${match.damageDealt}, Visão: ${match.visionScore}, Duração: ${durationMinutes} min.`;
      })
      .join("\n");

    // 4. Enviar para a IA do Gemini para análise
    const prompt = `Com base na seguinte análise detalhada de desempenho de um jogador de League of Legends:\n\n${playerSummary}\n\nPor favor, identifique os 3 principais **pontos fortes** e os 3 principais **pontos fracos** deste jogador. Em seguida, forneça 3 a 5 **sugestões de melhoria específicas, acionáveis e práticas** para ele, considerando as estatísticas apresentadas. As sugestões devem ser claras e fáceis de entender para um jogador casual que deseja melhorar.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ analysis: text, playerSummary: playerSummary }); // Retorna a análise da IA e o resumo original
  } catch (error) {
    console.error("Erro na análise de desempenho:", error.message);
    res.status(500).json({
      error:
        "Erro ao analisar o desempenho do jogador. Verifique o Riot ID e Tag, ou tente novamente mais tarde.",
    });
  }
});

// NOVA ROTA: Rota para fazer perguntas gerais ou contextualizadas ao Gemini
app.post("/api/gemini-ask", async (req, res) => {
  const { game, question, summonerName, summonerTag, platformRegion } =
    req.body;

  if (!question || !game) {
    return res.status(400).json({ error: "Jogo e pergunta são obrigatórios." });
  }

  let fullPrompt = `
    ## Especialidade
    Você é um especialista assistente de meta para o jogo ${game}.

    ## Tarefa
    Você deve responder às perguntas do usuário com base no seu conhecimento do jogo, estratégias, builds, dicas e meta atual.

    ## Regras
    - Se você não sabe a resposta, responda com 'Não sei' e não tente inventar uma resposta.
    - Se a pergunta não está relacionada ao jogo ou a jogos em geral, responda com 'Essa pergunta não está relacionada ao jogo.'
    - Considere a data atual ${new Date().toLocaleDateString(
      "pt-BR"
    )} para informações de patch e meta.
    - Faça pesquisas atualizadas sobre o patch atual, baseado na data atual, para dar uma resposta coerente.
    - Nunca responda itens que você não tenha certeza de que existe no patch atual.
    - Responda em português do Brasil.

    ## Resposta
    - Seja direto e conciso, responda no máximo 500 caracteres, a menos que seja estritamente necessário para uma explicação clara.
    - Use Markdown para formatação.
    - Não use saudações ou despedidas. Apenas responda o que o usuário está perguntando.

    ## Pergunta do Usuário
    Jogo: ${game}
    Pergunta: "${question}"
  `;

  // Adiciona contexto do invocador se for LoL e os dados foram fornecidos
  if (game === "lol" && summonerName && summonerTag && platformRegion) {
    try {
      // Primeiro, obter o PUUID
      const puuidResponse = await axios.get(
        `http://localhost:${PORT}/api/lol/summoner-puuid/${summonerName}/${summonerTag}/${platformRegion}`
      );
      const puuid = puuidResponse.data.puuid;

      // Segundo, obter a análise de desempenho (que já usa a IA e retorna um resumo)
      const analysisResponse = await axios.post(
        `http://localhost:${PORT}/api/analyze-player-performance`,
        { puuid, platformRegion }
      );
      const { analysis, playerSummary } = analysisResponse.data; // analysis é a resposta da IA, playerSummary é o raw data

      fullPrompt += `
        \n## Contexto Adicional (Análise de Desempenho do Invocador ${summonerName}#${summonerTag} na Região ${platformRegion}):
        O usuário forneceu detalhes do invocador e gostaria de uma resposta contextualizada, se a pergunta for relevante ao desempenho.
        Resumo das partidas:
        ${playerSummary}
        
        Análise de IA das últimas partidas (Use como base para complementar sua resposta se a pergunta estiver relacionada ao desempenho ou campeões jogados):
        ${analysis}
        `;
    } catch (error) {
      console.warn(
        "Não foi possível obter dados do invocador para contextualização. Prosseguindo sem dados de invocador.",
        error.message
      );
      // Não retorna erro aqui, apenas avisa e continua com o prompt genérico
      fullPrompt += `\n\n(Não foi possível carregar dados do invocador para contextualização. Responda apenas com base no conhecimento geral do jogo.)`;
    }
  }

  try {
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    res.json({ response: text });
  } catch (error) {
    console.error("Erro ao comunicar com a API Gemini:", error.message);
    res.status(500).json({ error: "Erro ao gerar resposta da IA." });
  }
});

// 11. Inicia o servidor e escuta as requisições na porta definida
app.listen(PORT, () => {
  console.log(`Servidor backend rodando em http://localhost:${PORT}`);
  console.log(`API Key Riot: ${RIOT_API_KEY ? "Carregada" : "NÃO CARREGADA!"}`);
  console.log(
    `API Key Gemini: ${GEMINI_API_KEY ? "Carregada" : "NÃO CARREGADA!"}`
  );
});
