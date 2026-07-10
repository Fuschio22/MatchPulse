/**
 * MatchPulse UI Module
 * Handles all user interface updates and DOM manipulation
 */

const MatchPulseUI = (() => {
    
    // Elementi DOM cached
    let elements = {};
    
    // Inizializza i riferimenti agli elementi DOM
    function initElements() {
        elements = {
            featuredCard: document.getElementById('featuredCard'),
            liveMatches: document.getElementById('liveMatches'),
            todayMatches: document.getElementById('todayMatches'),
            competitionsGrid: document.getElementById('competitionsGrid'),
            favoritesList: document.getElementById('favoritesList'),
            searchModal: document.getElementById('searchModal'),
            searchInput: document.getElementById('searchInput'),
            searchResults: document.getElementById('searchResults'),
            matchCenter: document.getElementById('matchCenter'),
            matchCenterContent: document.getElementById('matchCenterContent'),
            livePopup: document.getElementById('livePopup'),
            popupContent: document.getElementById('popupContent'),
            popupTitle: document.getElementById('popupTitle')
        };
    }
    
    // Renderizza la partita in evidenza
    function renderFeaturedMatch(match) {
        if (!match || !elements.featuredCard) return;
        
        const html = `
            <div class="featured-competition">
                <span>${match.competition}</span>
                <span>•</span>
                <span>${match.stadium}</span>
            </div>
            <div class="featured-teams">
                <div class="team home">
                    <div class="team-logo">${match.homeTeam.logo}</div>
                    <div class="team-name">${match.homeTeam.name}</div>
                </div>
                <div class="score-container">
                    <div class="score">${match.score.home} - ${match.score.away}</div>
                    <div class="match-status ${match.status === 'LIVE' ? 'live' : ''}">
                        ${match.status === 'LIVE' ? '<span class="live-dot"></span>' : ''}
                        <span class="match-minute">${match.status === 'LIVE' ? match.minute + "'" : match.time}</span>
                    </div>
                </div>
                <div class="team away">
                    <div class="team-logo">${match.awayTeam.logo}</div>
                    <div class="team-name">${match.awayTeam.name}</div>
                </div>
            </div>
            <div class="featured-info">
                <div class="last-event">
                    <strong>Ultimo evento:</strong> ${match.lastEvent}
                </div>
            </div>
            <button class="follow-btn" id="followFeaturedBtn">Segui Partita</button>
        `;
        
        elements.featuredCard.innerHTML = html;
        
        // Aggiungi event listener al pulsante Segui
        const followBtn = document.getElementById('followFeaturedBtn');
        if (followBtn) {
            followBtn.addEventListener('click', () => toggleFollowMatch(match.id));
        }
    }
    
    // Renderizza le partite live
    function renderLiveMatches(matches) {
        if (!elements.liveMatches) return;
        
        if (matches.length === 0) {
            elements.liveMatches.innerHTML = '<p style="color: var(--text-secondary); padding: 20px;">Nessuna partita live al momento</p>';
            return;
        }
        
        const html = matches.map(match => `
            <div class="match-card" data-match-id="${match.id}">
                <div class="match-card-header">
                    <span>${match.competition}</span>
                    <span class="live-indicator">
                        <span class="live-dot"></span>
                        ${match.minute}'
                    </span>
                </div>
                <div class="match-card-teams">
                    <div class="match-card-team home">
                        <div class="match-card-logo">${match.homeTeam.logo}</div>
                        <div class="match-card-team-name">${match.homeTeam.name}</div>
                    </div>
                    <div class="match-card-score live">${match.score.home} - ${match.score.away}</div>
                    <div class="match-card-team away">
                        <div class="match-card-logo">${match.awayTeam.logo}</div>
                        <div class="match-card-team-name">${match.awayTeam.name}</div>
                    </div>
                </div>
            </div>
        `).join('');
        
        elements.liveMatches.innerHTML = html;
        
        // Aggiungi click handler alle card
        document.querySelectorAll('.match-card').forEach(card => {
            card.addEventListener('click', () => {
                const matchId = card.getAttribute('data-match-id');
                openMatchCenter(matchId);
            });
        });
    }
    
    // Renderizza le partite di oggi
    function renderTodayMatches(matches) {
        if (!elements.todayMatches) return;
        
        if (matches.length === 0) {
            elements.todayMatches.innerHTML = '<p style="color: var(--text-secondary); padding: 20px;">Nessuna partita oggi</p>';
            return;
        }
        
        const html = matches.map(match => `
            <div class="match-card" data-match-id="${match.id}">
                <div class="match-card-header">
                    <span>${match.competition}</span>
                    <span>${match.stadium}</span>
                </div>
                <div class="match-card-teams">
                    <div class="match-card-team home">
                        <div class="match-card-logo">${match.homeTeam.logo}</div>
                        <div class="match-card-team-name">${match.homeTeam.name}</div>
                    </div>
                    <div class="match-card-score">${match.time}</div>
                    <div class="match-card-team away">
                        <div class="match-card-logo">${match.awayTeam.logo}</div>
                        <div class="match-card-team-name">${match.awayTeam.name}</div>
                    </div>
                </div>
            </div>
        `).join('');
        
        elements.todayMatches.innerHTML = html;
        
        // Aggiungi click handler alle card
        document.querySelectorAll('.match-card').forEach(card => {
            card.addEventListener('click', () => {
                const matchId = card.getAttribute('data-match-id');
                openMatchCenter(matchId);
            });
        });
    }
    
    // Renderizza le competizioni
    async function renderCompetitions() {
        if (!elements.competitionsGrid) return;
        
        try {
            const competitions = await MatchPulseAPI.getCompetitions();
            const html = competitions.map(comp => `
                <div class="competition-card">
                    <div class="competition-logo">${comp.logo}</div>
                    <div class="competition-name">${comp.name}</div>
                </div>
            `).join('');
            
            elements.competitionsGrid.innerHTML = html;
        } catch (error) {
            console.error('Error loading competitions:', error);
        }
    }
    
    // Apre il Match Center
    async function openMatchCenter(matchId) {
        try {
            const matchDetails = await MatchPulseAPI.getMatchDetails(matchId);
            const html = renderMatchCenterContent(matchDetails);
            
            if (elements.matchCenterContent) {
                elements.matchCenterContent.innerHTML = html;
            }
            
            if (elements.matchCenter) {
                elements.matchCenter.classList.add('active');
            }
            
            // Aggiungi event listener al pulsante indietro
            const backBtn = document.getElementById('backBtn');
            if (backBtn) {
                backBtn.addEventListener('click', closeMatchCenter);
            }
            
        } catch (error) {
            console.error('Error opening match center:', error);
        }
    }
    
    // Renderizza il contenuto del Match Center
    function renderMatchCenterContent(match) {
        return `
            <div class="match-center-score">
                <div class="match-center-teams">
                    <div class="match-center-team home">
                        <div class="match-center-logo">${match.homeTeam.logo}</div>
                        <div class="match-center-team-name">${match.homeTeam.name}</div>
                    </div>
                    <div>
                        <div class="match-center-score-display">${match.score.home} - ${match.score.away}</div>
                        <div class="match-center-timer">${match.minute}' • ${match.status}</div>
                    </div>
                    <div class="match-center-team away">
                        <div class="match-center-logo">${match.awayTeam.logo}</div>
                        <div class="match-center-team-name">${match.awayTeam.name}</div>
                    </div>
                </div>
            </div>
            
            <div class="match-center-tabs">
                <button class="tab-btn active" data-tab="timeline">Timeline</button>
                <button class="tab-btn" data-tab="stats">Statistiche</button>
                <button class="tab-btn" data-tab="lineups">Formazioni</button>
            </div>
            
            <div class="tab-content active" id="tab-timeline">
                <div class="timeline">
                    ${match.events.map(event => `
                        <div class="timeline-event">
                            <div class="timeline-minute">${event.minute}'</div>
                            <div class="timeline-icon">${getEventIcon(event.type)}</div>
                            <div class="timeline-details">
                                <div class="timeline-player">${event.player}</div>
                                <div class="timeline-info">${event.team === 'home' ? match.homeTeam.name : match.awayTeam.name}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="tab-content" id="tab-stats">
                <div class="stats-grid">
                    ${renderStat('Possesso Palla', match.stats.possession.home, match.stats.possession.away, '%')}
                    ${renderStat('Tiri', match.stats.shots.home, match.stats.shots.away, '')}
                    ${renderStat('Tiri in Porta', match.stats.shotsOnTarget.home, match.stats.shotsOnTarget.away, '')}
                    ${renderStat('Corner', match.stats.corners.home, match.stats.corners.away, '')}
                    ${renderStat('Falli', match.stats.fouls.home, match.stats.fouls.away, '')}
                </div>
            </div>
            
            <div class="tab-content" id="tab-lineups">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <h3 style="margin-bottom: 12px;">${match.homeTeam.name}</h3>
                        <p style="color: var(--text-secondary); margin-bottom: 12px;">${match.homeTeam.formation}</p>
                        <ul style="list-style: none;">
                            ${match.homeTeam.lineup.map(player => `<li style="padding: 8px 0; border-bottom: 1px solid var(--border);">${player}</li>`).join('')}
                        </ul>
                    </div>
                    <div>
                        <h3 style="margin-bottom: 12px;">${match.awayTeam.name}</h3>
                        <p style="color: var(--text-secondary); margin-bottom: 12px;">${match.awayTeam.formation}</p>
                        <ul style="list-style: none;">
                            ${match.awayTeam.lineup.map(player => `<li style="padding: 8px 0; border-bottom: 1px solid var(--border);">${player}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Renderizza una statistica
    function renderStat(label, homeValue, awayValue, suffix = '') {
        const total = homeValue + awayValue;
        const homePercent = total > 0 ? (homeValue / total) * 100 : 50;
        const awayPercent = total > 0 ? (awayValue / total) * 100 : 50;
        
        return `
            <div class="stat-item">
                <div class="stat-header">
                    <div class="stat-value home">${homeValue}${suffix}</div>
                    <div class="stat-label">${label}</div>
                    <div class="stat-value away">${awayValue}${suffix}</div>
                </div>
                <div class="stat-bar">
                    <div class="stat-bar-fill home" style="width: ${homePercent}%"></div>
                    <div class="stat-bar-fill away" style="width: ${awayPercent}%"></div>
                </div>
            </div>
        `;
    }
    
    // Ottieni icona per tipo di evento
    function getEventIcon(type) {
        const icons = {
            goal: '⚽',
            yellow: '🟨',
            red: '🟥',
            substitution: '🔄',
            var: ''
        };
        return icons[type] || '•';
    }
    
    // Chiude il Match Center
    function closeMatchCenter() {
        if (elements.matchCenter) {
            elements.matchCenter.classList.remove('active');
        }
    }
    
    // Toggle follow match
    function toggleFollowMatch(matchId) {
        const btn = document.getElementById('followFeaturedBtn');
        if (!btn) return;
        
        const isFollowing = btn.classList.contains('following');
        
        if (isFollowing) {
            btn.classList.remove('following');
            btn.textContent = 'Segui Partita';
            removeFromFavorites(matchId);
        } else {
            btn.classList.add('following');
            btn.textContent = 'Seguendo';
            addToFavorites(matchId);
        }
    }
    
    // Aggiungi ai preferiti
    function addToFavorites(matchId) {
        let favorites = JSON.parse(localStorage.getItem('matchpulse_favorites') || '[]');
        if (!favorites.includes(matchId)) {
            favorites.push(matchId);
            localStorage.setItem('matchpulse_favorites', JSON.stringify(favorites));
        }
    }
    
    // Rimuovi dai preferiti
    function removeFromFavorites(matchId) {
        let favorites = JSON.parse(localStorage.getItem('matchpulse_favorites') || '[]');
        favorites = favorites.filter(id => id !== matchId);
        localStorage.setItem('matchpulse_favorites', JSON.stringify(favorites));
    }
    
    // Inizializza la search modal
    function initSearch() {
        const searchBtn = document.getElementById('searchBtn');
        const closeSearch = document.getElementById('closeSearch');
        const searchModal = document.getElementById('searchModal');
        const searchInput = document.getElementById('searchInput');
        
        if (!searchBtn || !closeSearch || !searchModal || !searchInput) return;
        
        // Apri search
        searchBtn.addEventListener('click', () => {
            searchModal.classList.add('active');
            searchInput.focus();
        });
        
        // Chiudi search
        closeSearch.addEventListener('click', () => {
            searchModal.classList.remove('active');
            searchInput.value = '';
            if (elements.searchResults) {
                elements.searchResults.innerHTML = '';
            }
        });
        
        // Search input
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                if (elements.searchResults) {
                    elements.searchResults.innerHTML = '';
                }
                return;
            }
            
            searchTimeout = setTimeout(async () => {
                try {
                    const results = await MatchPulseAPI.searchTeams(query);
                    renderSearchResults(results);
                } catch (error) {
                    console.error('Search error:', error);
                }
            }, 300);
        });
    }
    
    // Renderizza risultati ricerca
    function renderSearchResults(results) {
        if (!elements.searchResults) return;
        
        if (results.length === 0) {
            elements.searchResults.innerHTML = '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">Nessun risultato trovato</p>';
            return;
        }
        
        const html = results.map(team => `
            <div class="search-result-item" data-team-id="${team.id}">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 24px;">${team.logo}</span>
                    <div>
                        <div style="font-weight: 600;">${team.name}</div>
                        <div style="font-size: 12px; color: var(--text-secondary);">${team.competition}</div>
                    </div>
                </div>
            </div>
        `).join('');
        
        elements.searchResults.innerHTML = html;
    }
    
    // Inizializza i tab del Match Center
    function initTabs() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                const tabId = e.target.getAttribute('data-tab');
                
                // Rimuovi active da tutti i tab
                document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                
                // Aggiungi active al tab selezionato
                e.target.classList.add('active');
                const targetContent = document.getElementById(`tab-${tabId}`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            }
        });
    }
    
    // Inizializzazione
    function init() {
        initElements();
        initSearch();
        initTabs();
    }
    
    return {
        init: init,
        renderFeaturedMatch: renderFeaturedMatch,
        renderLiveMatches: renderLiveMatches,
        renderTodayMatches: renderTodayMatches,
        renderCompetitions: renderCompetitions,
        openMatchCenter: openMatchCenter,
        closeMatchCenter: closeMatchCenter,
        toggleFollowMatch: toggleFollowMatch
    };
})();
