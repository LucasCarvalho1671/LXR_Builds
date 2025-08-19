const questionInput = document.getElementById("questionInput");
const askButton = document.getElementById("askButton");
const aiResponse = document.getElementById("aiResponse");
const aiForm = document.getElementById("aiForm");
const mainContent = document.getElementById("mainContent"); // Elemento principal
const selectedGameHiddenInput = document.getElementById(
  "selectedGameHiddenInput"
);
const mainFormArea = document.getElementById("mainFormArea");
const selectedGameDisplay = document.getElementById("selectedGameDisplay");
const backButton = document.getElementById("backButton");
const gameSelectionContainer = document.getElementById(
  "gameSelectionContainer"
);

const summonerQuestionModal = document.getElementById("summonerQuestionModal");
const btnYesSummoner = document.getElementById("btnYesSummoner");
const btnNoSummoner = document.getElementById("btnNoSummoner");
const lolSpecificFields = document.getElementById("lolSpecificFields");
const summonerNameInput = document.getElementById("summonerNameInput");
const summonerTagInput = document.getElementById("summonerTagInput");
const platformRegionSelect = document.getElementById("platformRegionSelect");
const suggestedQuestionsContainer = document.getElementById(
  "suggestedQuestionsContainer"
);
const suggestedQuestionsList = document.getElementById(
  "suggestedQuestionsList"
);

const blurBackgroundOverlay = document.getElementById("blurBackgroundOverlay");

let selectedGame = "";
let wantsSummonerInfo = false;

const markdownToHTML = (text) => {
  const converter = new showdown.Converter();
  return converter.makeHtml(text);
};

// Obter as credenciais da API da Riot Games do backend
const getRiotCredentials = async () => {
  try {
    const response = await fetch("/api/riot-credentials");
    if (!response.ok) {
      throw new Error("Falha ao obter as credenciais da Riot.");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao obter credenciais da Riot:", error);
    return null;
  }
};

const perguntarAI = async (
  question,
  game,
  summonerName = null,
  summonerTag = null,
  platformRegion = null
) => {
  const requestBody = {
    game,
    question,
  };

  if (summonerName && summonerTag && platformRegion) {
    requestBody.summonerName = summonerName;
    requestBody.summonerTag = summonerTag;
    requestBody.platformRegion = platformRegion;
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
    aiResponse.querySelector(".response-content").innerHTML = markdownToHTML(
      data.response
    );
    showElement(aiResponse);
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
  }
};

const showElement = (element) => {
  element.classList.remove("hidden");
};

const hideElement = (element) => {
  element.classList.add("hidden");
};

const showMainFormArea = (game) => {
  selectedGame = game;
  hideElement(gameSelectionContainer);
  showElement(mainFormArea);
  selectedGameDisplay.textContent = `Você escolheu: ${game.toUpperCase()}`;
};

// Event listener para as capas dos jogos
document.querySelectorAll(".game-card").forEach((card) => {
  card.addEventListener("click", () => {
    selectedGame = card.dataset.game;
    const gameName = card.dataset.game;

    if (gameName === "lol") {
      // Abre o modal para perguntar sobre informações de invocador
      showElement(summonerQuestionModal);
      showElement(blurBackgroundOverlay);
      document.body.classList.add("modal-open");
    } else {
      showMainFormArea(gameName);
    }
  });
});

// Event listeners para o modal de League of Legends
btnYesSummoner.addEventListener("click", () => {
  wantsSummonerInfo = true;
  showElement(lolSpecificFields);
  hideElement(summonerQuestionModal);
  hideElement(blurBackgroundOverlay);
  document.body.classList.remove("modal-open");
  showMainFormArea("lol");
});

btnNoSummoner.addEventListener("click", () => {
  wantsSummonerInfo = false;
  hideElement(lolSpecificFields);
  hideElement(summonerQuestionModal);
  hideElement(blurBackgroundOverlay);
  document.body.classList.remove("modal-open");
  showMainFormArea("lol");
});

// Event listener para o botão de voltar
backButton.addEventListener("click", () => {
  selectedGame = "";
  hideElement(mainFormArea);
  hideElement(aiResponse);
  showElement(gameSelectionContainer);
  hideElement(summonerQuestionModal);
  hideElement(lolSpecificFields);
});

// Event listener para o formulário
aiForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const question = questionInput.value.trim();
  const summonerName = wantsSummonerInfo
    ? summonerNameInput.value.trim()
    : null;
  const summonerTag = wantsSummonerInfo ? summonerTagInput.value.trim() : null;
  const platformRegion = wantsSummonerInfo ? platformRegionSelect.value : null;

  if (question === "") {
    alert("Por favor, digite sua pergunta.");
    return;
  }

  askButton.disabled = true;
  askButton.textContent = "Perguntando...";
  askButton.classList.add("loading");

  await perguntarAI(
    question,
    selectedGame,
    summonerName,
    summonerTag,
    platformRegion
  );

  askButton.disabled = false;
  askButton.textContent = "Perguntar";
  askButton.classList.remove("loading");
});

// Registro do Service Worker (para PWA)
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
