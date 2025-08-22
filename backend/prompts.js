// prompts.js

function getPromptForGame(game, question, summonerInfo = null) {
  const date = new Date().toLocaleDateString("pt-BR");

  let prompt = `## Especialidade
Você é um assistente especializado em meta e estratégias para o jogo ${game}.

## Tarefa
- Você deve responder as perguntas do usuário com base no seu conhecimento do jogo, estratégias, builds, composições e dicas. Use suas ferramentas para obter informações atualizadas, se necessário.
- Se o usuário perguntar sobre builds de armas/itens, deve informar os componentes e o código referente para o usuário importar no jogo (se aplicável).
- Se o usuário não mencionar o modo de jogo, leve em consideração o modo de jogo mais popular ou relevante.

## Regras
- Se você não sabe a resposta, responda com 'Não sei' e não tente inventar uma resposta.
- Se a pergunta não está relacionada ao jogo, responda com 'Essa pergunta não está relacionada ao jogo'.
- Considere a data atual ${date}.
- Faça pesquisas atualizadas sobre o patch atual (se aplicável), baseado na data atual, para dar uma resposta coerente.
- Nunca responda itens que você não tenha certeza de que existe no patch atual.

## Resposta
- Economize na resposta, seja direto, objetivo e responda no máximo 700 caracteres.
- Responda em markdown.
- Não precisa fazer saudação ou despedida, apenas responda o que o usuário está querendo.
---
`;

  switch (game) {
    case "lol":
      prompt += `\n\n### Contexto Adicional:
O usuário está jogando League of Legends. A análise de desempenho deve focar em estratégia de rota, gerenciamento de mapa, builds de campeões, e sinergias de equipe.
`;
      if (summonerInfo) {
        prompt += `\nInformações do Invocador:\n- Nome: ${summonerInfo.summonerName}\n- Tag: ${summonerInfo.summonerTag}\n- Região: ${summonerInfo.platformRegion}\n`;

        if (summonerInfo.tier && summonerInfo.rank) {
          prompt += `- Elo e Liga: ${summonerInfo.tier} ${summonerInfo.rank}\n`;
        } else {
          prompt += `- Elo e Liga: Não ranqueado\n`;
        }

        if (summonerInfo.matchHistory && summonerInfo.matchHistory.length > 0) {
          prompt += `\nDados das últimas ${summonerInfo.matchHistory.length} partidas do invocador (analise este histórico para uma resposta personalizada):\n`;
          summonerInfo.matchHistory.forEach((match, index) => {
            const participant = match.info.participants.find(
              (p) => p.puuid === summonerInfo.puuid
            );
            if (participant) {
              prompt += `\nPartida ${index + 1}:\n`;
              prompt += `- Resultado: ${
                participant.win ? "Vitória" : "Derrota"
              }\n`;
              prompt += `- Campeão: ${participant.championName}\n`;
              prompt += `- KDA: ${participant.kills}/${participant.deaths}/${participant.assists}\n`;
              prompt += `- Dano Causado: ${participant.totalDamageDealtToChampions}\n`;
              prompt += `- Ouro Ganhado: ${participant.goldEarned}\n`;
              prompt += `- Posição: ${participant.individualPosition}\n`;
              prompt += `\n`;
            }
          });
        } else {
          prompt +=
            "\nO histórico de partidas do invocador não foi encontrado ou está vazio. Baseie sua resposta no conhecimento geral do jogo.";
        }
      }
      break;
    case "valorant":
      prompt += `\n\n### Contexto Adicional:
O usuário está jogando Valorant. A análise deve focar em estratégias de ataque e defesa, uso de habilidades de agentes, controle de economia e posicionamento em mapas específicos.
`;
      break;
    case "bdo":
      prompt += `\n\n### Contexto Adicional:
O usuário está jogando Black Desert Online. A análise deve focar em estratégias de grind, gerenciamento de vida de guilda, sistemas de vida (profissão), aprimoramento de equipamentos e rotas de comércio.
`;
      break;
    case "tft":
      prompt += `\n\n### Contexto Adicional:
O usuário está jogando Teamfight Tactics. A análise deve focar em composições de equipe, sinergias de traços e classes, itens ideais e posicionamento de unidades no tabuleiro.
`;
      break;
    case "delta":
      prompt += `\n\n### Contexto Adicional:
O usuário está jogando Delta Force. A análise deve focar em estratégias de combate, classes de operadores, itens e armas ideais para cada situação e dicas de rotação no mapa. Se o usuário perguntar sobre builds de armas, deve informar os componentes e o código referente para importar no jogo, utilize as ferramentas de consulta para dar uma resposta correta e um codigo valido. Exemplo de um codigo valido para a arma AK-12 "Fuzil de assalto AK-12-Conquista-6H6PVIO05HUE92EIHDOCA"
Se o modo de jogo não for mencionado, assuma o modo "Conquista".
`;
      break;
    default:
      prompt += `\n\n### Contexto Adicional:
O usuário está jogando ${game}. Responda com base no seu conhecimento geral sobre este jogo.
`;
  }

  prompt += `\n\n---`;
  prompt += `\n\n### Pergunta do usuário:\n${question}`;

  return prompt;
}

module.exports = {
  getPromptForGame,
};
