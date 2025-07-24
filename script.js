const apiKeyInput = document.getElementById("apiKey");
const fixed_api_key = "AIzaSyDuazgtNn1lQ4Xd6xg_vaR-8xOHV3p4ngg"; // Sua API Key fixa aqui
apiKeyInput.value = fixed_api_key;
apiKeyInput.readOnly = true; // Bloqueia o campo para edição

// REMOVIDA: const gameSelect = document.getElementById("gameSelect");

const questionInput = document.getElementById("questionInput");
const askButton = document.getElementById("askButton");
const aiResponse = document.getElementById("aiResponse");
const form = document.getElementById("form");
const gameSelectionContainer = document.getElementById(
  "gameSelectionContainer"
); // NOVO: Referência ao container das capas
const selectedGameHiddenInput = document.getElementById("selectedGameHidden"); // NOVO: Referência ao campo oculto

const markdownToHTML = (text) => {
  const converter = new showdown.Converter();
  return converter.makeHtml(text);
};

// Seus prompts de jogo (AGORA DECLARADOS ANTES DE SEREM USADOS)
const perguntalol = `
  ## Especialidade
  Voce e um especialista assistente de meta para o jogo \${game}

  ## Tarefa
  Voce deve responder as perguntas do usuario com base no seu conhecimento do jogo, estrategias, build e dicas

  ## Regras
  - Se voce nao sabe a resposta, responda com 'Não sei' e nao tente inventar uma resposta.
  - Se a pergunta nao esta relacionada ao jogo, responda com 'Essa pergunta não esta relacionada ao jogo'
  - Considere a data atual \${new Date().toLocaleDateString()}
  - Faça pesquisas atualizadas sobre o patch atual, baseado na data atual, para dar uma resposta coerente
  - Nunca responda itens que voce nao tenha certeza de que existe no patch atual.

  ## Resposta
  - Economiza na resposta, seja direto e responda no maximo 700 caracteres
  - Responda em markdown
  - Não presisa fazer saudação ou despedida, apeas responda o que o usuario esta querendo.

  ## Exemplo de resposta
  Pergunta do usuario: Melhor build rengar jungle
  resposta: A build mais atual e: \n\n **Itens**\n\n coloque os itens aqui. \n\n**Runas**\n\n exemplos de runas \n\n

  ---

  Aqui esta a pergunta do usuario \${question}
`;
const perguntaValorant = `
  ## Especialidade
  Voce e um especialista assistente de meta para o jogo \${game}
  ## Tarefa
  Voce deve responder as perguntas do usuario com base no seu conhecimento do jogo (agentes, mapas, estratégias de ataque e defesa, composição de equipe, habilidades), e dicas.
  ## Regras
  - Se voce nao sabe a resposta, responda com 'Não sei' e nao tente inventar uma resposta.
  - Se a pergunta nao esta relacionada ao jogo, responda com 'Essa pergunta não esta relacionada ao jogo'
  - Considere a data atual \${new Date().toLocaleDateString()}
  - Faça pesquisas atualizadas sobre o patch atual, baseado na data atual, para dar uma resposta coerente
  - Nunca responda itens que voce nao tenha certeza de que existe no patch atual.
  ## Resposta
  - Economiza na resposta, seja direto e responda no maximo 700 caracteres
  - Responda em markdown
  - Não presisa fazer saudação ou despedida, apeas responda o que o usuario esta querendo.
  ---
  Aqui esta a pergunta do usuario \${question}
`;

const perguntatft = `
  ## Especialidade
  Voce e um especialista assistente de meta para o jogo \${game}

  ## Tarefa
  Voce deve responder as perguntas do usuario com base no seu conhecimento do jogo (composições, itens, campeões, sinergias, fases do jogo, dicas de economia e posicionamento), e dicas.

  ## Regras
  - Se voce nao sabe a resposta, responda com 'Não sei' e nao tente inventar uma resposta.
  - Se a pergunta nao esta relacionada ao jogo, responda com 'Essa pergunta não esta relacionada ao jogo'
  - Considere a data atual \${new Date().toLocaleDateString()}
  - Faça pesquisas atualizadas sobre o patch atual, baseado na data atual, para dar uma resposta coerente
  - Nunca responda itens que voce nao tenha certeza de que existe no patch atual.

  ## Resposta
  - Economiza na resposta, seja direto e responda no maximo 700 caracteres
  - Responda em markdown
  - Não presisa fazer saudação ou despedida, apeas responda o que o usuario esta querendo.
  ---
  Aqui esta a pergunta do usuario \${question}
`;

