// 1. Carrega as variáveis de ambiente do arquivo .env
require("dotenv").config();

// 2. Importa os módulos necessários
const express = require("express");
const cors = require("cors");
const axios = require("axios");

// 3. Inicializa o aplicativo Express
const app = express();
const PORT = process.env.PORT || 3000;

// 4. Configura middlewares
app.use(cors());
app.use(express.json());

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
}

// 6. Define os prompts para cada jogo
const prompts = {
  lol: {
    base: `
    Você é um assistente especializado em League of Legends. Seu objetivo é ajudar o usuário com base em sua pergunta e, se disponível, nas informações de invocador fornecidas. Aja como um analista de meta, respondendo de forma técnica e detalhada.
    
    Instruções:
    - Se a pergunta for sobre um campeão, build, rota ou estratégia geral, responda com uma análise detalhada do meta atual.
    - Se o usuário fornecer dados de invocador (nome, tag e região), você deve buscar informações de partidas recentes na API da Riot Games para analisar o desempenho do jogador.
    - Se a API for consultada, inclua a análise dos dados no início da sua resposta. Use estatísticas como KDA, ouro por minuto, controle de visão, participação em abates e builds de itens das últimas 10 partidas.
    - Baseie-se nas informações de jogo, builds, itens e estratégias do meta atual do patch 14.12.
    - A resposta deve ser em Markdown, formatando o texto para facilitar a leitura com títulos, listas e negrito.
    - Limite sua resposta a um máximo de 2000 caracteres, sendo objetivo.
    
    Exemplo de análise de invocador:
    "Análise do Invocador:
    - KDA médio: 5.2/3.1/8.9
    - Farm (CS/min): 6.5
    - Visão (pontuação): 1.5 por minuto. Sugestão: comprar Sentinela de Controle.
    - Destaques: Vitórias recentes com Vayne e Lucian.
    - Pontos a melhorar: Baixa participação em abates (45%). Tente seguir as lutas de equipe."
    
    Se não for fornecido dados de invocador, ignore essa parte e vá direto para a pergunta.
    
    Perguntas do Usuário:
    Jogo: League of Legends
    Pergunta: {{question}}
    `,
  },
  valorant: {
    base: `
    Você é um assistente especializado em Valorant. Seu objetivo é ajudar o usuário com base em sua pergunta.
    
    Instruções:
    - Responda a pergunta com base no meta atual do jogo (agentes, armas, estratégias, etc.).
    - A resposta deve ser em Markdown, formatando o texto para facilitar a leitura com títulos, listas e negrito.
    - Seja objetivo e direto, sem enrolação.
    
    Perguntas do Usuário:
    Jogo: Valorant
    Pergunta: {{question}}
    `,
  },
  bdo: {
    base: `
    Você é um assistente especializado em Black Desert Online. Seu objetivo é ajudar o usuário com base em sua pergunta.
    
    Instruções:
    - Responda a pergunta com base no meta e nas mecânicas atuais do jogo.
    - A resposta deve ser em Markdown, formatando o texto para facilitar a leitura com títulos, listas e negrito.
    - Seja objetivo e direto, sem enrolação.
    
    Perguntas do Usuário:
    Jogo: Black Desert Online
    Pergunta: {{question}}
    `,
  },
  tft: {
    base: `
    Você é um assistente especializado em Teamfight Tactics. Seu objetivo é ajudar o usuário com base em sua pergunta.
    
    Instruções:
    - Responda a pergunta com base no meta atual do jogo (composições, itens, lendas, etc.).
    - A resposta deve ser em Markdown, formatando o texto para facilitar a leitura com títulos, listas e negrito.
    - Seja objetivo e direto, sem enrolação.
    
    Perguntas do Usuário:
    Jogo: Teamfight Tactics
    Pergunta: {{question}}
    `,
  },
  deltaforce: {
    base: `
    Você é um assistente especializado no jogo Delta Force. Seu objetivo é ajudar o usuário com base em sua pergunta.
    
    Instruções:
    - Responda a pergunta com base nas mecânicas e estratégias do jogo.
    - A resposta deve ser em Markdown, formatando o texto para facilitar a leitura com títulos, listas e negrito.
    - Seja objetivo e direto, sem enrolação.
    
    Perguntas do Usuário:
    Jogo: Delta Force
    Pergunta: {{question}}
    `,
  },
};

// 7. Função para obter o prompt correto
function getPromptForGame(game, question, summonerInfo = null) {
  const gameKey = game;
  const gamePrompts = prompts[gameKey];

  if (!gamePrompts) {
    return "Não consegui encontrar prompts para este jogo.";
  }

  let promptText = gamePrompts.base.replace("{{question}}", question);

  if (game === "lol" && summonerInfo) {
    promptText = promptText.replace(
      "Se o usuário fornecer dados de invocador",
      "O usuário forneceu dados de invocador"
    );
  }

  return promptText;
}

// 8. Rota para o assistente de IA
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
    const geminiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await axios.post(
      geminiURL,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
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
    console.error(
      "Erro na requisição para a API do Gemini:",
      error.response?.data || error.message
    );
    res.status(500).json({
      error:
        "Erro ao se comunicar com a API do Gemini. Verifique a chave e o formato da requisição.",
    });
  }
});

// 9. Rotas para a API da Riot Games (se existirem)
// Rota para buscar o puuid de um jogador
app.get(
  "/api/lol/puuid/:gameName/:tagLine/:platformRegion",
  async (req, res) => {
    // ... (código existente, se houver)
  }
);

// Rota para buscar o histórico de partidas
app.get("/api/lol/match-history/:puuid/:platformRegion", async (req, res) => {
  // ... (código existente, se houver)
});

// 10. Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor backend rodando em http://localhost:${PORT}`);
  console.log(`API Key Riot: ${RIOT_API_KEY ? "Carregada" : "NÃO CARREGADA!"}`);
  console.log(
    `API Key Gemini: ${GEMINI_API_KEY ? "Carregada" : "NÃO CARREGADA!"}`
  );
});
