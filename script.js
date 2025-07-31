// Seletores de elementos HTML
const gameSelectionContainer = document.getElementById("gameSelectionContainer");
const gameCards = document.querySelectorAll(".game-card");
const selectedGameHiddenInput = document.getElementById("selectedGameHiddenInput");
const mainFormArea = document.getElementById("mainFormArea");
const selectedGameDisplay = document.getElementById("selectedGameDisplay");

const summonerQuestionModal = document.getElementById("summonerQuestionModal");
const btnYesSummoner = document.getElementById("btnYesSummoner");
const btnNoSummoner = document.getElementById("btnNoSummoner");

const lolSpecificFields = document.getElementById("lolSpecificFields");
const summonerNameInput = document.getElementById("summonerNameInput");
const summonerTagInput = document.getElementById("summonerTagInput");
const platformRegionSelect = document.getElementById("platformRegionSelect");

const suggestedQuestionsContainer = document.getElementById("suggestedQuestionsContainer");
const suggestedQuestionsList = document.getElementById("suggestedQuestionsList");

const aiForm = document.getElementById("aiForm");
const questionInput = document.getElementById("questionInput");
const askButton = document.getElementById("askButton");
const aiResponse = document.getElementById("aiResponse");

// Variáveis para armazenar dados da análise do jogador (para contexto de perguntas futuras)
let lastPlayerAnalysisData = null; // Armazenará { playerSummary, geminiAnalysis }
let selectedGameName = ""; // Armazena o nome amigável do jogo selecionado

// Função para converter Markdown para HTML
const markdownToHTML = (markdownText) => {
    // Implementação básica de markdown para HTML
    // Você pode usar uma biblioteca como 'marked.js' para algo mais robusto
    let html = markdownText.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/__(.*)__/gim, '<strong>$1</strong>');
    html = html.replace(/\n/g, '<br>'); // Converte quebras de linha em <br>
    return html;
};

// --- Funções de Visibilidade ---
const showElement = (element) => element.classList.remove("hidden");
const hideElement = (element) => element.classList.add("hidden");

const updateSelectedGameDisplay = (gameId) => {
    let imgPath = '';
    let gameDisplayName = '';
    switch (gameId) {
        case 'lol': imgPath = 'img/lol_cover.jpg'; gameDisplayName = 'League of Legends'; break;
        case 'valorant': imgPath = 'img/valorant_cover.jpg'; gameDisplayName = 'Valorant'; break;
        case 'bdo': imgPath = 'img/bdo_cover.jpg'; gameDisplayName = 'Black Desert Online'; break;
        case 'tft': imgPath = 'img/tft_cover.jpg'; gameDisplayName = 'Teamfight Tactics'; break;
        case 'deltaforce': imgPath = 'img/delta_force_cover.jpg'; gameDisplayName = 'Delta Force'; break;
        default: imgPath = ''; gameDisplayName = ''; break;
    }
    selectedGameDisplay.innerHTML = `
        <img src="${imgPath}" alt="${gameDisplayName}">
        <p>${gameDisplayName}</p>
    `;
    selectedGameName = gameDisplayName; // Armazena o nome amigável
    showElement(selectedGameDisplay);
};

// --- Lógica de Seleção de Jogo ---
gameCards.forEach(card => {
    card.addEventListener("click", () => {
        const gameId = card.dataset.game;
        selectedGameHiddenInput.value = gameId;

        // Resetar estado anterior
        hideElement(gameSelectionContainer);
        showElement(mainFormArea);
        hideElement(lolSpecificFields);
        hideElement(summonerQuestionModal);
        hideElement(suggestedQuestionsContainer);
        aiResponse.classList.add("hidden"); // Esconder resposta anterior
        questionInput.value = ""; // Limpa o campo de pergunta
        lastPlayerAnalysisData = null; // Limpa dados de análise anteriores

        updateSelectedGameDisplay(gameId); // Atualiza capa e nome do jogo

        if (gameId === 'lol') {
            showElement(summonerQuestionModal); // Pergunta específica para LoL
        } else {
            // Para outros jogos, apenas mostra o campo de pergunta genérica
            questionInput.placeholder = `Faça sua pergunta sobre ${selectedGameName}...`;
            // Definir o comportamento do botão "Perguntar" para consulta genérica
            aiForm.removeEventListener("submit", handleLoLAnalysisSubmit); // Remove listener anterior
            aiForm.addEventListener("submit", handleGenericQuestionSubmit); // Adiciona listener para genérico
        }
    });
});

