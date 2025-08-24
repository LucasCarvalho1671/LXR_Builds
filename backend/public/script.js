const questionInput = document.getElementById("questionInput");
const askButton = document.getElementById("askButton");
const aiResponse = document.getElementById("aiResponse");
const aiForm = document.getElementById("aiForm");
const gameSelectionSection = document.getElementById("gameSelectionSection");
const mainFormArea = document.getElementById("mainFormArea");
const selectedGameDisplay = document.getElementById("selectedGameDisplay");
const backButton = document.getElementById("backButton");

const summonerQuestionModal = document.getElementById("summonerQuestionModal");
const btnYesSummoner = document.getElementById("btnYesSummoner");
const btnNoSummoner = document.getElementById("btnNoSummoner");
const lolSpecificFields = document.getElementById("lolSpecificFields");
const summonerNameInput = document.getElementById("summonerNameInput");
const summonerTagInput = document.getElementById("summonerTagInput");
const platformRegionSelect = document.getElementById("platformRegionSelect");
const refreshDataButton = document.getElementById("refreshDataButton");

const blurBackgroundOverlay = document.getElementById("blurBackgroundOverlay");

const mainContent = document.querySelector("main");
const headerContent = document.querySelector("header");

const questionFormContainer = document.getElementById("questionFormContainer");
const matchSummaryContainer = document.getElementById("matchSummaryContainer");
const matchSummaryInfo = document.getElementById("matchSummaryInfo");
const matchSummaryTitle = document.getElementById("matchSummaryTitle");
const matchCountInput = document.getElementById("matchCountInput");
const suggestedQuestionsContainer = document.getElementById("suggestedQuestionsContainer");
const suggestedQuestionsList = document.getElementById("suggestedQuestionsList");

const rankDisplayContainer = document.getElementById("rankDisplayContainer");
const rankInfo = document.getElementById("rankInfo");

let selectedGame = "";
let wantsSummonerInfo = false;
let summonerDataLoaded = false;

const gameSuggestions = {
  lol: [
    "Melhor build para Ahri mid?",
    "Como jogar de caçador no LoL?",
    "Melhores itens para o campeão X?",
    "Análise o meta atual!",
  ],
  lolSummoner: [
    "Como foi minha última partida?",
    "Quais erros cometi nas minhas últimas partidas?",
    "Por que perdi minhas últimas partidas?",
    "Qual meu desempenho com o campeão X recentemente?",
  ],
  valorant: [
    "Melhores agentes para iniciantes no Valorant.",
    "Dicas para melhorar a mira no Valorant.",
    "Como subir de elo no Valorant?",
    "Qual o melhor mapa para a Viper?",
  ],
  bdo: [
    "Melhores classes para iniciantes no BDO.",
    "Como ganhar prata rapidamente no BDO?",
    "Melhor rotação para a classe X?",
    "Dicas de pesca no BDO.",
  ],
  tft: [
    "Melhores composições atuais no TFT.",
    "Dicas para fazer ouro rapidamente no TFT.",
    "Como se posicionar no TFT?",
    "Qual a melhor lenda para o patch atual?",
  ],
  delta: [
    "Melhores armas no Delta Force.",
    "Dicas para jogar Delta Force multiplayer.",
    "Onde encontro as melhores comunidades de Delta Force?",
    "Quais as melhores estratégias para o mapa X?",
  ],
};

const displayRegionMapping = {
  br1: "Brasil",
  na1: "América do Norte",
  euw1: "Europa Ocidental",
  eun1: "Europa Nórdica e Oriental",
  la1: "América Latina Norte",
  la2: "América Latina Sul",
  kr: "Coreia",
  jp1: "Japão",
  oc1: "Oceania",
  ru: "Rússia",
  tr1: "Turquia",
};

// Funções Auxiliares
const markdownToHTML = (text) => {
  const converter = new showdown.Converter();
  return converter.makeHtml(text);
};

const showElement = (element) => {
  if (element) {
    element.classList.remove("hidden");
  }
};

const hideElement = (element) => {
  if (element) {
    element.classList.add("hidden");
  }
};

const setBackgroundImage = (imageUrl) => {
  document.body.style.backgroundImage = `url('${imageUrl}')`;
};

const updateSuggestedQuestions = () => {
  let suggestions = [];
  if (selectedGame === "lol" && wantsSummonerInfo) {
    suggestions = gameSuggestions.lolSummoner || [];
  } else {
    suggestions = gameSuggestions[selectedGame] || [];
  }

  suggestedQuestionsList.innerHTML = "";
  if (suggestions.length > 0) {
    suggestions.forEach((q) => {
      const li = document.createElement("li");
      li.textContent = q;
      li.addEventListener("click", () => {
        questionInput.value = q;
      });
      suggestedQuestionsList.appendChild(li);
    });
    showElement(suggestedQuestionsContainer);
  } else {
    hideElement(suggestedQuestionsContainer);
  }
};

