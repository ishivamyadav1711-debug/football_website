require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.API_FOOTBALL_KEY || process.env.RAPIDAPI_KEY;
const API_HOST = process.env.API_FOOTBALL_HOST || 'v3.football.api-sports.io';

const apiClient = axios.create({
  baseURL: `https://${API_HOST}`,
  headers: {
    'x-rapidapi-key': API_KEY,
    'x-rapidapi-host': API_HOST,
  },
});

async function testSearch() {
  try {
    const term = 'Messi';
    console.log('Testing Players search for:', term);
    const pRes = await apiClient.get('/players/profiles', { params: { search: term } });
    console.log('Players /players/profiles:', pRes.data.response?.length, pRes.data.errors);
    
    const pRes2 = await apiClient.get('/players', { params: { search: term } });
    console.log('Players /players:', pRes2.data.response?.length, pRes2.data.errors);

    const termTeam = 'Liverpool';
    console.log('\nTesting Teams search for:', termTeam);
    const tRes = await apiClient.get('/teams', { params: { search: termTeam } });
    console.log('Teams:', tRes.data.response?.length, tRes.data.errors);

    const termLeague = 'Premier';
    console.log('\nTesting Leagues search for:', termLeague);
    const lRes = await apiClient.get('/leagues', { params: { search: termLeague } });
    console.log('Leagues:', lRes.data.response?.length, lRes.data.errors);
  } catch (e) {
    console.error(e.message);
  }
}

testSearch();
