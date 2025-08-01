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

const markdownToHTML = (text) => {
  const converter = new showdown.Converter();
  return converter.makeHtml(text);
};

const showElement = (element) => element.classList.remove("hidden");
const hideElement = (element) => element.classList.add("hidden");
const showActive = (element) => element.classList.add("active");
const hideActive = (element) => element.classList.remove("active");

const clearForm = () => {
  questionInput.value = "";
  summonerNameInput.value = "";
  summonerTagInput.value = "";
  platformRegionSelect.value = "";
  hideElement(aiResponse);
  hideElement(lolSpecificFields);
  hideElement(suggestedQuestionsContainer);
  suggestedQuestionsList.innerHTML = "";
};

const updateSuggestedQuestions = () => {
  let questions = [];
  if (selectedGame === "lol") {
    if (wantsSummonerInfo) {
      questions = [
        "Qual a função mais fraca que eu jogo?",
        "Qual campeão devo aprender a jogar?",
        "Sugira um item para minha build atual.",
        "Quais meus principais erros nas últimas partidas?",
        "Como melhorar meu controle de visão?",
        "Qual é a rotação de jogo ideal para meu campeão?",
        "Como devo me posicionar nas teamfights?",
        "Qual o melhor momento para dar roaming?",
        "Como posso farmar melhor no early game?",
        "Quais campeões counteram os que eu mais jogo?",
      ];
    } else {
      questions = [
        "Melhor build para Ahri mid?",
        "Como jogar de caçador no LoL?",
        "Explique a função do Barão Nashor.",
        "Dicas para iniciantes no League of Legends.",
        "Qual a diferença entre AD e AP?",
        "Como funciona o sistema de ranqueadas?",
        "Melhores campeões para iniciantes.",
        "Qual a importância dos objetivos no jogo?",
        "Como usar o Flash de forma eficaz?",
        "Explique o conceito de 'split push'.",
      ];
    }
  } else if (selectedGame === "valorant") {
    questions = [
      "Melhores agentes para iniciantes no Valorant.",
      "Dicas para melhorar a mira no Valorant.",
      "Como usar as habilidades do Jett?",
      "Quais são os mapas mais comuns e suas estratégias?",
      "Explique a economia do Valorant.",
      "Melhores composições de equipe.",
      "Como segurar um bomb site como defensor?",
      "Estratégias para atacar um bomb site.",
      "Qual a melhor arma para cada situação?",
      "Como funciona o sistema de patentes?",
    ];
  } else if (selectedGame === "bdo") {
    questions = [
      "Melhores classes para iniciantes no BDO.",
      "Como ganhar prata rapidamente no BDO?",
      "Dicas para upar de nível eficientemente.",
      "Qual a melhor forma de fazer failstacks?",
      "Guia de pesca no Black Desert Online.",
      "Melhores locais de grind para farmar.",
      "Como funcionam as workers no BDO?",
      "Qual o melhor set de equipamento para iniciantes?",
      "Dicas para melhorar o gear score (GS).",
      "Como funciona o sistema de guildas?",
    ];
  } else if (selectedGame === "tft") {
    questions = [
      "Melhores composições atuais no TFT.",
      "Dicas para fazer ouro rapidamente no TFT.",
      "Como montar uma boa sinergia de campeões?",
      "Qual o melhor posicionamento das unidades?",
      "Explique o carrossel no TFT.",
      "Quando ir para level 8 ou 9?",
      "Quais são os itens essenciais para cada carry?",
      "Como lidar com uma streak de derrotas?",
      "Melhores lendas para usar no TFT.",
      "Estratégias para o early game no TFT.",
    ];
  } else if (selectedGame === "deltaforce") {
    questions = [
      "Melhores armas no Delta Force.",
      "Dicas para jogar Delta Force multiplayer.",
      "Como usar o sniper de forma eficaz?",
      "Melhores mapas para cada modo de jogo.",
      "Estratégias para o modo Team Deathmatch.",
      "Como evitar ser detectado pelos inimigos?",
      "Dicas de movimentação e cobertura.",
      "Qual a importância do trabalho em equipe?",
      "Melhores táticas para o modo Capture the Flag.",
      "Como usar explosivos e granadas?",
    ];
  }

  suggestedQuestionsList.innerHTML = "";
  questions.forEach((q) => {
    const button = document.createElement("button");
    button.classList.add("suggested-question-button");
    button.textContent = q;
    button.addEventListener("click", () => {
      questionInput.value = q;
      aiForm.dispatchEvent(new Event("submit"));
    });
    suggestedQuestionsList.appendChild(button);
  });
  showElement(suggestedQuestionsContainer);
};

