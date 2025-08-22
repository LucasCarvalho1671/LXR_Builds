// prompts.js

function getPromptForGame(game, question, summonerInfo = null) {
  let prompt = `Você é um assistente de IA focado em jogos. Sua missão é responder às perguntas dos usuários com base no seu conhecimento de jogo. Seja amigável, útil e objetivo. Se a pergunta for sobre um jogo para o qual você não tem informações de contexto, responda com base no seu conhecimento geral. Se a pergunta for sobre um jogo específico e informações de invocador forem fornecidas, use esses dados para dar uma resposta personalizada e precisa.
    \n\n---`;

  if (game === "lol") {
    prompt += `\nO usuário está jogando League of Legends.`;
    if (summonerInfo) {
      // Formata os dados das partidas para um formato legível pela IA
      let matchHistoryText = "";
      if (summonerInfo.matchHistory && summonerInfo.matchHistory.length > 0) {
        matchHistoryText = "\n\nDados das últimas 5 partidas do invocador:\n";
        summonerInfo.matchHistory.forEach((match, index) => {
          // Extrair informações relevantes para o invocador
          const participant = match.info.participants.find(
            (p) => p.puuid === summonerInfo.puuid
          );
          if (participant) {
            matchHistoryText += `\nPartida ${index + 1}:\n`;
            matchHistoryText += `- Resultado: ${
              participant.win ? "Vitória" : "Derrota"
            }\n`;
            matchHistoryText += `- Campeão: ${participant.championName}\n`;
            matchHistoryText += `- KDA: ${participant.kills}/${participant.deaths}/${participant.assists}\n`;
            matchHistoryText += `- Dano Causado: ${participant.totalDamageDealtToChampions}\n`;
            matchHistoryText += `- Ouro Ganhado: ${participant.goldEarned}\n`;
            matchHistoryText += `- Posição: ${participant.individualPosition}\n`;
            matchHistoryText += `\n`;
          }
        });
      }

      prompt += `\nInformações do Invocador:\n- Nome: ${summonerInfo.summonerName}\n- Tag: ${summonerInfo.summonerTag}\n- Região: ${summonerInfo.platformRegion}\n${matchHistoryText}\n`;
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