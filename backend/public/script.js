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
const summonerInfoDisplay = document.getElementById("summonerInfoDisplay");
const rankDisplayContainer = document.getElementById("rankDisplayContainer");
const rankDisplay = document.getElementById("rankDisplay");

const suggestedQuestionsContainer = document.getElementById(
  "suggestedQuestionsContainer"
);
const suggestedQuestionsList = document.getElementById("suggestedQuestionsList");

let selectedGame = null;

const games = {
  lol: {
    name: "League of Legends",
    hasSummonerData: true,
    suggestedQuestions: [
      "Quais as melhores builds para o meu campeão?",
      "Qual é o meta atual da minha rota?",
      "Quais campeões são counters do meu?",
    ],
  },
  valorant: {
    name: "Valorant",
    hasSummonerData: false,
    suggestedQuestions: [
      "Qual o melhor agente para iniciantes?",
      "Como melhorar minha mira?",
      "Quais são os melhores mapas para a minha equipe?",
    ],
  },
  bdo: {
    name: "Black Desert Online",
    hasSummonerData: false,
    suggestedQuestions: [
      "Qual a melhor rota de grind para iniciantes?",
      "Como posso farmar mais prata?",
      "Quais são as melhores classes atualmente?",
    ],
  },
  tft: {
    name: "Teamfight Tactics",
    hasSummonerData: true,
    suggestedQuestions: [
      "Quais as melhores composições do meta?",
      "Como usar o item 'Força da Natureza'?",
      "Qual o melhor posicionamento de unidades?",
    ],
  },
  delta: {
    name: "Delta Force",
    hasSummonerData: false,
    suggestedQuestions: [
      "Quais as melhores armas para o modo conquista?",
      "Qual a melhor build para o fuzil de assalto?",
      "Qual o melhor operador para jogar em modo solo?",
    ],
  },
};

const markdownToHTML = (markdown) => {
  const converter = new showdown.Converter();
  return converter.makeHtml(markdown);
};

const showElement = (element) => {
  element.classList.remove("hidden");
};

const hideElement = (element) => {
  element.classList.add("hidden");
};

const disableUI = () => {
  mainContent.classList.add("loading-cursor");
  headerContent.classList.add("loading-cursor");
  blurBackgroundOverlay.classList.remove("hidden");
  mainFormArea.classList.add("dimmed");
  aiForm.classList.add("dimmed");
};

const enableUI = () => {
  mainContent.classList.remove("loading-cursor");
  headerContent.classList.remove("loading-cursor");
  blurBackgroundOverlay.classList.add("hidden");
  mainFormArea.classList.remove("dimmed");
  aiForm.classList.remove("dimmed");
};

const updateSuggestedQuestions = () => {
  const suggestedQuestions = games[selectedGame].suggestedQuestions;
  suggestedQuestionsList.innerHTML = "";
  suggestedQuestions.forEach((q) => {
    const li = document.createElement("li");
    li.textContent = q;
    li.addEventListener("click", () => {
      questionInput.value = q;
      aiForm.dispatchEvent(new Event("submit"));
    });
    suggestedQuestionsList.appendChild(li);
  });
  showElement(suggestedQuestionsContainer);
};

document.querySelectorAll(".game-card").forEach((card) => {
  card.addEventListener("click", () => {
    selectedGame = card.dataset.game;
    const gameName = games[selectedGame].name;
    selectedGameDisplay.textContent = gameName;
    hideElement(gameSelectionSection);
    showElement(mainFormArea);

    if (games[selectedGame].hasSummonerData) {
      showElement(summonerQuestionModal);
      showElement(blurBackgroundOverlay);
    } else {
      showElement(questionFormContainer);
      updateSuggestedQuestions();
    }
  });
});

btnYesSummoner.addEventListener("click", () => {
  hideElement(summonerQuestionModal);
  showElement(lolSpecificFields);
  showElement(questionFormContainer);
  hideElement(blurBackgroundOverlay);
  updateSuggestedQuestions();
});

btnNoSummoner.addEventListener("click", () => {
  hideElement(summonerQuestionModal);
  hideElement(lolSpecificFields);
  showElement(questionFormContainer);
  hideElement(blurBackgroundOverlay);
  updateSuggestedQuestions();
});

backButton.addEventListener("click", () => {
  hideElement(mainFormArea);
  showElement(gameSelectionSection);
  hideElement(aiResponse);
  hideElement(summonerQuestionModal);
  hideElement(lolSpecificFields);
  hideElement(questionFormContainer);
  hideElement(matchSummaryContainer);
  hideElement(suggestedQuestionsContainer);
  hideElement(rankDisplayContainer);
  questionInput.value = "";
  summonerNameInput.value = "";
  summonerTagInput.value = "";
  selectedGame = null;
});

aiForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = questionInput.value.trim();
  const summonerName = summonerNameInput.value.trim();
  const summonerTag = summonerTagInput.value.trim();
  const platformRegion = platformRegionSelect.value;
  const matchCount = 3;

  if (question === "" && summonerName === "") {
    alert("Por favor, digite uma pergunta ou um nome de invocador.");
    return;
  }

  askButton.disabled = true;
  askButton.textContent = "Carregando...";
  askButton.classList.add("loading");
  disableUI();

  hideElement(aiResponse);

  const requestBody = {
    game: selectedGame,
    question: question,
    summonerName: summonerName,
    summonerTag: summonerTag,
    platformRegion: platformRegion,
    matchCount: matchCount,
  };

  try {
    const response = await fetch("/api/gemini-ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro de rede desconhecido");
    }

    if (data.summonerName) {
      displaySummonerData(data);
    } else {
      aiResponse.querySelector(".response-content").innerHTML = markdownToHTML(
        data.response
      );
      showElement(aiResponse);
    }
  } catch (error) {
    console.error("Erro ao obter resposta da IA:", error);
    aiResponse.querySelector(
      ".response-content"
    ).innerHTML = `<p style="color: red;">Ocorreu um erro: ${error.message}. Tente novamente mais tarde.</p>`;
    showElement(aiResponse);
  } finally {
    askButton.disabled = false;
    askButton.textContent = "Perguntar";
    askButton.classList.remove("loading");
    enableUI();
  }
});

refreshDataButton.addEventListener("click", async (event) => {
  event.preventDefault();

  const summonerName = summonerNameInput.value.trim();
  const summonerTag = summonerTagInput.value.trim();
  const platformRegion = platformRegionSelect.value;
  const matchCount = 3;

  if (summonerName === "") {
    alert("Por favor, preencha o nome do invocador e a tag.");
    return;
  }

  refreshDataButton.disabled = true;
  refreshDataButton.innerHTML = `<span class="spinner"></span> Atualizando...`;
  refreshDataButton.classList.add("loading");
  disableUI();

  try {
    const requestBody = {
      game: selectedGame,
      forceRefresh: true,
      summonerName: summonerName,
      summonerTag: summonerTag,
      platformRegion: platformRegion,
      matchCount: matchCount,
    };

    const response = await fetch("/api/gemini-ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro de rede desconhecido");
    }

    displaySummonerData(data);
  } catch (error) {
    console.error("Erro ao obter resposta da IA:", error);
    matchSummaryInfo.innerHTML = `<p style="color: red;">Ocorreu um erro: ${error.message}.</p>`;
  } finally {
    refreshDataButton.disabled = false;
    refreshDataButton.innerHTML = `Atualizar Histórico`;
    refreshDataButton.classList.remove("loading");
    enableUI();
  }
});

const displaySummonerData = (data) => {
  hideElement(aiResponse);
  showElement(matchSummaryContainer);
  showElement(questionFormContainer);

  const {
    summonerName,
    summonerTag,
    tier,
    rank,
    summonerLevel,
    matchHistory,
  } = data;

  const summonerInfoHTML = `
        <h3>Dados do Invocador</h3>
        <p><strong>Nome:</strong> ${summonerName}#${summonerTag}</p>
        <p><strong>Nível:</strong> ${summonerLevel}</p>
        <p><strong>Elo:</strong> ${tier ? `${tier} ${rank}` : "Não ranqueado"}</p>
    `;
  summonerInfoDisplay.innerHTML = summonerInfoHTML;

  if (matchHistory && matchHistory.length > 0) {
    const matchSummaryHTML = matchHistory
      .map((match) => {
        const participant = match.info.participants.find(
          (p) => p.puuid === data.puuid
        );
        if (!participant) return "";

        return `
                <div class="summary-info">
                    <p><strong>Campeão:</strong> ${
                      participant.championName
                    }</p>
                    <p><strong>KDA:</strong> ${participant.kills}/${
          participant.deaths
        }/${participant.assists}</p>
                    <p><strong>Resultado:</strong> ${
                      participant.win ? "Vitória" : "Derrota"
                    }</p>
                    <p><strong>Posição:</strong> ${
                      participant.individualPosition
                    }</p>
                    <p><strong>Dano:</strong> ${
                      participant.totalDamageDealtToChampions
                    }</p>
                </div>
            `;
      })
      .join("");
    matchSummaryInfo.innerHTML = `<h3>Últimas Partidas:</h3>${matchSummaryHTML}`;
  } else {
    matchSummaryInfo.innerHTML = `<p>Histórico de partidas não encontrado.</p>`;
  }
};

// --- Início do código para registro do Service Worker ---
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log(
          "Service Worker registrado com sucesso:",
          registration.scope
        );
      })
      .catch((error) => {
        console.error("Falha no registro do Service Worker:", error);
      });
  });
}
// --- Fim do código para registro do Service Worker ---