// --- Lógica do Modal de Pergunta do Invocador (LoL) ---
btnYesSummoner.addEventListener("click", () => {
    hideElement(summonerQuestionModal);
    showElement(lolSpecificFields);
    questionInput.placeholder = `Faça sua pergunta sobre ${selectedGameName} ou deixe em branco para análise...`;
    // Definir o comportamento do botão "Perguntar" para análise de desempenho
    aiForm.removeEventListener("submit", handleGenericQuestionSubmit); // Remove listener anterior
    aiForm.addEventListener("submit", handleLoLAnalysisSubmit); // Adiciona listener para LoL
});

btnNoSummoner.addEventListener("click", () => {
    hideElement(summonerQuestionModal);
    hideElement(lolSpecificFields); // Garante que os campos de invocador estejam ocultos
    questionInput.placeholder = `Faça sua pergunta geral sobre ${selectedGameName}...`;
    // Definir o comportamento do botão "Perguntar" para consulta genérica
    aiForm.removeEventListener("submit", handleLoLAnalysisSubmit); // Remove listener anterior
    aiForm.addEventListener("submit", handleGenericQuestionSubmit); // Adiciona listener para genérico
});

// --- Funções de Chamada ao Backend ---

// Função para buscar a análise do jogador de LoL
const getPlayerAnalysis = async (gameName, tagLine, platformRegion) => {
    try {
        const response = await fetch(`http://localhost:3000/api/analyze-player-performance/${gameName}/${tagLine}/${platformRegion}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao obter análise do backend.');
        }
        const data = await response.json();
        lastPlayerAnalysisData = data; // Armazena a análise para uso posterior
        return data;
    } catch (error) {
        console.error("Erro ao chamar o backend para análise:", error);
        throw error;
    }
};

// Função para fazer uma pergunta genérica ao Gemini via backend
const askGeminiGeneralQuestion = async (game, question, contextData = null) => {
    try {
        const response = await fetch(`http://localhost:3000/api/gemini-ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ game, question, contextData }), // Envia o contexto se houver
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao obter resposta da IA.');
        }
        const data = await response.json();
        return data.geminiResponse;
    } catch (error) {
        console.error("Erro ao chamar o backend para pergunta genérica:", error);
        throw error;
    }
};

// --- Funções de Manipulação de Formulário ---

