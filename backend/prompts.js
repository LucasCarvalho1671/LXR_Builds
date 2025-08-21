// prompts.js

// Lógica de prompts para cada jogo
const getPromptForGame = (game, question, summonerInfo) => {
  const date = new Date().toLocaleDateString();

  const basePrompt = `
    ## Especialidade
    Você é um assistente especializado em meta e estratégias para o jogo ${game}.

    ## Tarefa
    Você deve responder as perguntas do usuário com base no seu conhecimento do jogo, estratégias, builds, composições e dicas. Use suas ferramentas para obter informações atualizadas, se necessário.

    ## Regras
    - Se você não sabe a resposta, responda com 'Não sei' e não tente inventar uma resposta.
    - Se a pergunta não está relacionada ao jogo, responda com 'Essa pergunta não está relacionada ao jogo'.
    - Considere a data atual ${date}.
    - Faça pesquisas atualizadas sobre o patch atual, baseado na data atual, para dar uma resposta coerente.
    - Nunca responda itens que você não tenha certeza de que existe no patch atual.
    - verificar se o jogo tem mecanicas de temporada, se caso tiver, levar em consideração o a temporada atual. 
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
        - OBSERVAÇÃO: Use essas informações para obter dados do invocador através de suas ferramentas e analisar o perfil do usuário para responder à pergunta.
      `;
    }

    return `${basePrompt}
      ${summonerSection}
      ---
      Pergunta do usuário: ${question}
    `;
  }

  // Lógica para os outros jogos
  if (game === "Valorant") {
    return `${basePrompt}
      ---
      Pergunta do usuário: ${question}
    `;
  }

  if (game === "tft") {
    return `${basePrompt}
      ---
      Pergunta do usuário: ${question}
    `;
  }

  if (game === "bdo") {
    return `${basePrompt}
      ---
      Pergunta do usuário: ${question}
    `;
  }
  
  if (game === "delta") {
    return `${basePrompt}
      ---
      Pergunta do usuário: ${question}
    `;
  }

  // Caso o jogo não seja encontrado
  return "não consegui encontrar a logica para o jogo";
};

module.exports = { getPromptForGame };