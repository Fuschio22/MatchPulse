// Simula eventi live in tempo reale
function simulateLiveEvents() {
    let currentMinute = 67;
    let currentScore = { home: 2, away: 1 };
    
    // Aggiorna il minuto ogni secondo
    const timerInterval = setInterval(() => {
        currentMinute++;
        
        // Aggiorna la featured match
        updateFeaturedMatchTime(currentMinute, currentScore);
        
        // Simula eventi casuali
        if (Math.random() > 0.7) {
            const eventType = Math.random();
            
            if (eventType > 0.9) {
                // Gol
                const isHome = Math.random() > 0.5;
                if (isHome) {
                    currentScore.home++;
                    showLiveEvent('goal', 'Lautaro Martinez', 'Inter', currentMinute);
                } else {
                    currentScore.away++;
                    showLiveEvent('goal', 'Leao', 'Milan', currentMinute);
                }
                updateFeaturedMatchScore(currentScore);
            } else if (eventType > 0.7) {
                // Cartellino
                showLiveEvent('yellow', 'Barella', 'Inter', currentMinute);
            } else {
                // Sostituzione
                showLiveEvent('substitution', 'Correa → Dzeko', 'Inter', currentMinute);
            }
        }
        
        // Fine partita dopo 95 minuti
        if (currentMinute >= 95) {
            clearInterval(timerInterval);
            showLiveEvent('fulltime', 'Fine Partita', '', 95);
            updateFeaturedMatchStatus('FINISHED', currentMinute);
        }
    }, 3000); // Ogni 3 secondi = 1 minuto di gioco
}

// Mostra evento live nel popup
function showLiveEvent(type, player, team, minute) {
    MatchPulsePopup.showEvent({
        type: type,
        player: player,
        team: team,
        minute: minute
    });
}

// Aggiorna il tempo nella featured match
function updateFeaturedMatchTime(minute, score) {
    const minuteElement = document.querySelector('.match-minute');
    if (minuteElement) {
        minuteElement.textContent = minute + "'";
    }
    
    // Aggiorna anche le card live
    const liveCards = document.querySelectorAll('.match-card-header .live-indicator');
    liveCards.forEach(card => {
        if (card.textContent.includes('Inter') || card.textContent.includes('Milan')) {
            card.innerHTML = '<span class="live-dot"></span>' + minute + "'";
        }
    });
}

// Aggiorna il punteggio
function updateFeaturedMatchScore(score) {
    const scoreElement = document.querySelector('.score');
    if (scoreElement) {
        scoreElement.textContent = `${score.home} - ${score.away}`;
        // Animazione
        scoreElement.style.transform = 'scale(1.2)';
        setTimeout(() => {
            scoreElement.style.transform = 'scale(1)';
        }, 300);
    }
}

// Aggiorna stato partita
function updateFeaturedMatchStatus(status, minute) {
    const statusElement = document.querySelector('.match-status');
    if (statusElement) {
        statusElement.innerHTML = `<span class="match-minute">${status}</span>`;
        statusElement.classList.remove('live');
    }
}