const showMainFormArea = (game, image) => {
  selectedGame = game;
  selectedGameDisplay.textContent = game.toUpperCase();
  selectedGameDisplay.style.backgroundImage = `url(${image})`;
  hideElement(gameSelectionSection);
  showElement(mainFormArea);
  showElement(questionFormContainer);
  setBackgroundImage(image);
  updateSuggestedQuestions();
};

const resetToGameSelection = () => {
  selectedGame = "";
  wantsSummonerInfo = false;
  summonerDataLoaded = false;
  hideElement(mainFormArea);
  hideElement(aiResponse);
  showElement(gameSelectionSection);
  setBackgroundImage("./img/bg.jpg");
  hideElement(lolSpecificFields);
  hideElement(questionFormContainer);
  hideElement(matchSummaryContainer);
  hideElement(rankDisplayContainer);
  mainContent.classList.remove("blur-content");
  headerContent.classList.remove("blur-content");
  updateSuggestedQuestions();
};

function displaySummonerData(summonerInfo) {
  const matchCount = summonerInfo.matchHistory.length;
  matchSummaryTitle.textContent = `Resumo das Últimas ${matchCount} Partidas:`;

  if (!summonerInfo || !summonerInfo.matchHistory || matchCount === 0) {
    matchSummaryInfo.innerHTML = "<p>Nenhum histórico de partida encontrado.</p>";
  } else {
    const matchHistory = summonerInfo.matchHistory;
    let totalKills = 0;
    let totalDeaths = 0;
    let totalAssists = 0;
    let totalDamage = 0;
    let totalGold = 0;
    let totalCs = 0;
    let gamesWon = 0;

    matchHistory.forEach(match => {
      const participant = match.info.participants.find(p => p.puuid === summonerInfo.puuid);
      if (participant) {
        totalKills += participant.kills;
        totalDeaths += participant.deaths;
        totalAssists += participant.assists;
        totalDamage += participant.totalDamageDealtToChampions;
        totalGold += participant.goldEarned;
        totalCs += (participant.totalMinionsKilled + participant.neutralMinionsKilled);
        if (participant.win) {
          gamesWon++;
        }
      }
    });

    const numMatches = matchHistory.length;
    const avgKDA = (totalKills + totalAssists) / Math.max(1, totalDeaths);
    const avgDamage = (totalDamage / numMatches).toLocaleString('pt-BR');
    const avgGold = (totalGold / numMatches).toLocaleString('pt-BR');
    const avgCs = (totalCs / numMatches).toFixed(1);
    const winRate = ((gamesWon / numMatches) * 100).toFixed(0);

    matchSummaryInfo.innerHTML = `
      <div class="summary-item">
        <p>${winRate}%</p>
        <span>Taxa de Vitória</span>
      </div>
      <div class="summary-item">
        <p>${avgKDA.toFixed(2)}</p>
        <span>KDA Médio</span>
      </div>
      <div class="summary-item">
        <p>${avgDamage}</p>
        <span>Dano Médio</span>
      </div>
      <div class="summary-item">
        <p>${avgGold}</p>
        <span>Ouro Médio</span>
      </div>
      <div class="summary-item">
        <p>${avgCs}</p>
        <span>CS Médio</span>
      </div>
    `;
  }
  
  if (summonerInfo.tier && summonerInfo.rank) {
    rankInfo.innerHTML = `<p>${summonerInfo.tier} ${summonerInfo.rank}</p>`;
    showElement(rankDisplayContainer);
  } else {
    rankInfo.innerHTML = `<p>Dados de Elo não encontrados.</p>`;
    showElement(rankDisplayContainer);
  }
}