const perguntaBDO = `
  ## Especialidade
  Voce e um especialista assistente de meta para o jogo \${game}
  ## Tarefa
  Voce deve responder as perguntas do usuario com base no seu conhecimento do jogo (classes, builds de equipamentos, skills, grind spots, chefes, sistemas de progressão, dicas de economia), e dicas, levando em consideração as mecanicas e novidades da temporada no momento.
  ## Regras
  - Se voce nao sabe a resposta, responda com 'Não sei' e nao tente inventar uma resposta.
  - Se a pergunta nao esta relacionada ao jogo, responda com 'Essa pergunta não esta relacionada ao jogo'
  - Considere a data atual \${new Date().toLocaleDateString()}
  - Faça pesquisas atualizadas sobre o patch atual, baseado na data atual, para dar uma resposta coerente
  - Nunca responda itens que voce nao tenha certeza de que existe no patch atual.
  ## Resposta
  - Economiza na resposta, seja direto e responda no maximo 700 caracteres
  - Responda em markdown
  - Não presisa fazer saudação ou despedida, apeas responda o que o usuario esta querendo.
  ---
  Aqui esta a pergunta do usuario \${question}
`;
const perguntaDelta = `
  ## Especialidade
  Voce e um especialista assistente de meta para o jogo \${game}

  ## Tarefa
  - Voce deve responder as perguntas do usuario com base no seu conhecimento do jogo (armas, equipamentos, mapas, táticas de combate, modos de jogo, estratégias de infiltração e eliminação), e dicas.
  - Se o usuario perguntar sobre builds de armas, deve informar os componentes e o codigo referente para o usuario importar no jogo.
  - Se o usuario nao mencionar o modo de jogo levar sempre em consideração o modo Conquista.

  ## Regras
  - Se voce nao sabe a resposta, responda com 'Não sei' e nao tente inventar uma resposta.
  - Se a pergunta nao esta relacionada ao jogo, responda com 'Essa pergunta não esta relacionada ao jogo'
  - Considere a data atual \${new Date().toLocaleDateString()}
  - Faça pesquisas atualizadas sobre o patch atual (se aplicável), baseado na data atual, para dar uma resposta coerente
  - Nunca responda itens que voce nao tenha certeza de que existe no patch atual.


  ## Resposta
  - Economiza na resposta, seja direto, objetivo e responda no maximo 700 caracteres
  - Responda em markdown
  - Não presisa fazer saudação ou despedida, apeas responda o que o usuario esta querendo.
  ---
  Aqui esta a pergunta do usuario \${question}
`;

const perguntarAI = async (question, game, apiKey) => {
  const model = "gemini-2.5-flash";
  const gemineURL = `https://generativelanguage.googleapis.com/v1beta/models/\${model}:generateContent?key=\${apiKey}`;

  let pergunta = "";
  if (game === "lol") {
    pergunta = perguntalol;
  } else if (game === "Valorant") {
    pergunta = perguntaValorant;
  } else if (game === "tft") {
    pergunta = perguntatft;
  } else if (game === "bdo") {
    pergunta = perguntaBDO;
  } else if (game === "delta") {
    pergunta = perguntaDelta;
  } else {
    pergunta = `Você é um assistente de IA. Responda à seguinte pergunta: \${question}`;
  }

  const contents = [
    {
      role: "user",
      parts: [
        {
          text: pergunta,
        },
      ],
    },
  ];

  const tools = [
    {
      google_search: {},
    },
  ];
  // Chamada API
  const response = await fetch(gemineURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents,
      tools,
    }),
  });

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
};

// Lógica para seleção do jogo via clique nas capas
let selectedGame = ""; // Variável para armazenar o jogo selecionado

gameSelectionContainer.addEventListener("click", (event) => {
  const clickedCard = event.target.closest(".game-card"); // Encontra o game-card clicado

  if (clickedCard) {
    // Remove a classe 'selected' de todos os cards
    document.querySelectorAll(".game-card").forEach((card) => {
      card.classList.remove("selected");
    });

    // Adiciona a classe 'selected' apenas ao card clicado
    clickedCard.classList.add("selected");

    // Armazena o valor do jogo no campo oculto
    selectedGame = clickedCard.dataset.gameValue;
    selectedGameHiddenInput.value = selectedGame; // Atualiza o valor do input hidden
    console.log("Jogo selecionado:", selectedGame); // Para depuração
  }
});

const enviarFormulario = async (event) => {
  event.preventDefault();
  const apiKey = apiKeyInput.value;
  // AQUI: Pegue o jogo do input hidden, não mais do select
  const game = selectedGameHiddenInput.value; // CORRIGIDO: Agora pega do input hidden
  const question = questionInput.value;

  if (apiKey === "" || game === "" || question === "") {
    // CORRIGIDO: Usando === e verificando 'game' do input hidden
    alert(
      "Atenção! Por favor, preencher todos os campos e selecionar um jogo!"
    );
    return;
  }

  askButton.disabled = true;
  askButton.textContent = "Perguntando...";
  askButton.classList.add("loading");

  try {
    const text = await perguntarAI(question, game, apiKey);
    aiResponse.querySelector(".response-content").innerHTML =
      markdownToHTML(text);
    aiResponse.classList.remove("hidden");
  } catch (error) {
    console.error("Erro: ", error); // Use console.error para erros
    aiResponse.querySelector(".response-content").innerHTML =
      "<p>Ocorreu um erro ao obter a resposta da IA. Verifique sua API Key ou tente novamente mais tarde.</p>";
    aiResponse.classList.remove("hidden");
  } finally {
    askButton.disabled = false;
    askButton.textContent = "Perguntar";
    askButton.classList.remove("loading");
  }
};
form.addEventListener("submit", enviarFormulario);

// Registro do Service Worker (para PWA)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js") // Caminho para o seu service worker
      .then((registration) => {
        console.log(
          "Service Worker registrado com sucesso:",
          registration.scope
        );
      })
      .catch((error) => {
        console.error("Falha ao registrar Service Worker:", error);
      });
  });
}
