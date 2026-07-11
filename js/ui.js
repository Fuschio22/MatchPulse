/**
 * MatchPulse UI Module
 */

const MatchPulseUI = (() => {
    let elements = {};
    
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
    
    function renderFeaturedMatch(match) {
        if (!match || !elements.featuredCard) return;
        const html = `
            <div class="featured-competition"><span>${match.competition}</span><span>•</span><span>${match.stadium}</span></div>
            <div class="featured-teams">
                <div class="team home"><div class="team-logo">${match.homeTeam.logo}</div><div class="team-name">${match.homeTeam.name}</div></div>
                <div class="score-container">
                    <div class="score">${match.score.home} - ${match.score.away}</div>
                    <div class="match-status ${match.status === 'LIVE' ? 'live' : ''}">
                        ${match.status === 'LIVE' ? '<span class="live-dot"></span>' : ''}
                        <span class="match-minute">${match.status === 'LIVE' ? match.minute + "'" : match.time}</span>
                    </div>
                </div>
                <div class="team away"><div class="team-logo">${match.awayTeam.logo}</div><div class="team-name">${match.awayTeam.name}</div></div>
            </div>
            <div class="featured-info"><div class="last-event"><strong>Ultimo evento:</strong> ${match.lastEvent}</div></div>
            <button class="follow-btn" id="followFeaturedBtn">Segui Partita</button>
        `;
        elements.featuredCard.innerHTML = html;
        const followBtn = document.getElementById('followFeaturedBtn');
        if (followBtn) followBtn.addEventListener('click', () => toggleFollowMatch(match.id));
    }
    
    function renderLiveMatches(matches) {
        if (!elements.liveMatches) return;
        if (matches.length === 0) { elements.liveMatches.innerHTML = '<p style="color: var(--text-secondary); padding: 20px;">Nessuna partita live al momento</p>'; return; }
        const html = matches.map(match => `
            <div class="match-card" data-match-id="${match.id}">
                <div class="match-card-header"><span>${match.competition}</span><span class="live-indicator"><span class="live-dot"></span>${match.minute}'</span></div>
                <div class="match-card-teams">
                    <div class="match-card-team home"><div class="match-card-logo">${match.homeTeam.logo}</div><div class="match-card-team-name">${match.homeTeam.name}</div></div>
                    <div class="match-card-score live">${match.score.home} - ${match.score.away}</div>
                    <div class="match-card-team away"><div class="match-card-logo">${match.awayTeam.logo}</div><div class="match-card-team-name">${match.awayTeam.name}</div></div>
                </div>
            </div>
        `).join('');
        elements.liveMatches.innerHTML = html;
        document.querySelectorAll('.match-card').forEach(card => card.addEventListener('click', () => openMatchCenter(card.getAttribute('data-match-id'))));
    }
    
    function renderTodayMatches(matches) {
        if (!elements.todayMatches) return;
        if (matches.length === 0) { elements.todayMatches.innerHTML = '<p style="color: var(--text-secondary); padding: 20px;">Nessuna partita oggi</p>'; return; }
        const html = matches.map(match => `
            <div class="match-card" data-match-id="${match.id}">
                <div class="match-card-header"><span>${match.competition}</span><span>${match.stadium}</span></div>
                <div class="match-card-teams">
                    <div class="match-card-team home"><div class="match-card-logo">${match.homeTeam.logo}</div><div class="match-card-team-name">${match.homeTeam.name}</div></div>
                    <div class="match-card-score">${match.time}</div>
                    <div class="match-card-team away"><div class="match-card-logo">${match.awayTeam.logo}</div><div class="match-card-team-name">${match.awayTeam.name}</div></div>
                </div>
            </div>
        `).join('');
        elements.todayMatches.innerHTML = html;
        document.querySelectorAll('.match-card').forEach(card => card.addEventListener('click', () => openMatchCenter(card.getAttribute('data-match-id'))));
    }
    
    async function renderCompetitions() {
        if (!elements.competitionsGrid) return;
        try {
            const competitions = await MatchPulseAPI.getCompetitions();
            const html = competitions.map(comp => `
                <div class="competition-card" data-comp-code="${comp.id}" data-comp-name="${comp.name}">
                    <div class="competition-logo">${comp.logo}</div><div class="competition-name">${comp.name}</div>
                </div>
            `).join('');
            elements.competitionsGrid.innerHTML = html;
            document.querySelectorAll('.competition-card').forEach(card => {
                card.addEventListener('click', () => {
                    const code = card.getAttribute('data-comp-code');
                    const name = card.getAttribute('data-comp-name');
                    openCompetition(code, name);
                });
            });
        } catch (error) { console.error('Error loading competitions:', error); }
    }
    
    async function openMatchCenter(matchId) {
        try {
            const matchDetails = await MatchPulseAPI.getMatchDetails(matchId);
            if (!matchDetails) return;
            elements.matchCenterContent.innerHTML = renderMatchCenterContent(matchDetails);
            elements.matchCenter.classList.add('active');
            document.getElementById('backBtn').addEventListener('click', closeMatchCenter);
        } catch (error) { console.error('Error opening match center:', error); }
    }
    
    // MODIFICATA: Ora mostra i Tab "Partite" e "Classifica"
    async function openCompetition(competitionCode, competitionName) {
        try {
            const matches = await MatchPulseAPI.getCompetitionMatches(competitionCode, competitionName);
            
            elements.matchCenterContent.innerHTML = `
                <div class="match-center-tabs">
                    <button class="tab-btn active" id="btn-matches"> Partite</button>
                    <button class="tab-btn" id="btn-standings"> Classifica</button>
                </div>
                <div id="comp-content">${renderCompetitionContent(competitionName, matches)}</div>
            `;
            
            elements.matchCenter.classList.add('active');
            const title = document.querySelector('.match-center-header h2');
            if (title) title.textContent = competitionName;
            
            // Listener Tab Partite
            document.getElementById('btn-matches').addEventListener('click', () => {
                document.getElementById('btn-matches').classList.add('active');
                document.getElementById('btn-standings').classList.remove('active');
                document.getElementById('comp-content').innerHTML = renderCompetitionContent(competitionName, matches);
                document.querySelectorAll('.match-card').forEach(card => card.addEventListener('click', () => openMatchCenter(card.getAttribute('data-match-id'))));
            });
            
            // Listener Tab Classifica
            document.getElementById('btn-standings').addEventListener('click', async () => {
                document.getElementById('btn-standings').classList.add('active');
                document.getElementById('btn-matches').classList.remove('active');
                document.getElementById('comp-content').innerHTML = '<p style="text-align:center; padding:40px; color: var(--text-secondary);">Caricamento classifica...</p>';
                
                const standings = await MatchPulseAPI.getStandings(competitionName);
                document.getElementById('comp-content').innerHTML = renderStandingsContent(standings);
            });
            
        } catch (error) { console.error('Error opening competition:', error); }
    }
    
    function renderCompetitionContent(competitionName, matches) {
        if (matches.length === 0) {
            return `<div style="text-align: center; padding: 60px 20px;"><div style="font-size: 64px; margin-bottom: 16px;">📅</div><h3 style="margin-bottom: 8px;">Nessuna partita oggi</h3><p style="color: var(--text-secondary);">Non ci sono partite di ${competitionName} in programma per oggi.</p></div>`;
        }
        const liveMatches = matches.filter(m => ['LIVE', 'IN_PLAY', 'PAUSED'].includes(m.status));
        const scheduledMatches = matches.filter(m => ['SCHEDULED', 'TIMED'].includes(m.status));
        const finishedMatches = matches.filter(m => m.status === 'FINISHED');
        
        let html = '<div style="padding: 20px 0;">';
        if (liveMatches.length > 0) { html += '<h3 style="margin-bottom: 16px; color: var(--danger);">🔴 Live Ora</h3><div class="matches-grid" style="margin-bottom: 32px;">'; html += liveMatches.map(m => renderMatchCard(m, true)).join(''); html += '</div>'; }
        if (scheduledMatches.length > 0) { html += '<h3 style="margin-bottom: 16px;"> In Programma</h3><div class="matches-grid" style="margin-bottom: 32px;">'; html += scheduledMatches.map(m => renderMatchCard(m, false)).join(''); html += '</div>'; }
        if (finishedMatches.length > 0) { html += '<h3 style="margin-bottom: 16px; color: var(--text-secondary);">✅ Terminati</h3><div class="matches-grid">'; html += finishedMatches.map(m => renderMatchCard(m, false)).join(''); html += '</div>'; }
        html += '</div>';
        return html;
    }
    
    // NUOVA FUNZIONE: Renderizza la classifica
    function renderStandingsContent(standings) {
        if (!standings || standings.length === 0) {
            return '<p style="text-align:center; padding:40px; color: var(--text-secondary);">Classifica non disponibile per questa competizione.</p>';
        }
        
        let html = '<div style="padding: 20px 0; overflow-x: auto;">';
        html += '<table style="width: 100%; border-collapse: collapse; color: var(--text-primary); font-size: 14px;">';
        html += '<tr style="border-bottom: 2px solid var(--border); color: var(--text-secondary); font-size: 12px; text-transform: uppercase;">';
        html += '<th style="padding: 12px 8px; text-align: left; width: 30px;">#</th>';
        html += '<th style="padding: 12px 8px; text-align: left;">Squadra</th>';
        html += '<th style="padding: 12px 8px; text-align: center;">PG</th>';
        html += '<th style="padding: 12px 8px; text-align: center;">V</th>';
        html += '<th style="padding: 12px 8px; text-align: center;">P</th>';
        html += '<th style="padding: 12px 8px; text-align: center;">S</th>';
        html += '<th style="padding: 12px 8px; text-align: center;">PT</th>';
        html += '</tr>';
        
        standings.forEach((team, index) => {
            const position = index + 1;
            let rowColor = '';
            if (position <= 4) rowColor = 'border-left: 3px solid var(--success);'; // Champions
            else if (position <= 6) rowColor = 'border-left: 3px solid var(--warning);'; // Europa
            
            html += `<tr style="border-bottom: 1px solid var(--border); ${rowColor}">
                <td style="padding: 12px 8px; font-weight: bold; color: var(--text-secondary);">${position}</td>
                <td style="padding: 12px 8px; font-weight: 600;">${team.team.name}</td>
                <td style="padding: 12px 8px; text-align: center; color: var(--text-secondary);">${team.playedGames}</td>
                <td style="padding: 12px 8px; text-align: center;">${team.won}</td>
                <td style="padding: 12px 8px; text-align: center;">${team.draw}</td>
                <td style="padding: 12px 8px; text-align: center;">${team.lost}</td>
                <td style="padding: 12px 8px; text-align: center; font-weight: bold; font-size: 16px; color: var(--accent-primary);">${team.points}</td>
            </tr>`;
        });
        
        html += '</table>';
        html += '<div style="margin-top: 20px; font-size: 12px; color: var(--text-tertiary); display: flex; gap: 16px;">';
        html += '<span style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; background: var(--success); border-radius: 2px;"></span> Champions</span>';
        html += '<span style="display: flex; align-items: center; gap: 6px;"><span style="width: 10px; height: 10px; background: var(--warning); border-radius: 2px;"></span> Europa</span>';
        html += '</div></div>';
        
        return html;
    }
    
    function renderMatchCard(match, isLive) {
        const statusText = isLive ? match.minute + "'" : (match.time || '');
        return `
            <div class="match-card" data-match-id="${match.id}">
                <div class="match-card-header"><span>${match.competition}</span>${isLive ? '<span class="live-indicator"><span class="live-dot"></span>' + statusText + '</span>' : '<span>' + statusText + '</span>'}</div>
                <div class="match-card-teams">
                    <div class="match-card-team home"><div class="match-card-logo">${match.homeTeam.logo}</div><div class="match-card-team-name">${match.homeTeam.name}</div></div>
                    <div class="match-card-score ${isLive ? 'live' : ''}">${match.score.home} - ${match.score.away}</div>
                    <div class="match-card-team away"><div class="match-card-logo">${match.awayTeam.logo}</div><div class="match-card-team-name">${match.awayTeam.name}</div></div>
                </div>
            </div>
        `;
    }
    
    function renderMatchCenterContent(match) {
        return `
            <div class="match-center-score">
                <div class="match-center-teams">
                    <div class="match-center-team home"><div class="match-center-logo">${match.homeTeam.logo}</div><div class="match-center-team-name">${match.homeTeam.name}</div></div>
                    <div><div class="match-center-score-display">${match.score.home} - ${match.score.away}</div><div class="match-center-timer">${match.minute}' • ${match.status}</div></div>
                    <div class="match-center-team away"><div class="match-center-logo">${match.awayTeam.logo}</div><div class="match-center-team-name">${match.awayTeam.name}</div></div>
                </div>
            </div>
            <div class="match-center-tabs">
                <button class="tab-btn active" data-tab="timeline">Timeline</button>
                <button class="tab-btn" data-tab="stats">Statistiche</button>
            </div>
            <div class="tab-content active" id="tab-timeline">
                <div class="timeline">
                    ${match.events && match.events.length > 0 ? match.events.map(event => `
                        <div class="timeline-event">
                            <div class="timeline-minute">${event.minute}'</div>
                            <div class="timeline-icon">${getEventIcon(event.type)}</div>
                            <div class="timeline-details"><div class="timeline-player">${event.player}</div><div class="timeline-info">${event.team === 'HOME' ? match.homeTeam.name : match.awayTeam.name}</div></div>
                        </div>
                    `).join('') : '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Nessun evento registrato</p>'}
                </div>
            </div>
            <div class="tab-content" id="tab-stats">
                <div class="stats-grid">
                    ${renderStat('Possesso Palla', match.stats.possession.home, match.stats.possession.away, '%')}
                    ${renderStat('Tiri', match.stats.shots.home, match.stats.shots.away, '')}
                </div>
            </div>
        `;
    }
    
    function renderStat(label, homeValue, awayValue, suffix = '') {
        const total = homeValue + awayValue;
        const homePercent = total > 0 ? (homeValue / total) * 100 : 50;
        const awayPercent = total > 0 ? (awayValue / total) * 100 : 50;
        return `
            <div class="stat-item">
                <div class="stat-header"><div class="stat-value home">${homeValue}${suffix}</div><div class="stat-label">${label}</div><div class="stat-value away">${awayValue}${suffix}</div></div>
                <div class="stat-bar"><div class="stat-bar-fill home" style="width: ${homePercent}%"></div><div class="stat-bar-fill away" style="width: ${awayPercent}%"></div></div>
            </div>
        `;
    }
    
    function getEventIcon(type) {
        const icons = { 'goal': '\u26BD', 'yellow': '\u{1F7E8}', 'red': '\u{1F7E5}', 'substitution': '\u{1F504}' };
        return icons[type] || '\u2022';
    }
    
    function closeMatchCenter() { elements.matchCenter.classList.remove('active'); }
    
    function toggleFollowMatch(matchId) {
        const btn = document.getElementById('followFeaturedBtn');
        if (!btn) return;
        if (btn.classList.contains('following')) {
            btn.classList.remove('following'); btn.textContent = 'Segui Partita';
            let favs = JSON.parse(localStorage.getItem('matchpulse_favorites') || '[]');
            localStorage.setItem('matchpulse_favorites', JSON.stringify(favs.filter(id => id !== matchId)));
        } else {
            btn.classList.add('following'); btn.textContent = 'Seguendo';
            let favs = JSON.parse(localStorage.getItem('matchpulse_favorites') || '[]');
            if (!favs.includes(matchId)) { favs.push(matchId); localStorage.setItem('matchpulse_favorites', JSON.stringify(favs)); }
        }
    }
    
    function initSearch() {
        const searchBtn = document.getElementById('searchBtn');
        const closeSearch = document.getElementById('closeSearch');
        if (!searchBtn) return;
        searchBtn.addEventListener('click', () => { elements.searchModal.classList.add('active'); elements.searchInput.focus(); });
        closeSearch.addEventListener('click', () => { elements.searchModal.classList.remove('active'); elements.searchInput.value = ''; elements.searchResults.innerHTML = ''; });
        let timeout;
        elements.searchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            if (e.target.value.trim().length < 2) { elements.searchResults.innerHTML = ''; return; }
            timeout = setTimeout(async () => {
                const results = await MatchPulseAPI.searchTeams(e.target.value);
                elements.searchResults.innerHTML = results.map(t => `<div class="search-result-item"><div style="display: flex; align-items: center; gap: 12px;"><span style="font-size: 24px;">${t.logo}</span><div><div style="font-weight: 600;">${t.name}</div></div></div></div>`).join('');
            }, 300);
        });
    }
    
    function initTabs() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn') && !e.target.id.startsWith('btn-')) {
                const tabId = e.target.getAttribute('data-tab');
                document.querySelectorAll('.tab-btn').forEach(b => { if(!b.id.startsWith('btn-')) b.classList.remove('active'); });
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById('tab-' + tabId).classList.add('active');
            }
        });
    }
    
    function init() { initElements(); initSearch(); initTabs(); }
    
    return {
        init: init, renderFeaturedMatch: renderFeaturedMatch, renderLiveMatches: renderLiveMatches,
        renderTodayMatches: renderTodayMatches, renderCompetitions: renderCompetitions,
        openMatchCenter: openMatchCenter, openCompetition: openCompetition,
        closeMatchCenter: closeMatchCenter, toggleFollowMatch: toggleFollowMatch
    };
})();
