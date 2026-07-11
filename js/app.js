/**
 * MatchPulse Main App Module
 */

const MatchPulseApp = (() => {
    
    let currentMatchId = null;
    let featuredMatchId = null;
    let refreshInterval = null;
    let lastKnownScore = { home: 0, away: 0 };
    let lastKnownMinute = 0;
    let lastKnownEvents = [];
    
    const TARGET_MATCH = {
        home: 'Norway',
        away: 'England'
    };
    
    async function init() {
        console.log('MatchPulse initializing...');
        
        MatchPulseUI.init();
        MatchPulsePopup.init();
        
        await loadInitialData();
        
        startAutoRefresh();
        
        setupEventListeners();
        
        console.log('MatchPulse ready!');
    }
    
    async function loadInitialData() {
        try {
            await loadFeaturedMatch();
            await loadLiveMatches();
            await loadTodayMatches();
            await MatchPulseUI.renderCompetitions();
            await loadFavorites();
            
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }
    
    async function loadFeaturedMatch() {
        try {
            const specificMatch = await MatchPulseAPI.findSpecificMatch(TARGET_MATCH.home, TARGET_MATCH.away);
            
            if (specificMatch) {
                featuredMatchId = specificMatch.id;
                currentMatchId = specificMatch.id;
                lastKnownScore = { ...specificMatch.score };
                lastKnownMinute = specificMatch.minute || 0;
                MatchPulseUI.renderFeaturedMatch(specificMatch);
                updatePinButton();
                return;
            }
            
            const savedFeaturedId = localStorage.getItem('matchpulse_featured');
            
            let match;
            if (savedFeaturedId) {
                featuredMatchId = savedFeaturedId;
                match = await MatchPulseAPI.getMatchDetails(savedFeaturedId);
            } else {
                const liveMatches = await MatchPulseAPI.getLiveMatches();
                if (liveMatches.length > 0) {
                    match = liveMatches[0];
                    featuredMatchId = match.id;
                }
            }
            
            if (match) {
                MatchPulseUI.renderFeaturedMatch(match);
                updatePinButton();
            } else {
                const featuredCard = document.getElementById('featuredCard');
                if (featuredCard) {
                    featuredCard.innerHTML = `
                        <div style="text-align: center; padding: 40px 20px;">
                            <div style="font-size: 48px; margin-bottom: 16px;">⚽</div>
                            <h3 style="margin-bottom: 8px;">Nessuna partita in evidenza</h3>
                            <p style="color: var(--text-secondary);">
                                La partita Norvegia vs Inghilterra sarà mostrata qui quando inizierà.
                            </p>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Error loading featured match:', error);
        }
    }
    
    async function loadLiveMatches() {
        try {
            const matches = await MatchPulseAPI.getLiveMatches();
            MatchPulseUI.renderLiveMatches(matches);
        } catch (error) {
            console.error('Error loading live matches:', error);
        }
    }
    
    async function loadTodayMatches() {
        try {
            const matches = await MatchPulseAPI.getTodayMatches();
            MatchPulseUI.renderTodayMatches(matches);
        } catch (error) {
            console.error('Error loading today matches:', error);
        }
    }
    
    async function loadFavorites() {
        const favorites = JSON.parse(localStorage.getItem('matchpulse_favorites') || '[]');
        const favoritesList = document.getElementById('favoritesList');
        
        if (!favoritesList) return;
        
        if (favorites.length === 0) {
            favoritesList.innerHTML = '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">Nessun preferito. Segui una partita per aggiungerla qui.</p>';
            return;
        }
        
        const favoritesHtml = [];
        for (const matchId of favorites) {
            try {
                const match = await MatchPulseAPI.getMatchDetails(matchId);
                if (match) {
                    favoritesHtml.push(`
                        <div class="favorite-item" data-match-id="${match.id}">
                            <span style="font-size: 24px;">${match.homeTeam.logo}</span>
                            <div style="flex: 1;">
                                <div style="font-weight: 600;">${match.homeTeam.name} vs ${match.awayTeam.name}</div>
                                <div style="font-size: 12px; color: var(--text-secondary);">${match.competition} • ${match.score.home}-${match.score.away}</div>
                            </div>
                            <span style="color: var(--accent-primary); font-weight: 700;">${match.status === 'LIVE' ? match.minute + "'" : match.time || ''}</span>
                        </div>
                    `);
                }
            } catch (error) {
                console.error('Error loading favorite:', error);
            }
        }
        
        favoritesList.innerHTML = favoritesHtml.join('');
        
        favoritesList.querySelectorAll('.favorite-item').forEach(item => {
            item.addEventListener('click', () => {
                const matchId = item.getAttribute('data-match-id');
                MatchPulseUI.openMatchCenter(matchId);
            });
        });
    }
    
    function startAutoRefresh() {
        refreshInterval = setInterval(async () => {
            await refreshFeaturedMatch();
            await loadLiveMatches();
        }, 30000);
    }
    
    async function refreshFeaturedMatch() {
        if (!featuredMatchId) return;
        
        try {
            const match = await MatchPulseAPI.getMatchDetails(featuredMatchId);
            
            if (!match) return;
            
            MatchPulseUI.renderFeaturedMatch(match);
            
            checkForNewEvents(match);
            
            lastKnownScore = { ...match.score };
            lastKnownMinute = match.minute || 0;
            if (match.events) {
                lastKnownEvents = [...match.events];
            }
            
        } catch (error) {
            console.error('Error refreshing featured match:', error);
        }
    }
    
    function checkForNewEvents(match) {
        if (match.score.home > lastKnownScore.home) {
            MatchPulsePopup.showEvent({
                type: 'goal',
                player: match.homeTeam.name + ' ha segnato!',
                team: match.homeTeam.name,
                minute: match.minute || lastKnownMinute
            });
            
            const featuredCard = document.querySelector('.featured-card');
            if (featuredCard) {
                featuredCard.classList.add('goal-scored');
                setTimeout(() => {
                    featuredCard.classList.remove('goal-scored');
                }, 1000);
            }
        }
        
        if (match.score.away > lastKnownScore.away) {
            MatchPulsePopup.showEvent({
                type: 'goal',
                player: match.awayTeam.name + ' ha segnato!',
                team: match.awayTeam.name,
                minute: match.minute || lastKnownMinute
            });
            
            const featuredCard = document.querySelector('.featured-card');
            if (featuredCard) {
                featuredCard.classList.add('goal-scored');
                setTimeout(() => {
                    featuredCard.classList.remove('goal-scored');
                }, 1000);
            }
        }
        
        if (match.events && match.events.length > lastKnownEvents.length) {
            const newEvents = match.events.slice(lastKnownEvents.length);
            
            newEvents.forEach(event => {
                let eventType = 'goal';
                
                if (event.type === 'goal') {
                    eventType = 'goal';
                } else if (event.type === 'yellow' || event.type === 'yellowCard') {
                    eventType = 'yellow';
                } else if (event.type === 'red' || event.type === 'redCard') {
                    eventType = 'red';
                } else if (event.type === 'substitution') {
                    eventType = 'substitution';
                }
                
                if (eventType !== 'goal' || !event.score) {
                    MatchPulsePopup.showEvent({
                        type: eventType,
                        player: event.player || event.name || 'Evento',
                        team: event.team === 'HOME' ? match.homeTeam.name : match.awayTeam.name,
                        minute: event.minute || match.minute
                    });
                }
            });
        }
        
        if (match.status === 'FINISHED' && lastKnownMinute < 90) {
            MatchPulsePopup.showEvent({
                type: 'fulltime',
                player: 'Fine Partita',
                team: match.competition,
                minute: 90
            });
        }
        
        if (match.status === 'PAUSED' || match.status === 'HALFTIME') {
            if (lastKnownMinute < 45) {
                MatchPulsePopup.showEvent({
                    type: 'halftime',
                    player: 'Intervallo',
                    team: match.competition,
                    minute: 45
                });
            }
        }
    }
    
    function setupEventListeners() {
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                MatchPulseUI.closeMatchCenter();
                const title = document.querySelector('.match-center-header h2');
                if (title) title.textContent = 'Match Center';
            });
        }
        
        const favoritesBtn = document.getElementById('favoritesBtn');
        if (favoritesBtn) {
            favoritesBtn.addEventListener('click', () => {
                const favoritesSection = document.getElementById('favoritesSection');
                if (favoritesSection) {
                    favoritesSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
        
        const pinBtn = document.getElementById('pinFeaturedBtn');
        if (pinBtn) {
            pinBtn.addEventListener('click', toggleFeaturedPin);
        }
        
        const followBtn = document.getElementById('followBtn');
        if (followBtn) {
            followBtn.addEventListener('click', () => {
                if (currentMatchId) {
                    MatchPulseUI.toggleFollowMatch(currentMatchId);
                }
            });
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const searchModal = document.getElementById('searchModal');
                if (searchModal && searchModal.classList.contains('active')) {
                    searchModal.classList.remove('active');
                }
                
                const matchCenter = document.getElementById('matchCenter');
                if (matchCenter && matchCenter.classList.contains('active')) {
                    MatchPulseUI.closeMatchCenter();
                }
            }
        });
        
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('Page visible, refreshing data...');
                loadInitialData();
            }
        });
    }
    
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
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    return {
        init: init,
        loadFeaturedMatch: loadFeaturedMatch,
        loadLiveMatches: loadLiveMatches,
        loadTodayMatches: loadTodayMatches,
        refreshFeaturedMatch: refreshFeaturedMatch
    };
})();