document.querySelectorAll(".game-card").forEach((card) => {
  card.addEventListener("click", () => {
    document
      .querySelectorAll(".game-card")
      .forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");

    selectedGame = card.dataset.game;
    selectedGameHiddenInput.value = selectedGame;

    selectedGameDisplay.innerHTML = `
      <img src="${card.dataset.image}" alt="${
      card.querySelector("p").textContent
    }">
      <p>${card.querySelector("p").textContent}</p>
    `;

    showElement(mainFormArea);
    showActive(mainFormArea);
    showActive(blurBackgroundOverlay);
    clearForm();

    if (selectedGame === "lol") {
      showElement(summonerQuestionModal);
      hideElement(lolSpecificFields);
      hideElement(suggestedQuestionsContainer);
      hideElement(aiForm);
    } else {
      hideElement(summonerQuestionModal);
      hideElement(lolSpecificFields);
      showElement(aiForm);
      wantsSummonerInfo = false;
      updateSuggestedQuestions();
    }
  });
});

backButton.addEventListener("click", () => {
  hideActive(mainFormArea);
  hideActive(blurBackgroundOverlay);
  setTimeout(() => {
    hideElement(mainFormArea);
    hideElement(blurBackgroundOverlay);
    selectedGame = "";
    selectedGameHiddenInput.value = "";
    wantsSummonerInfo = false;
    clearForm();
    document.querySelectorAll(".game-card").forEach((card) => {
      card.classList.remove("selected");
    });
  }, 300); // 0.3s da transição CSS
});

btnYesSummoner.addEventListener("click", () => {
  wantsSummonerInfo = true;
  hideElement(summonerQuestionModal);
  showElement(lolSpecificFields);
  showElement(aiForm);
  updateSuggestedQuestions();
});

btnNoSummoner.addEventListener("click", () => {
  wantsSummonerInfo = false;
  hideElement(summonerQuestionModal);
  hideElement(lolSpecificFields);
  summonerNameInput.value = "";
  summonerTagInput.value = "";
  platformRegionSelect.value = "";
  showElement(aiForm);
  updateSuggestedQuestions();
});

const regionMap = {
  BR1: "br1",
  NA1: "na1",
  EUW1: "euw1",
  EUN1: "eun1",
  LA1: "la1",
  LA2: "la2",
  KR: "kr",
  JP1: "jp1",
  OC1: "oc1",
  PH2: "ph2",
  SG2: "sg2",
  TH2: "th2",
  TW2: "tw2",
  VN2: "vn2",
};

summonerTagInput.addEventListener("input", () => {
  const tag = summonerTagInput.value.toUpperCase();
  if (regionMap[tag]) {
    platformRegionSelect.value = regionMap[tag];
  } else {
    platformRegionSelect.value = "";
  }
});

aiForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const question = questionInput.value.trim();

  if (!selectedGame || question === "") {
    alert("Atenção! Por favor, selecione um jogo e preencha sua pergunta.");
    return;
  }

  askButton.disabled = true;
  askButton.textContent = "Perguntando...";
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

    if (summonerName === "" || summonerTag === "" || platformRegion === "") {
      alert(
        "Por favor, preencha todos os campos do invocador (Nome, Tag e Região)."
      );
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

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!mainFormArea.classList.contains("hidden")) {
      hideMainFormArea();
    }
  }
});

function hideMainFormArea() {
  hideActive(mainFormArea);
  hideActive(blurBackgroundOverlay);
  setTimeout(() => {
    hideElement(mainFormArea);
    hideElement(blurBackgroundOverlay);
    selectedGame = "";
    selectedGameHiddenInput.value = "";
    wantsSummonerInfo = false;
    clearForm();
    document.querySelectorAll(".game-card").forEach((card) => {
      card.classList.remove("selected");
    });
  }, 300); // 0.3s da transição CSS
}
