/**
 * MatchPulse Main App Module
 * Initializes the application and coordinates all modules
 */

const MatchPulseApp = (() => {
    
    // Stato dell'applicazione
    let currentMatchId = null;
    let featuredMatchId = null;
    let refreshInterval = null;
    
    // Inizializza l'applicazione
    async function init() {
        console.log('MatchPulse initializing...');
        
        // Inizializza i moduli
        MatchPulseUI.init();
        MatchPulsePopup.init();
        
        // Carica i dati iniziali
        await loadInitialData();
        
        // Avvia il refresh automatico
        startAutoRefresh();
        
        // Setup event listeners
        setupEventListeners();
        
        console.log('MatchPulse ready!');
    }
    
    // Carica tutti i dati iniziali
    async function loadInitialData() {
        try {
            // Carica partita in evidenza
            await loadFeaturedMatch();
            
            // Carica partite live
            await loadLiveMatches();
            
            // Carica partite di oggi
            await loadTodayMatches();
            
            // Carica competizioni
            await MatchPulseUI.renderCompetitions();
            
            // Carica preferiti
            await loadFavorites();
            
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }
    
    // Carica la partita in evidenza
    async function loadFeaturedMatch() {
        try {
            // Controlla se c'è una partita in evidenza salvata
            const savedFeaturedId = localStorage.getItem('matchpulse_featured');
            
            let match;
            if (savedFeaturedId) {
                featuredMatchId = savedFeaturedId;
                match = await MatchPulseAPI.getMatchDetails(savedFeaturedId);
            } else {
                match = await MatchPulseAPI.getFeaturedMatch();
                if (match) {
                    featuredMatchId = match.id;
                }
            }
            
            if (match) {
                MatchPulseUI.renderFeaturedMatch(match);
                updatePinButton();
            }
        } catch (error) {
            console.error('Error loading featured match:', error);
        }
    }
    
    // Carica le partite live
    async function loadLiveMatches() {
        try {
            const matches = await MatchPulseAPI.getLiveMatches();
            MatchPulseUI.renderLiveMatches(matches);
        } catch (error) {
            console.error('Error loading live matches:', error);
        }
    }
    
    // Carica le partite di oggi
    async function loadTodayMatches() {
        try {
            const matches = await MatchPulseAPI.getTodayMatches();
            MatchPulseUI.renderTodayMatches(matches);
        } catch (error) {
            console.error('Error loading today matches:', error);
        }
    }
    
    // Carica i preferiti
    async function loadFavorites() {
        const favorites = JSON.parse(localStorage.getItem('matchpulse_favorites') || '[]');
        const favoritesList = document.getElementById('favoritesList');
        
        if (!favoritesList) return;
        
        if (favorites.length === 0) {
            favoritesList.innerHTML = '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">Nessun preferito. Segui una partita per aggiungerla qui.</p>';
            return;
        }
        
        // Per ogni preferito, carica i dettagli
        const favoritesHtml = [];
        for (const matchId of favorites) {
            try {
                const match = await MatchPulseAPI.getMatchDetails(matchId);
                favoritesHtml.push(`
                    <div class="favorite-item" data-match-id="${match.id}">
                        <span style="font-size: 24px;">${match.homeTeam.logo}</span>
                        <div style="flex: 1;">
                            <div style="font-weight: 600;">${match.homeTeam.name} vs ${match.awayTeam.name}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">${match.competition} • ${match.score.home}-${match.score.away}</div>
                        </div>
                        <span style="color: var(--accent-primary); font-weight: 700;">${match.minute}'</span>
                    </div>
                `);
            } catch (error) {
                console.error('Error loading favorite:', error);
            }
        }
        
        favoritesList.innerHTML = favoritesHtml.join('');
        
        // Aggiungi click handler
        favoritesList.querySelectorAll('.favorite-item').forEach(item => {
            item.addEventListener('click', () => {
                const matchId = item.getAttribute('data-match-id');
                MatchPulseUI.openMatchCenter(matchId);
            });
        });
    }
    
    // Avvia il refresh automatico dei dati
    function startAutoRefresh() {
        // Aggiorna ogni 30 secondi
        refreshInterval = setInterval(async () => {
            await loadLiveMatches();
            await loadFeaturedMatch();
        }, 30000);
    }
    
    // Setup degli event listeners
    function setupEventListeners() {
        // Pulsante indietro Match Center
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                MatchPulseUI.closeMatchCenter();
            });
        }
        
        // Pulsante preferiti header
        const favoritesBtn = document.getElementById('favoritesBtn');
        if (favoritesBtn) {
            favoritesBtn.addEventListener('click', () => {
                const favoritesSection = document.getElementById('favoritesSection');
                if (favoritesSection) {
                    favoritesSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
        
        // Pulsante pin featured
        const pinBtn = document.getElementById('pinFeaturedBtn');
        if (pinBtn) {
            pinBtn.addEventListener('click', toggleFeaturedPin);
        }
        
        // Pulsante follow nel match center
        const followBtn = document.getElementById('followBtn');
        if (followBtn) {
            followBtn.addEventListener('click', () => {
                if (currentMatchId) {
                    MatchPulseUI.toggleFollowMatch(currentMatchId);
                }
            });
        }
        
        // Chiudi search modal con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const searchModal = document.getElementById('searchModal');
                if (searchModal && searchModal.classList.contains('active')) {
                    searchModal.classList.remove('active');
                }
            }
        });
        
        // Simula eventi live per demo
        simulateLiveEvents();
    }
    
    // Toggle pin partita in evidenza
    function toggleFeaturedPin() {
        if (!featuredMatchId) return;
        
        const pinBtn = document.getElementById('pinFeaturedBtn');
        const isPinned = localStorage.getItem('matchpulse_featured') === featuredMatchId;
        
        if (isPinned) {
            localStorage.removeItem('matchpulse_featured');
            if (pinBtn) pinBtn.classList.remove('active');
        } else {
            localStorage.setItem('matchpulse_featured', featuredMatchId);
            if (pinBtn) pinBtn.classList.add('active');
        }
    }
    
    // Aggiorna stato pulsante pin
    function updatePinButton() {
        const pinBtn = document.getElementById('pinFeaturedBtn');
        if (!pinBtn) return;
        
        const isPinned = localStorage.getItem('matchpulse_featured') === featuredMatchId;
        
        if (isPinned) {
            pinBtn.classList.add('active');
        } else {
            pinBtn.classList.remove('active');
        }
    }
    
    // Simula eventi live per la demo
    function simulateLiveEvents() {
        // Dopo 3 secondi mostra un evento di esempio
        setTimeout(() => {
            MatchPulsePopup.showEvent({
                type: 'goal',
                player: 'Lautaro Martinez',
                team: 'Inter',
                minute: 67
            });
        }, 3000);
    }
    
    // Avvia l'app quando il DOM è pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    return {
        init: init,
        loadFeaturedMatch: loadFeaturedMatch,
        loadLiveMatches: loadLiveMatches,
        loadTodayMatches: loadTodayMatches
    };
})();
