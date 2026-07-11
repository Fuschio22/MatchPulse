/**
 * MatchPulse API Module - REAL API Integration
 * Uses football-data.org API for live match data
 */

const MatchPulseAPI = (() => {
    const API_BASE_URL = 'https://api.football-data.org/v4';
    const API_KEY = 'cdd1a87ea50a411880249e70138e0233';
    
    const cache = new Map();
    const CACHE_DURATION = 30 * 1000;
    
    async function fetchData(endpoint, options = {}) {
        const cacheKey = endpoint + '_' + JSON.stringify(options);
        const cached = cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
        
        try {
            const response = await fetch(API_BASE_URL + endpoint, {
                headers: {
                    'X-Auth-Token': API_KEY
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error('API Error: ' + response.status);
            }
            
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
            console.error('Error fetching competitions:', error);
            return getMockCompetitions();
        }
    }
    
    async function getLiveMatches() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const data = await fetchData('/matches?dateFrom=' + today + '&dateTo=' + today + '&status=LIVE');
            
            return data.matches.map(match => ({
                id: match.id,
                homeTeam: {
                    name: match.homeTeam.name,
                    logo: getTeamLogo(match.homeTeam.shortName),
                    shortName: match.homeTeam.shortName
                },
                awayTeam: {
                    name: match.awayTeam.name,
                    logo: getTeamLogo(match.awayTeam.shortName),
                    shortName: match.awayTeam.shortName
                },
                score: {
                    home: match.score.fullTime.home || match.score.halfTime.home || 0,
                    away: match.score.fullTime.away || match.score.halfTime.away || 0
                },
                status: match.status,
                minute: match.minute || 0,
                competition: match.competition.name,
                stadium: match.venue || 'N/A',
                lastEvent: getLastEvent(match)
            }));
        } catch (error) {
            console.error('Error fetching live matches:', error);
            return getMockLiveMatches();
        }
    }
    
    async function getTodayMatches() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const data = await fetchData('/matches?dateFrom=' + today + '&dateTo=' + today + '&status=SCHEDULED');
            
            return data.matches.map(match => ({
                id: match.id,
                homeTeam: {
                    name: match.homeTeam.name,
                    logo: getTeamLogo(match.homeTeam.shortName),
                    shortName: match.homeTeam.shortName
                },
                awayTeam: {
                    name: match.awayTeam.name,
                    logo: getTeamLogo(match.awayTeam.shortName),
                    shortName: match.awayTeam.shortName
                },
                score: { home: 0, away: 0 },
                status: match.status,
                time: new Date(match.utcDate).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
                competition: match.competition.name,
                stadium: match.venue || 'N/A'
            }));
        } catch (error) {
            console.error('Error fetching today matches:', error);
            return getMockTodayMatches();
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
            
            if (match) {
                return formatMatchData(match);
            }
            
            return null;
        } catch (error) {
            console.error('Error finding specific match:', error);
            return null;
        }
    }
    
    async function getMatchDetails(matchId) {
        try {
            const data = await fetchData('/matches/' + matchId);
            return formatMatchData(data);
        } catch (error) {
            console.error('Error fetching match details:', error);
            return getMockMatchDetails(matchId);
        }
    }
    
    function formatMatchData(match) {
        return {
            id: match.id,
            homeTeam: {
                name: match.homeTeam.name,
                logo: getTeamLogo(match.homeTeam.shortName),
                shortName: match.homeTeam.shortName,
                formation: '4-3-3',
                lineup: [],
                subs: []
            },
            awayTeam: {
                name: match.awayTeam.name,
                logo: getTeamLogo(match.awayTeam.shortName),
                shortName: match.awayTeam.shortName,
                formation: '4-3-3',
                lineup: [],
                subs: []
            },
            score: {
                home: match.score.fullTime.home || match.score.halfTime.home || 0,
                away: match.score.fullTime.away || match.score.halfTime.away || 0
            },
            status: match.status,
            minute: match.minute || 0,
            competition: match.competition.name,
            stadium: match.venue || 'N/A',
            referee: match.referees && match.referees[0] ? match.referees[0].name : 'N/A',
            attendance: match.attendance || 0,
            events: match.goals || [],
            stats: {
                possession: { home: 50, away: 50 },
                shots: { home: 0, away: 0 },
                shotsOnTarget: { home: 0, away: 0 },
                corners: { home: 0, away: 0 },
                fouls: { home: 0, away: 0 },
                yellowCards: { home: 0, away: 0 },
                redCards: { home: 0, away: 0 }
            }
        };
    }
    
    async function searchTeams(query) {
        try {
            const data = await fetchData('/teams?name=' + encodeURIComponent(query));
            return data.teams.map(team => ({
                id: team.id,
                name: team.name,
                logo: getTeamLogo(team.shortName),
                competition: team.venue || 'N/A'
            }));
        } catch (error) {
            console.error('Error searching teams:', error);
            return [];
        }
    }
    
    function getLastEvent(match) {
        if (match.goals && match.goals.length > 0) {
            const lastGoal = match.goals[match.goals.length - 1];
            return 'Gol! ' + lastGoal.player + ' (' + lastGoal.minute + "')";
        }
        return 'Nessun evento recente';
    }
    
    function getTeamLogo(shortName) {
        const logos = {
            'NOR': '\u{1F1F3}\u{1F1F4}',
            'ENG': '\u{1F1EC}\u{1F1E7}',
            'ITA': '\u{1F1EE}\u{1F1F9}',
            'ESP': '\u{1F1EA}\u{1F1F8}',
            'GER': '\u{1F1E9}\u{1F1EA}',
            'FRA': '\u{1F1EB}\u{1F1F7}',
            'BRA': '\u{1F1E7}\u{1F1F7}',
            'ARG': '\u{1F1E6}\u{1F1F7}'
        };
        return logos[shortName] || '\u26BD';
    }
    
    function getCompetitionLogo(code) {
        const logos = {
            'WC': '\u{1F3C6}',
            'EC': '\u{1F3C6}',
            'PL': '\u{1F1EC}\u{1F1E7}',
            'SA': '\u{1F1EE}\u{1F1F9}',
            'PD': '\u{1F1EA}\u{1F1F8}',
            'BL1': '\u{1F1E9}\u{1F1EA}',
            'FL1': '\u{1F1EB}\u{1F1F7}',
            'CL': '\u{1F3C6}',
            'EL': '\u{1F948}'
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
    
    function getMockLiveMatches() {
        return [];
    }
    
    function getMockTodayMatches() {
        return [];
    }
    
    function getMockMatchDetails(matchId) {
        return null;
    }
    
    return {
        getCompetitions: getCompetitions,
        getLiveMatches: getLiveMatches,
        getTodayMatches: getTodayMatches,
        getMatchDetails: getMatchDetails,
        searchTeams: searchTeams,
        findSpecificMatch: findSpecificMatch
    };
})();
