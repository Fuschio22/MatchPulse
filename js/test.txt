/**
 * MatchPulse API Module
 * Handles all data fetching and management
 * Separated from UI for better maintainability
 */

const MatchPulseAPI = (() => {
    const API_BASE_URL = 'https://api.football-data.org/v4';
    const API_KEY = '';
    
    const cache = new Map();
    const CACHE_DURATION = 5 * 60 * 1000;
    
    async function fetchData(endpoint, options = {}) {
        const cacheKey = endpoint + '_' + JSON.stringify(options);
        const cached = cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
        
        try {
            const response = await fetch(API_BASE_URL + endpoint, {
                headers: {
                    'X-Auth-Token': API_KEY,
                    'Content-Type': 'application/json'
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
        return [
            { id: 'SA', name: 'Serie A', country: 'Italy', logo: '🇮🇹' },
            { id: 'PL', name: 'Premier League', country: 'England', logo: '🇬🇧' },
            { id: 'CL', name: 'Champions League', country: 'Europe', logo: '🏆' },
            { id: 'EL', name: 'Europa League', country: 'Europe', logo: '🥈' },
            { id: 'WC', name: 'Mondiale', country: 'World', logo: '🌍' },
            { id: 'CI', name: 'Coppa Italia', country: 'Italy', logo: '🏆' }
        ];
    }
    
    async function getLiveMatches() {
        return [
            {
                id: 'match-1',
                homeTeam: { name: 'Inter', logo: '⚫', shortName: 'INT' },
                awayTeam: { name: 'Milan', logo: '🔴', shortName: 'MIL' },
                score: { home: 2, away: 1 },
                status: 'LIVE',
                minute: 67,
                competition: 'Serie A',
                stadium: 'San Siro',
                lastEvent: 'Gol! Lautaro Martinez (67)'
            },
            {
                id: 'match-2',
                homeTeam: { name: 'Juventus', logo: '⚪', shortName: 'JUV' },
                awayTeam: { name: 'Roma', logo: '🟡', shortName: 'ROM' },
                score: { home: 1, away: 1 },
                status: 'LIVE',
                minute: 45,
                competition: 'Serie A',
                stadium: 'Allianz Stadium',
                lastEvent: 'Cartellino giallo (43)'
            }
        ];
    }
    
    async function getTodayMatches() {
        return [
            {
                id: 'match-3',
                homeTeam: { name: 'Napoli', logo: '🔵', shortName: 'NAP' },
                awayTeam: { name: 'Lazio', logo: '🦅', shortName: 'LAZ' },
                score: { home: 0, away: 0 },
                status: 'SCHEDULED',
                time: '20:45',
                competition: 'Serie A',
                stadium: 'Diego Armando Maradona'
            },
            {
                id: 'match-4',
                homeTeam: { name: 'Atalanta', logo: '⚡', shortName: 'ATA' },
                awayTeam: { name: 'Fiorentina', logo: '🟣', shortName: 'FIO' },
                score: { home: 0, away: 0 },
                status: 'SCHEDULED',
                time: '18:30',
                competition: 'Serie A',
                stadium: 'Gewiss Stadium'
            }
        ];
    }
    
    async function getFeaturedMatch() {
        const liveMatches = await getLiveMatches();
        return liveMatches[0] || null;
    }
    
    async function getMatchDetails(matchId) {
        return {
            id: matchId,
            homeTeam: { 
                name: 'Inter', 
                logo: '⚫', 
                shortName: 'INT',
                formation: '3-5-2',
                lineup: ['Handanovic', 'Bastoni', 'De Vrij', 'Scriniar', 'Dimarco', 'Barella', 'Calhanoglu', 'Mkhitaryan', 'Darmian', 'Lautaro', 'Dzeko'],
                subs: ['Onana', 'Bellanova', 'Correa']
            },
            awayTeam: { 
                name: 'Milan', 
                logo: '🔴', 
                shortName: 'MIL',
                formation: '4-3-3',
                lineup: ['Maignan', 'Calabria', 'Tomori', 'Kjaer', 'Theo', 'Tonali', 'Bennacer', 'Diaz', 'Saelemaekers', 'Giroud', 'Leao'],
                subs: ['Tatarusanu', 'Kalulu', 'Origi']
            },
            score: { home: 2, away: 1 },
            status: 'LIVE',
            minute: 67,
            competition: 'Serie A',
            stadium: 'San Siro',
            referee: 'Daniele Orsato',
            attendance: 75000,
            events: [
                { minute: 15, type: 'goal', player: 'Lautaro Martinez', team: 'home', assist: 'Barella' },
                { minute: 32, type: 'goal', player: 'Leao', team: 'away', assist: 'Theo' },
                { minute: 45, type: 'yellow', player: 'Tonali', team: 'away' },
                { minute: 58, type: 'substitution', playerIn: 'Correa', playerOut: 'Dzeko', team: 'home' },
                { minute: 67, type: 'goal', player: 'Barella', team: 'home', assist: 'Lautaro Martinez' }
            ],
            stats: {
                possession: { home: 58, away: 42 },
                shots: { home: 12, away: 8 },
                shotsOnTarget: { home: 6, away: 3 },
                corners: { home: 5, away: 2 },
                fouls: { home: 8, away: 11 },
                yellowCards: { home: 1, away: 2 },
                redCards: { home: 0, away: 0 }
            }
        };
    }
    
    async function searchTeams(query) {
        const allTeams = [
            { id: 'inter', name: 'Inter', logo: '⚫', competition: 'Serie A' },
            { id: 'milan', name: 'Milan', logo: '🔴', competition: 'Serie A' },
            { id: 'juventus', name: 'Juventus', logo: '⚪', competition: 'Serie A' },
            { id: 'roma', name: 'Roma', logo: '🟡', competition: 'Serie A' },
            { id: 'napoli', name: 'Napoli', logo: '🔵', competition: 'Serie A' },
            { id: 'lazio', name: 'Lazio', logo: '🦅', competition: 'Serie A' },
            { id: 'atalanta', name: 'Atalanta', logo: '⚡', competition: 'Serie A' },
            { id: 'fiorentina', name: 'Fiorentina', logo: '🟣', competition: 'Serie A' }
        ];
        
        const lowerQuery = query.toLowerCase();
        return allTeams.filter(function(team) {
            return team.name.toLowerCase().indexOf(lowerQuery) !== -1;
        });
    }
    
    return {
        getCompetitions: getCompetitions,
        getLiveMatches: getLiveMatches,
        getTodayMatches: getTodayMatches,
        getFeaturedMatch: getFeaturedMatch,
        getMatchDetails: getMatchDetails,
        searchTeams: searchTeams
    };
})();
