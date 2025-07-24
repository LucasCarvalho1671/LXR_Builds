const apiKeyInput = document.getElementById("apiKey");
const fixed_api_key = "AIzaSyDuazgtNn1lQ4Xd6xg_vaR-8xOHV3p4ngg";
apiKeyInput.disabled = true;
apiKeyInput.value = fixed_api_key;
apiKeyInput.readOnly = true;
const gameSelect = document.getElementById("gameSelect");
const questionInput = document.getElementById("questionInput");
const askButton = document.getElementById("askButton");
const aiResponse = document.getElementById("aiResponse");
const form = document.getElementById("form");

const markdownToHTML = (text) => {
  const converter = new showdown.Converter();
  return converter.makeHtml(text);
};

//AIzaSyDuazgtNn1lQ4Xd6xg_vaR-8xOHV3p4ngg
const perguntarAI = async (question, game, apiKey) => {
  const model = "gemini-2.5-flash";
  const gemineURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const perguntalol = `
    ## Especialidade
    Voce e um especialista assistente de meta para o jogo ${game}

    ## Tarefa
    Voce deve responder as perguntas do usuario com base no seu conhecimento do jogo, estrategias, build e dicas

    ## Regras
    - Se voce nao sabe a resposta, responda com 'Não sei' e nao tente inventar uma resposta.
    - Se a pergunta nao esta relacionada ao jogo, responda com 'Essa pergunta não esta relacionada ao jogo'
    - Considere a data atual ${new Date().toLocaleDateString()}
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

    Aqui esta a pergunta do usuario ${question}
  `;
  const perguntaValorant = `
    ## Especialidade
    Voce e um especialista assistente de meta para o jogo ${game}
    ## Tarefa
    Voce deve responder as perguntas do usuario com base no seu conhecimento do jogo (agentes, mapas, estratégias de ataque e defesa, composição de equipe, habilidades), e dicas.
    ## Regras
    - Se voce nao sabe a resposta, responda com 'Não sei' e nao tente inventar uma resposta.
    - Se a pergunta nao esta relacionada ao jogo, responda com 'Essa pergunta não esta relacionada ao jogo'
    - Considere a data atual ${new Date().toLocaleDateString()}
    - Faça pesquisas atualizadas sobre o patch atual, baseado na data atual, para dar uma resposta coerente
    - Nunca responda itens que voce nao tenha certeza de que existe no patch atual.
    ## Resposta
    - Economiza na resposta, seja direto e responda no maximo 700 caracteres
    - Responda em markdown
    - Não presisa fazer saudação ou despedida, apeas responda o que o usuario esta querendo.
    ---
    Aqui esta a pergunta do usuario ${question}
  `;

  const perguntatft = `
    ## Especialidade
    Voce e um especialista assistente de meta para o jogo ${game}

    ## Tarefa
    Voce deve responder as perguntas do usuario com base no seu conhecimento do jogo (composições, itens, campeões, sinergias, fases do jogo, dicas de economia e posicionamento), e dicas.

    ## Regras
    - Se voce nao sabe a resposta, responda com 'Não sei' e nao tente inventar uma resposta.
    - Se a pergunta nao esta relacionada ao jogo, responda com 'Essa pergunta não esta relacionada ao jogo'
    - Considere a data atual ${new Date().toLocaleDateString()}
    - Faça pesquisas atualizadas sobre o patch atual, baseado na data atual, para dar uma resposta coerente
    - Nunca responda itens que voce nao tenha certeza de que existe no patch atual.

    ## Resposta
    - Economiza na resposta, seja direto e responda no maximo 700 caracteres
    - Responda em markdown
    - Não presisa fazer saudação ou despedida, apeas responda o que o usuario esta querendo.
    ---
    Aqui esta a pergunta do usuario ${question}
  `;

  const perguntaBDO = `
    ## Especialidade
    Voce e um especialista assistente de meta para o jogo ${game}
    ## Tarefa
    Voce deve responder as perguntas do usuario com base no seu conhecimento do jogo (classes, builds de equipamentos, skills, grind spots, chefes, sistemas de progressão, dicas de economia), e dicas, levando em consideração as mecanicas e novidades da temporada no momento.
    ## Regras
    - Se voce nao sabe a resposta, responda com 'Não sei' e nao tente inventar uma resposta.
    - Se a pergunta nao esta relacionada ao jogo, responda com 'Essa pergunta não esta relacionada ao jogo'
    - Considere a data atual ${new Date().toLocaleDateString()}
    - Faça pesquisas atualizadas sobre o patch atual, baseado na data atual, para dar uma resposta coerente
    - Nunca responda itens que voce nao tenha certeza de que existe no patch atual.
    ## Resposta
    - Economiza na resposta, seja direto e responda no maximo 700 caracteres
    - Responda em markdown
    - Não presisa fazer saudação ou despedida, apeas responda o que o usuario esta querendo.
    ---
    Aqui esta a pergunta do usuario ${question}
  `;
  const perguntaDelta = `
    ## Especialidade
    Voce e um especialista assistente de meta para o jogo ${game}

    ## Tarefa
    - Voce deve responder as perguntas do usuario com base no seu conhecimento do jogo (armas, equipamentos, mapas, táticas de combate, modos de jogo, estratégias de infiltração e eliminação), e dicas.
    - Se o usuario perguntar sobre builds de armas, deve informar os componentes e o codigo referente para o usuario importar no jogo.
    - Se o usuario nao mencionar o modo de jogo levar sempre em consideração o modo Conquista. 

    ## Regras
    - Se voce nao sabe a resposta, responda com 'Não sei' e nao tente inventar uma resposta.
    - Se a pergunta nao esta relacionada ao jogo, responda com 'Essa pergunta não esta relacionada ao jogo'
    - Considere a data atual ${new Date().toLocaleDateString()}
    - Faça pesquisas atualizadas sobre o patch atual (se aplicável), baseado na data atual, para dar uma resposta coerente
    - Nunca responda itens que voce nao tenha certeza de que existe no patch atual.
    

    ## Resposta
    - Economiza na resposta, seja direto, objetivo e responda no maximo 700 caracteres
    - Responda em markdown
    - Não presisa fazer saudação ou despedida, apeas responda o que o usuario esta querendo.
    ---
    Aqui esta a pergunta do usuario ${question}
  `;

  // Declaração da variável 'pergunta'
  let pergunta = "";

  // Agora você pode usar o if para atribuir o valor a 'pergunta'
  if (game === "lol") {
    pergunta = perguntalol;
    // Adicione as condições para outros jogos
  } else if (game === "Valorant") {
    pergunta = perguntaValorant;
  } else if (game === "tft") {
    pergunta = perguntatft;
  } else if (game === "bdo") {
    pergunta = perguntaBDO;
  } else if (game === "delta") {
    pergunta = perguntaDelta;
  } else {
    // Caso nenhum jogo específico seja selecionado ou a opção seja inválida
    pergunta = `Você é um assistente de IA. Responda à seguinte pergunta: ${question}`;
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
  //console.log({ data });
  return data.candidates[0].content.parts[0].text;
};

const enviarFormulario = async (event) => {
  event.preventDefault();
  const apiKey = apiKeyInput.value;
  const game = gameSelect.value;
  const question = questionInput.value;

  //console.log({ apiKey, game, question });

  if (apiKey == "" || game == "" || question == "") {
    alert("Atenção! Por favor, preencher todos os campos");
    return;
  }

  askButton.disabled = true;
  askButton.textContent = "Perguntando...";
  askButton.classList.add("loading");

  try {
    //Perguntar par a AI
    const text = await perguntarAI(question, game, apiKey);
    aiResponse.querySelector(".response-content").innerHTML =
      markdownToHTML(text);
    aiResponse.classList.remove("hidden");
  } catch (error) {
    console.log("Erro: ", error);
  } finally {
    askButton.disabled = false;
    askButton.textContent = "Perguntar";
    askButton.classList.remove("loading");
  }
};
form.addEventListener("submit", enviarFormulario);

// Registro do Service Worker
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