// Handler para análise de desempenho de LoL ou pergunta contextualizada
const handleLoLAnalysisSubmit = async (event) => {
    event.preventDefault();

    const gameName = summonerNameInput.value.trim();
    const tagLine = summonerTagInput.value.trim();
    const platformRegion = platformRegionSelect.value;
    const question = questionInput.value.trim(); // Pode ser vazio para análise pura

    askButton.disabled = true;
    askButton.textContent = "Analisando...";
    askButton.classList.add("loading");
    aiResponse.classList.add("hidden"); // Esconder resposta anterior
    hideElement(suggestedQuestionsContainer); // Esconder sugestões anteriores

    try {
        // Se a pergunta estiver preenchida E já houver uma análise anterior (lastPlayerAnalysisData),
        // é uma pergunta contextualizada.
        if (question && lastPlayerAnalysisData) {
            askButton.textContent = "Perguntando..."; // Mudar texto do botão para contextualizado
            const geminiResponse = await askGeminiGeneralQuestion(selectedGameHiddenInput.value, question, lastPlayerAnalysisData);
            aiResponse.querySelector(".response-content").innerHTML = markdownToHTML(geminiResponse);
        } else if (gameName && tagLine && platformRegion) { 
            // Caso contrário, se os campos de invocador estiverem preenchidos, é uma análise inicial de desempenho.
            askButton.textContent = "Analisando..."; // Mudar texto do botão para análise
            const analysis = await getPlayerAnalysis(gameName, tagLine, platformRegion);
            aiResponse.querySelector(".response-content").innerHTML = markdownToHTML(analysis.geminiAnalysis);
            renderSuggestedQuestions(analysis.playerSummary); // Passa o playerSummary para a função de sugestões
        } else {
            // Se nenhum dos casos acima, significa que o usuário não preencheu os campos para análise
            // E também não digitou uma pergunta contextualizada com análise já feita.
            // Trata como uma pergunta genérica sobre LoL.
            if (!question) {
                alert("Por favor, preencha Nome do Invocador, Tag e Região para análise ou faça uma pergunta.");
                return; // Impede a continuação se nenhum dado relevante for fornecido
            }
            askButton.textContent = "Perguntando..."; // Mudar texto do botão
            const geminiResponse = await askGeminiGeneralQuestion(selectedGameHiddenInput.value, question);
            aiResponse.querySelector(".response-content").innerHTML = markdownToHTML(geminiResponse);
        }
        showElement(aiResponse);

    } catch (error) {
        console.error("Erro na análise/pergunta contextualizada:", error);
        aiResponse.querySelector(".response-content").innerHTML =
            `<p>Ocorreu um erro: ${error.message}. Verifique os dados e tente novamente.</p>`;
        showElement(aiResponse);
    } finally {
        askButton.disabled = false;
        askButton.textContent = "Perguntar";
        askButton.classList.remove("loading");
    }
};

// Handler para perguntas genéricas (outros jogos ou LoL sem invocador)
const handleGenericQuestionSubmit = async (event) => {
    event.preventDefault();

    const game = selectedGameHiddenInput.value;
    const question = questionInput.value.trim();

    if (!game || !question) {
        alert("Por favor, selecione um jogo e faça sua pergunta.");
        return;
    }

    askButton.disabled = true;
    askButton.textContent = "Perguntando...";
    askButton.classList.add("loading");
    aiResponse.classList.add("hidden"); // Esconder resposta anterior
    hideElement(suggestedQuestionsContainer); // Esconder sugestões anteriores

    try {
        const geminiResponse = await askGeminiGeneralQuestion(game, question);
        aiResponse.querySelector(".response-content").innerHTML = markdownToHTML(geminiResponse);
        showElement(aiResponse);
    } catch (error) {
        console.error("Erro na pergunta genérica:", error);
        aiResponse.querySelector(".response-content").innerHTML =
            `<p>Ocorreu um erro: ${error.message}. Tente novamente mais tarde.</p>`;
        showElement(aiResponse);
    } finally {
        askButton.disabled = false;
        askButton.textContent = "Perguntar";
        askButton.classList.remove("loading");
    }
};

