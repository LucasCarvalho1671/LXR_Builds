const questionInput = document.getElementById("questionInput");
const askButton = document.getElementById("askButton");
const aiResponse = document.getElementById("aiResponse");
const aiForm = document.getElementById("aiForm");
const mainContent = document.getElementById("mainContent");
const selectedGameHiddenInput = document.getElementById(
  "selectedGameHiddenInput"
);
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
const suggestedQuestionsContainer = document.getElementById(
  "suggestedQuestionsContainer"
);
const suggestedQuestionsList = document.getElementById(
  "suggestedQuestionsList"
);

const blurBackgroundOverlay = document.getElementById("blurBackgroundOverlay");

let selectedGame = "";
let wantsSummonerInfo = false;

// Objeto com as perguntas sugeridas para cada jogo
const gameSuggestions = {
  lol: [
    "Melhor build para Ahri mid?",
    "Como jogar de caçador no LoL?",
    "Melhores itens para o campeão X?",
    "Análise o meta atual!",
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

// Nova função para exibir a área de formulário e perguntas sugeridas
const showMainForm = (game, image) => {
  selectedGame = game;
  selectedGameDisplay.textContent = game.toUpperCase();
  selectedGameDisplay.style.backgroundImage = `url(${image})`;
  hideElement(mainContent);
  showElement(mainFormArea);
  showElement(backButton);
  setBackgroundImage(image);

  // Lógica para carregar e exibir as perguntas sugeridas
  const suggestions = gameSuggestions[game] || [];
  suggestedQuestionsList.innerHTML = "";
  if (suggestions.length > 0) {
    suggestions.forEach((suggestion) => {
      const button = document.createElement("button");
      button.textContent = suggestion;
      button.classList.add("suggested-question-button");
      button.addEventListener("click", () => {
        questionInput.value = suggestion;
        // Opcional: enviar o formulário automaticamente ao clicar na sugestão
        // aiForm.dispatchEvent(new Event("submit"));
      });
      suggestedQuestionsList.appendChild(button);
    });
    showElement(suggestedQuestionsContainer);
  } else {
    hideElement(suggestedQuestionsContainer);
  }
};

const resetToGameSelection = () => {
  selectedGame = "";
  wantsSummonerInfo = false;
  hideElement(mainFormArea);
  hideElement(backButton);
  hideElement(aiResponse);
  showElement(mainContent);
  setBackgroundImage("./img/bg.jpg");
  document.body.classList.remove("blurred");
  hideElement(lolSpecificFields);
};

// Event listener para as capas de jogo
document.querySelectorAll(".game-card").forEach((card) => {
  card.addEventListener("click", () => {
    const game = card.dataset.game;
    const image = card.dataset.image;
    // Lógica para jogos específicos (como o LoL que tem um modal)
    if (game === "lol") {
      showElement(summonerQuestionModal);
      showElement(blurBackgroundOverlay);
      document.body.classList.add("blurred");
    } else {
      hideElement(lolSpecificFields);
      showMainForm(game, image);
    }
  });
});

backButton.addEventListener("click", resetToGameSelection);

btnYesSummoner.addEventListener("click", () => {
  wantsSummonerInfo = true;
  hideElement(summonerQuestionModal);
  hideElement(blurBackgroundOverlay);
  document.body.classList.remove("blurred");
  showElement(lolSpecificFields);
  showMainForm("lol", "./img/lol_capa.jpg");
});

btnNoSummoner.addEventListener("click", () => {
  wantsSummonerInfo = false;
  hideElement(summonerQuestionModal);
  hideElement(blurBackgroundOverlay);
  document.body.classList.remove("blurred");
  hideElement(lolSpecificFields);
  showMainForm("lol", "./img/lol_capa.jpg");
});

// Envia o formulário
aiForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const question = questionInput.value.trim();

  if (question === "") {
    alert("Por favor, digite sua pergunta.");
    return;
  }
  if (selectedGame === "") {
    alert("Por favor, selecione um jogo.");
    return;
  }

  askButton.disabled = true;
  askButton.textContent = "Carregando...";
  askButton.classList.add("loading");
  hideElement(aiResponse);

  const requestBody = {
    game: selectedGame,
    question: question,
  };

  if (selectedGame === "lol" && wantsSummonerInfo) {
    const summonerName = summonerNameInput.value.trim();
    const summonerTag = summonerTagInput.value.trim();
    const platformRegion = platformRegionSelect.value;

    if (summonerName === "" || summonerTag === "") {
      alert("Por favor, preencha o nome e a tag do invocador.");
      askButton.disabled = false;
      askButton.textContent = "Perguntar";
      askButton.classList.remove("loading");
      return;
    }

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
