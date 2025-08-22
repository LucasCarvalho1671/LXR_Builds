// prompts.js

function getPromptForGame(game, question, summonerInfo = null) {
  let prompt = `Você é um assistente de IA focado em jogos. Sua missão é responder às perguntas dos usuários com base no seu conhecimento de jogo. Seja amigável, útil e objetivo. Se a pergunta for sobre um jogo para o qual você não tem informações de contexto, responda com base no seu conhecimento geral. Se a pergunta for sobre um jogo específico e informações de invocador forem fornecidas, use esses dados para dar uma resposta personalizada e precisa.
    \n\n---`;

  if (game === "lol") {
    prompt += `\nO usuário está jogando League of Legends.`;
    if (summonerInfo) {
      prompt += `\nInformações do Invocador:\n- Nome: ${summonerInfo.summonerName}\n- Tag: ${summonerInfo.summonerTag}\n- Região: ${summonerInfo.platformRegion}\n`;

      if (summonerInfo.matchHistory && summonerInfo.matchHistory.length > 0) {
        prompt += `\nDados das últimas ${summonerInfo.matchHistory.length} partidas do invocador:\n`;
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
          "\nO histórico de partidas do invocador não foi encontrado ou está vazio.";
      }
    }
  } else if (game === "valorant") {
    prompt += `\nO usuário está jogando Valorant.`;
  } else if (game === "bdo") {
    prompt += `\nO usuário está jogando Black Desert Online.`;
  } else if (game === "tft") {
    prompt += `\nO usuário está jogando Teamfight Tactics.`;
  } else if (game === "delta") {
    prompt += `\nO usuário está jogando Delta Force.`;
  }

  prompt += `\n\n---`;
  prompt += `\n\nPergunta do usuário:\n${question}`;

  return prompt;
}

module.exports = {
  getPromptForGame,
};