// --- Função para Renderizar Perguntas Sugeridas ---
const renderSuggestedQuestions = (playerSummary) => {
    suggestedQuestionsList.innerHTML = ''; // Limpa sugestões anteriores

    // Extrair estatísticas por campeão do playerSummary
    const champStatsRegex = /- (.*?): (\d+) jogos, KDA: ([\d.]+)\/([\d.]+)\/([\d.]+), Vitórias: ([\d.]+)%/g;
    let match;
    const championData = [];

    while ((match = champStatsRegex.exec(playerSummary)) !== null) {
        // Assegura que o KDA seja um número válido para ordenação
        const deaths = parseFloat(match[4]);
        const kdaCalculated = deaths === 0 ? (parseFloat(match[3]) + parseFloat(match[5])) : ((parseFloat(match[3]) + parseFloat(match[5])) / deaths).toFixed(1);
        
        championData.push({
            name: match[1],
            games: parseInt(match[2]),
            kda: parseFloat(kdaCalculated), 
            winRate: parseFloat(match[6])
        });
    }

    if (championData.length === 0) {
        hideElement(suggestedQuestionsContainer);
        return;
    }

    // Ordenar para encontrar melhor e pior
    // Prioridade: WinRate (maior), depois KDA (maior)
    championData.sort((a, b) => {
        if (b.winRate !== a.winRate) {
            return b.winRate - a.winRate;
        }
        return b.kda - a.kda;
    });

    const bestChampion = championData[0];
    // Para o "pior", vamos pegar o último após ordenar (pior winrate/KDA).
    // Filtramos para evitar pegar campeões com pouquíssimos jogos se houver outros com mais dados.
    // Ou simplesmente o que está no final da lista ordenada por desempenho
    let worstChampion = null;
    if (championData.length > 1) {
        // Encontrar o pior que tenha pelo menos 2 jogos, para ter dados mais representativos
        const significantGames = championData.filter(c => c.games >= 2);
        if (significantGames.length > 0) {
            worstChampion = significantGames[significantGames.length - 1]; // O último dos "significativos"
        } else {
            worstChampion = championData[championData.length - 1]; // Se não houver, pega o último de qualquer jeito
        }
    }


    if (bestChampion) {
        const btn = document.createElement('button');
        btn.classList.add('suggested-question-button', 'best-champion');
        btn.textContent = `Build para ${bestChampion.name} (meu melhor campeão)?`; 
        btn.onclick = () => { questionInput.value = `Qual a melhor build e runas para ${bestChampion.name} no patch atual, considerando que é meu melhor campeão?`; askButton.click(); };
        suggestedQuestionsList.appendChild(btn);
    }

    // Adicionar o pior campeão apenas se não for o mesmo que o melhor e houver mais de um
    if (worstChampion && championData.length > 1 && worstChampion.name !== bestChampion.name) {
        const btn = document.createElement('button');
        btn.classList.add('suggested-question-button', 'worst-champion');
        btn.textContent = `Como melhorar jogando de ${worstChampion.name} (meu pior campeão)?`;
        btn.onclick = () => { questionInput.value = `Como posso melhorar meu desempenho jogando de ${worstChampion.name}? Quais são os erros comuns e dicas para este campeão?`; askButton.click(); };
        suggestedQuestionsList.appendChild(btn);
    }

    // Outras sugestões genéricas de LoL
    const genericLolQuestions = [
        "Estratégias de early game em League of Legends?",
        "Dicas para warding eficiente no LoL?",
        "Como dar roaming na mid lane?",
        "O que fazer quando estou atrás no jogo?",
    ];

    genericLolQuestions.forEach(q => {
        const btn = document.createElement('button');
        btn.classList.add('suggested-question-button');
        btn.textContent = q;
        btn.onclick = () => { questionInput.value = q; askButton.click(); };
        suggestedQuestionsList.appendChild(btn);
    });

    showElement(suggestedQuestionsContainer);
};

// --- Inicialização do Service Worker ---
// O Service Worker foi movido para sw.js e referenciado em index.html
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js') // Certifique-se que o caminho está correto
            .then(registration => {
                console.log('Service Worker registrado com sucesso:', registration.scope);
            })
            .catch(error => {
                console.error('Falha no registro do Service Worker:', error);
            });
    });
}

// Inicializa o formulário para ter o listener correto ao carregar a página (nenhum jogo selecionado)
// Por padrão, não há um listener no form, ele é adicionado/removido dinamicamente.
// Poderíamos adicionar um listener inicial genérico aqui se quiséssemos um comportamento padrão.
// No nosso caso, o formulário só terá um listener depois que um jogo for selecionado.