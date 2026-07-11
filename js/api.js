/**
 * MatchPulse API Module - REAL API Integration
 */

const MatchPulseAPI = (() => {
    const API_BASE_URL = 'https://api.football-data.org/v4';
    const API_KEY = 'cdd1a87ea50a411880249e70138e0233';
    
    const cache = new Map();
    const CACHE_DURATION = 60 * 1000;
    
    async function fetchData(endpoint, options = {}) {
        const cacheKey = endpoint + '_' + JSON.stringify(options);
        const cached = cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
        
        try {
            const response = await fetch(API_BASE_URL + endpoint, {
                headers: { 'X-Auth-Token': API_KEY },
                ...options
            });
            
            if (!response.ok) throw new Error('API Error: ' + response.status);
            
            const data = await response.json();
            cache.set(cacheKey, { data: data, timestamp: Date.now() });
            return data;
        } catch (error) {
            console.error('API fetch error:', error);
            throw error;
        }
    }
    
    async function getCompetitions() {
        try {
            const data = await fetchData('/competitions');
            return data.competitions.map(comp => ({
                id: comp.id,
                name: comp.name,
                country: comp.area.name,
                logo: getCompetitionLogo(comp.code)
            }));
        } catch (error) {
            return getMockCompetitions();
        }
    }
    
    async function getStandings(competitionName) {
        try {
            const codeMap = {
                'Serie A': 'SA',
                'Premier League': 'PL',
                'Champions League': 'CL',
                'Europa League': 'EL',
                'Bundesliga': 'BL1',
                'Ligue 1': 'FL1',
                'Primera Division': 'PD',
                'Eredivisie': 'DED',
                'Primeira Liga': 'PPL',
                'Championship': 'ELC'
            };
            
            let officialCode = codeMap[competitionName] || competitionName;
            
            const data = await fetchData('/competitions/' + officialCode + '/standings');
            return data.standings[0].table;
        } catch (error) {
            console.error('Error fetching standings for ' + competitionName + ':', error);
            return [];
        }
    }
    
    async function getCompetitionMatches(competitionCode, competitionName) {
        try {
            const today = new Date().toISOString().split('T')[0];
            console.log('DATA OGGI:', today);
            console.log('COMPETIZIONE:', competitionName);
            
            const data = await fetchData('/matches?dateFrom=' + today + '&dateTo=' + today);
            
            console.log('TOTALE PARTITE RICEVUTE:', data.matches ? data.matches.length : 0);
            
            if (data.matches && data.matches.length > 0) {
                console.log('PRIME 3 PARTITE:');
                data.matches.slice(0, 3).forEach(m => {
                    console.log('  - ' + m.homeTeam.name + ' vs ' + m.awayTeam.name + ' (' + m.competition.name + ')');
                });
            }
            
            if (competitionName && competitionName.toLowerCase().includes('mondiale')) {
                console.log('MOSTRO TUTTE LE PARTITE PER MONDIALE');
                
                if (!data.matches || data.matches.length === 0) {
                    console.warn('NESSUNA PARTITA OGGI DALL API');
                }
                
                return data.matches.map(match => ({
                    id: match.id,
                    homeTeam: { name: match.homeTeam.name, logo: getTeamLogo(match.homeTeam.shortName), shortName: match.homeTeam.shortName },
                    awayTeam: { name: match.awayTeam.name, logo: getTeamLogo(match.awayTeam.shortName), shortName: match.awayTeam.shortName },
                    score: { home: match.score.fullTime.home || match.score.halfTime.home || 0, away: match.score.fullTime.away || match.score.halfTime.away || 0 },
                    status: match.status,
                    minute: match.minute || 0,
                    time: new Date(match.utcDate).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
                    competition: match.competition.name,
                    stadium: match.venue || 'N/A',
                    lastEvent: getLastEvent(match)
                }));
            }
            
            const filteredMatches = data.matches.filter(match => {
                if (match.competition.id == competitionCode) return true;
                const apiName = match.competition.name.toLowerCase();
                const searchName = (competitionName || '').toLowerCase();
                
                if (searchName.includes('mondiale') && apiName.includes('world cup')) return true;
                if (apiName.includes(searchName.replace('mondiale', 'world cup'))) return true;
                return false;
            });

            return filteredMatches.map(match => ({
                id: match.id,
                homeTeam: { name: match.homeTeam.name, logo: getTeamLogo(match.homeTeam.shortName), shortName: match.homeTeam.shortName },
                awayTeam: { name: match.awayTeam.name, logo: getTeamLogo(match.awayTeam.shortName), shortName: match.awayTeam.shortName },
                score: { home: match.score.fullTime.home || match.score.halfTime.home || 0, away: match.score.fullTime.away || match.score.halfTime.away || 0 },
                status: match.status,
                minute: match.minute || 0,
                time: new Date(match.utcDate).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
                competition: match.competition.name,
                stadium: match.venue || 'N/A',
                lastEvent: getLastEvent(match)
            }));
        } catch (error) {
            console.error('ERRORE:', error);
            return [];
        }
    }
    
    async function getLiveMatches() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const data = await fetchData('/matches?dateFrom=' + today + '&dateTo=' + today + '&status=LIVE,IN_PLAY,PAUSED');
            
            return data.matches.map(match => ({
                id: match.id,
                homeTeam: { name: match.homeTeam.name, logo: getTeamLogo(match.homeTeam.shortName), shortName: match.homeTeam.shortName },
                awayTeam: { name: match.awayTeam.name, logo: getTeamLogo(match.awayTeam.shortName), shortName: match.awayTeam.shortName },
                score: { home: match.score.fullTime.home || match.score.halfTime.home || 0, away: match.score.fullTime.away || match.score.halfTime.away || 0 },
                status: match.status,
                minute: match.minute || 0,
                competition: match.competition.name,
                stadium: match.venue || 'N/A',
                lastEvent: getLastEvent(match)
            }));
        } catch (error) {
            return [];
        }
    }
    
    async function getTodayMatches() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const data = await fetchData('/matches?dateFrom=' + today + '&dateTo=' + today + '&status=SCHEDULED,TIMED');
            
            return data.matches.map(match => ({
                id: match.id,
                homeTeam: { name: match.homeTeam.name, logo: getTeamLogo(match.homeTeam.shortName), shortName: match.homeTeam.shortName },
                awayTeam: { name: match.awayTeam.name, logo: getTeamLogo(match.awayTeam.shortName), shortName: match.awayTeam.shortName },
                score: { home: 0, away: 0 },
                status: match.status,
                time: new Date(match.utcDate).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
                competition: match.competition.name,
                stadium: match.venue || 'N/A'
            }));
        } catch (error) {
            return [];
        }
    }
    
    async function findSpecificMatch(homeTeam, awayTeam) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const data = await fetchData('/matches?dateFrom=' + today + '&dateTo=' + today);
            const match = data.matches.find(m => 
                m.homeTeam.name.toLowerCase().includes(homeTeam.toLowerCase()) &&
                m.awayTeam.name.toLowerCase().includes(awayTeam.toLowerCase())
            );
            return match ? formatMatchData(match) : null;
        } catch (error) {
            return null;
        }
    }
    
    async function getMatchDetails(matchId) {
        try {
            const data = await fetchData('/matches/' + matchId);
            return formatMatchData(data);
        } catch (error) {
            return null;
        }
    }
    
    function formatMatchData(match) {
        return {
            id: match.id,
            homeTeam: { name: match.homeTeam.name, logo: getTeamLogo(match.homeTeam.shortName), shortName: match.homeTeam.shortName, formation: '4-3-3', lineup: [], subs: [] },
            awayTeam: { name: match.awayTeam.name, logo: getTeamLogo(match.awayTeam.shortName), shortName: match.awayTeam.shortName, formation: '4-3-3', lineup: [], subs: [] },
            score: { home: match.score.fullTime.home || match.score.halfTime.home || 0, away: match.score.fullTime.away || match.score.halfTime.away || 0 },
            status: match.status,
            minute: match.minute || 0,
            competition: match.competition.name,
            stadium: match.venue || 'N/A',
            referee: match.referees && match.referees[0] ? match.referees[0].name : 'N/A',
            attendance: match.attendance || 0,
            events: match.goals || [],
            stats: { possession: { home: 50, away: 50 }, shots: { home: 0, away: 0 }, shotsOnTarget: { home: 0, away: 0 }, corners: { home: 0, away: 0 }, fouls: { home: 0, away: 0 }, yellowCards: { home: 0, away: 0 }, redCards: { home: 0, away: 0 } }
        };
    }
    
    async function searchTeams(query) {
        try {
            const data = await fetchData('/teams?name=' + encodeURIComponent(query));
            return data.teams.map(team => ({ id: team.id, name: team.name, logo: getTeamLogo(team.shortName), competition: team.venue || 'N/A' }));
        } catch (error) {
            return [];
        }
    }
    
    function getLastEvent(match) {
        if (match.goals && match.goals.length > 0) {
            const lastGoal = match.goals[match.goals.length - 1];
            return 'Gol! ' + lastGoal.player + ' (' + lastGoal.minute + ")";
        }
        return 'Nessun evento recente';
    }
    
    function getTeamLogo(shortName) {
        const logos = {
            'NOR': '\u{1F1F3}\u{1F1F4}', 'ENG': '\u{1F1EC}\u{1F1E7}', 'ITA': '\u{1F1EE}\u{1F1F9}',
            'ESP': '\u{1F1EA}\u{1F1F8}', 'GER': '\u{1F1E9}\u{1F1EA}', 'FRA': '\u{1F1EB}\u{1F1F7}',
            'BRA': '\u{1F1E7}\u{1F1F7}', 'ARG': '\u{1F1E6}\u{1F1F7}'
        };
        return logos[shortName] || '\u26BD';
    }
    
    function getCompetitionLogo(code) {
        const logos = {
            'WC': '\u{1F3C6}', 'EC': '\u{1F3C6}', 'PL': '\u{1F1EC}\u{1F1E7}',
            'SA': '\u{1F1EE}\u{1F1F9}', 'PD': '\u{1F1EA}\u{1F1F8}', 'BL1': '\u{1F1E9}\u{1F1EA}',
            'FL1': '\u{1F1EB}\u{1F1F7}', 'CL': '\u{1F3C6}', 'EL': '\u{1F948}'
        };
        return logos[code] || '\u{1F3C6}';
    }
    
    function getMockCompetitions() {
        return [
            { id: 'SA', name: 'Serie A', country: 'Italy', logo: '\u{1F1EE}\u{1F1F9}' },
            { id: 'PL', name: 'Premier League', country: 'England', logo: '\u{1F1EC}\u{1F1E7}' },
            { id: 'CL', name: 'Champions League', country: 'Europe', logo: '\u{1F3C6}' },
            { id: 'EL', name: 'Europa League', country: 'Europe', logo: '\u{1F948}' },
            { id: 'WC', name: 'Mondiale', country: 'World', logo: '\u{1F30D}' },
            { id: 'CI', name: 'Coppa Italia', country: 'Italy', logo: '\u{1F3C6}' }
        ];
    }
    
    return {
        getCompetitions: getCompetitions,
        getLiveMatches: getLiveMatches,
        getTodayMatches: getTodayMatches,
        getMatchDetails: getMatchDetails,
        searchTeams: searchTeams,
        findSpecificMatch: findSpecificMatch,
        getCompetitionMatches: getCompetitionMatches,
        getStandings: getStandings
    };
})();