async function sendFormWithRefresh(forceRefresh) {
  const question = questionInput.value.trim();
  const summonerName = wantsSummonerInfo ? summonerNameInput.value.trim() : null;
  const summonerTag = wantsSummonerInfo ? summonerTagInput.value.trim() : null;
  const platformRegion = wantsSummonerInfo ? platformRegionSelect.value : null;
  const matchCount = matchCountInput.value;

  const isInitialFetch = !question && wantsSummonerInfo;
  
  if (isInitialFetch && (!summonerName || !summonerTag)) {
    alert("Por favor, preencha o nome e a tag do invocador.");
    return;
  }
  
  if (question === "" && !isInitialFetch) {
      alert("Por favor, digite sua pergunta.");
      return;
  }

  if (forceRefresh) {
    refreshDataButton.disabled = true;
    refreshDataButton.innerHTML = `<div class="spinner"></div>`;
    refreshDataButton.classList.add('loading');
  }
  
  if (!isInitialFetch) {
    askButton.disabled = true;
    askButton.textContent = "Perguntando...";
    askButton.classList.add("loading");
    aiResponse.querySelector(".response-content").innerHTML = `
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Gerando resposta... Por favor, aguarde.</p>
      </div>
    `;
    showElement(aiResponse);
  }

  const requestBody = {
    game: selectedGame,
    question: question,
    forceRefresh: forceRefresh,
  };

  if (selectedGame === "lol" && wantsSummonerInfo) {
    requestBody.summonerName = summonerName;
    requestBody.summonerTag = summonerTag;
    requestBody.platformRegion = platformRegion;
    requestBody.matchCount = matchCount;
  }

  try {
    const response = await fetch("/api/gemini-ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro na requisição ao backend.");
    }

    const data = await response.json();

    if (isInitialFetch) {
      const summonerInfo = data;
      displaySummonerData(summonerInfo);
      summonerDataLoaded = true;
      showElement(matchSummaryContainer);
      showElement(questionFormContainer);
      showElement(rankDisplayContainer);
      hideElement(aiResponse);
      updateSuggestedQuestions(); 
    } else {
      aiResponse.querySelector(".response-content").innerHTML = markdownToHTML(
        data.response
      );
      showElement(aiResponse);
      aiResponse.scrollIntoView({ behavior: 'smooth' });
    }
  } catch (error) {
    console.error("Erro ao obter resposta da IA:", error);
    if (isInitialFetch) {
      matchSummaryInfo.innerHTML = `<p style="color: red;">Ocorreu um erro: ${error.message}.</p>`;
    } else {
      aiResponse.querySelector(
        ".response-content"
      ).innerHTML = `<p style="color: red;">Ocorreu um erro: ${error.message}. Tente novamente mais tarde.</p>`;
    }
    showElement(aiResponse);
  } finally {
    if (forceRefresh) {
      refreshDataButton.disabled = false;
      refreshDataButton.innerHTML = `Atualizar Histórico`;
      refreshDataButton.classList.remove('loading');
    }

    askButton.disabled = false;
    askButton.textContent = "Perguntar";
    askButton.classList.remove("loading");
  }
}

// Event Listeners
document.querySelectorAll(".game-card").forEach((card) => {
  card.addEventListener("click", () => {
    const game = card.dataset.game;
    const image = card.dataset.image;

    if (game === "lol") {
      showElement(summonerQuestionModal);
      showElement(blurBackgroundOverlay);

      mainContent.classList.add("blur-content");
      headerContent.classList.add("blur-content");
    } else {
      hideElement(lolSpecificFields);
      showMainFormArea(game, image);
    }
  });
});

backButton.addEventListener("click", resetToGameSelection);

btnYesSummoner.addEventListener("click", () => {
  wantsSummonerInfo = true;
  hideElement(summonerQuestionModal);
  hideElement(blurBackgroundOverlay);
  mainContent.classList.remove("blur-content");
  headerContent.classList.remove("blur-content");
  showElement(lolSpecificFields);
  showMainFormArea("lol", "./img/lol_capa.jpg");
  hideElement(questionFormContainer);
  hideElement(matchSummaryContainer);
  hideElement(rankDisplayContainer);
  updateSuggestedQuestions();
});

btnNoSummoner.addEventListener("click", () => {
  wantsSummonerInfo = false;
  summonerDataLoaded = true;
  hideElement(summonerQuestionModal);
  hideElement(blurBackgroundOverlay);
  mainContent.classList.remove("blur-content");
  headerContent.classList.remove("blur-content");
  hideElement(lolSpecificFields);
  showMainFormArea("lol", "./img/lol_capa.jpg");
  showElement(questionFormContainer);
  hideElement(matchSummaryContainer);
  hideElement(rankDisplayContainer);
  updateSuggestedQuestions();
});

refreshDataButton.addEventListener("click", () => {
  sendFormWithRefresh(true);
});

aiForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!summonerDataLoaded && wantsSummonerInfo) {
    sendFormWithRefresh(true);
  } else {
    sendFormWithRefresh(false);
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registrado com sucesso:", registration);
      })
      .catch((error) => {
        console.error("Falha no registro do Service Worker:", error);
      });
  });
}

// Funcionalidade para voltar com a tecla ESC
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && mainFormArea.classList.contains("hidden") === false) {
    resetToGameSelection();
  }
});