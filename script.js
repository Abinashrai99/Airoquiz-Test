// Global Variables
let airportData = { domestic: [], intl: [] }; 
let airlineData = [];
let gameQueue = [];
let currentQuestions = [];
let currentMode = 'domestic';
let stats = { tq: 0, c: 0, w: 0, p: 0 };
let currentQuestion = {};
let timerInterval;
let timeLeft = 10;
const MAX_QUESTIONS = 20;

// Load JSON files
async function loadAllData() {
    try {
        const [resAirports, resAirlines] = await Promise.all([
            fetch('airportsdata.json'),
            fetch('airlinesdata.json')
        ]);
        airportData = await resAirports.json();
        airlineData = await resAirlines.json();
        console.log("Mission data synchronized!");
    } catch (error) {
        console.error("Flight deck error: Could not load data files.", error);
    }
}
loadAllData();

function shuffle(array) {
    let a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function searchEngine() {
    let input = document.getElementById('search-input').value.toUpperCase().trim();
    let res = document.getElementById('search-results');
    if (input.length < 2) { res.innerHTML = ""; return; }

    const all = [...airportData.domestic, ...airportData.intl, ...airlineData];
    let match = all.find(a => a.c === input) || all.find(a => a.n.toUpperCase().includes(input));

    if (match) { 
        res.innerHTML = `<div style="color:#2c3e50; padding:12px; background:#e1f5fe; border-radius:8px; border-left: 5px solid #3498db; text-align: left;">
            <small style="color:#3498db; font-weight:bold; display:block; font-size: 0.7em;">IDENTIFIED</small>
            <b>${match.c}</b> — ${match.n}</div>`; 
    } else { 
        res.innerHTML = "<div style='color:#e74c3c; padding:8px; font-size:0.85em;'>❌ No match found</div>"; 
    }
}

function startGame(mode) {
    currentMode = mode;
    currentQuestions = (mode === 'airlines') ? airlineData : airportData[mode];

    if (!currentQuestions || currentQuestions.length === 0) {
        alert("Systems still booting up! Please try again in a second.");
        return;
    }

    stats = { tq: 0, c: 0, w: 0, p: 0 };
    gameQueue = shuffle(currentQuestions);
    
    document.getElementById('menu').classList.remove('active');
    document.getElementById('game').classList.add('active');
    document.getElementById('mode-label').innerText = mode.toUpperCase() + " MISSION";
    
    updateUI();
    nextQuestion();
}

function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 10;
    updateTimerBar();
    timerInterval = setInterval(() => {
        timeLeft -= 0.1;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            checkAnswer(null); 
        }
        updateTimerBar();
    }, 100);
}

function updateTimerBar() {
    document.getElementById('timer-bar').style.width = (timeLeft / 10) * 100 + "%";
}

function nextQuestion() {
    if (stats.tq >= MAX_QUESTIONS || stats.tq >= gameQueue.length) {
        showResults();
        return;
    }

    document.getElementById('msg').innerText = "";
    currentQuestion = gameQueue[stats.tq]; 
    document.getElementById('question-text').innerText = currentQuestion.n;
    
    let options = [currentQuestion.c];
    while(options.length < 4) {
        let r = currentQuestions[Math.floor(Math.random() * currentQuestions.length)].c;
        if(!options.includes(r)) options.push(r);
    }
    options = shuffle(options);

    const box = document.getElementById('choices');
    box.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "option-btn";
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(opt);
        box.appendChild(btn);
    });
    startTimer();
}

function checkAnswer(selected) {
    clearInterval(timerInterval);
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(btn => btn.disabled = true);

    stats.tq++; 
    if(selected === currentQuestion.c) {
        try { document.getElementById('snd-correct').play(); } catch(e){}
        document.getElementById('msg').innerHTML = "<span style='color:green'>Correct! ✅</span>";
        stats.c++; stats.p += 10;
    } else {
        try { document.getElementById('snd-wrong').play(); } catch(e){}
        let revealMsg = selected === null ? "Time Out!" : "Wrong!";
        document.getElementById('msg').innerHTML = `<span style='color:red; font-size: 0.9em;'>${revealMsg} It was ${currentQuestion.c}</span>`;
        stats.w++;
    }
    updateUI();
    setTimeout(nextQuestion, 2000); 
}

function showResults() {
    document.getElementById('game').classList.remove('active');
    document.getElementById('results').classList.add('active');
    const accuracy = Math.round((stats.c / stats.tq) * 100) || 0;
    let rank = accuracy === 100 ? "🏆 SENIOR CAPTAIN" : accuracy >= 80 ? "👨‍✈️ CAPTAIN" : "🛩️ CADET";
    document.getElementById('rank-display').innerText = rank;
    document.getElementById('final-stats').innerHTML = `
        <div class="stat-card"><small>Score</small><b>${stats.p}</b></div>
        <div class="stat-card"><small>Accuracy</small><b>${accuracy}%</b></div>
        <div class="stat-card"><small>Correct</small><b>${stats.c}</b></div>
        <div class="stat-card"><small>Mistakes</small><b>${stats.w}</b></div>
    `;
}

function updateUI() {
    document.getElementById('tq').innerText = stats.tq;
    document.getElementById('correct').innerText = stats.c;
    document.getElementById('score').innerText = stats.p;
}