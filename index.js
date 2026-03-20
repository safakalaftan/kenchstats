const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3000;

const BOLGE_MAP = {
  tr: { sunucu: 'tr1', routing: 'europe' },
  euw: { sunucu: 'euw1', routing: 'europe' },
  na: { sunucu: 'na1', routing: 'americas' },
  kr: { sunucu: 'kr', routing: 'asia' },
  eune: { sunucu: 'eun1', routing: 'europe' }
};

const DDRAGON = 'https://ddragon.leagueoflegends.com/cdn/14.24.1';

const KUYRUK_ADI = {
  420: 'Ranked Solo/Duo', 440: 'Ranked Flex', 400: 'Normal Draft',
  430: 'Normal Blind', 450: 'ARAM', 700: 'Clash', 490: 'Quickplay',
  0: 'Custom'
};

let champIdMap = null;
async function getChampIdMap() {
  if (champIdMap) return champIdMap;
  const r = await axios.get(`${DDRAGON}/data/tr_TR/champion.json`);
  champIdMap = {};
  for (const champ of Object.values(r.data.data)) {
    champIdMap[parseInt(champ.key)] = champ.id;
  }
  return champIdMap;
}

let spellIdMap = null;
async function getSpellIdMap() {
  if (spellIdMap) return spellIdMap;
  const r = await axios.get(`${DDRAGON}/data/tr_TR/summoner.json`);
  spellIdMap = {};
  for (const spell of Object.values(r.data.data)) {
    spellIdMap[parseInt(spell.key)] = spell.id;
  }
  return spellIdMap;
}

const RANK_RENK = {
  'IRON': '#6b7280', 'BRONZE': '#cd7f32', 'SILVER': '#94a3b8',
  'GOLD': '#f0b429', 'PLATINUM': '#22d3ee', 'EMERALD': '#00c896',
  'DIAMOND': '#a78bfa', 'MASTER': '#f0b429', 'GRANDMASTER': '#ff4655', 'CHALLENGER': '#4f8ef7'
};

const RANK_BG = {
  'IRON': '#1a1c20', 'BRONZE': '#1c1510', 'SILVER': '#141820',
  'GOLD': '#1c1a10', 'PLATINUM': '#0f1c20', 'EMERALD': '#0f1c18',
  'DIAMOND': '#16131f', 'MASTER': '#1c1a10', 'GRANDMASTER': '#1c1015', 'CHALLENGER': '#0f1520'
};

const NAV_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0b0e14; color: #c8d0e0; font-family: 'Inter', 'Segoe UI', sans-serif; min-height: 100vh; }
    .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(11,14,20,0.95); border-bottom: 1px solid #1c2530; backdrop-filter: blur(12px); padding: 0 40px; height: 58px; display: flex; align-items: center; gap: 20px; }
    .logo { font-size: 17px; font-weight: 800; letter-spacing: 1.5px; color: #e2e8f0; text-decoration: none; display: flex; align-items: center; gap: 10px; }
    .logo img { width: 30px; height: 30px; border-radius: 8px; object-fit: cover; }
    .logo span { color: #4f8ef7; }
    .nav-links { display: flex; gap: 24px; margin-left: 16px; }
    .nav-links a { font-size: 13px; font-weight: 500; color: #4a5568; text-decoration: none; transition: color .15s; }
    .nav-links a:hover { color: #c8d0e0; }
    .nav-right { margin-left: auto; display: flex; gap: 8px; align-items: center; }
`;

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KenchStats — LoL İstatistikleri</title>
  <style>
    ${NAV_CSS}
    .hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px 60px; position: relative; overflow: hidden; }
    .hero::before { content: ''; position: absolute; top: -200px; left: 50%; transform: translateX(-50%); width: 800px; height: 600px; background: radial-gradient(ellipse, rgba(79,142,247,0.07) 0%, transparent 70%); pointer-events: none; }
    .hero-badge { font-size: 11px; font-weight: 600; letter-spacing: 2.5px; color: #4f8ef7; text-transform: uppercase; margin-bottom: 20px; background: rgba(79,142,247,0.1); border: 1px solid rgba(79,142,247,0.2); padding: 5px 14px; border-radius: 20px; }
    .hero-title { font-size: 56px; font-weight: 900; text-align: center; line-height: 1.1; margin-bottom: 18px; color: #e2e8f0; letter-spacing: -1.5px; }
    .hero-title span { color: #4f8ef7; }
    .hero-sub { font-size: 16px; color: #4a5568; text-align: center; margin-bottom: 52px; max-width: 440px; line-height: 1.7; font-weight: 400; }
    .search-container { width: 100%; max-width: 580px; margin-bottom: 80px; }
    .search-wrap { display: flex; border-radius: 12px; overflow: hidden; border: 1px solid #1c2530; background: #131920; transition: border-color .2s, box-shadow .2s; }
    .search-wrap:focus-within { border-color: rgba(79,142,247,0.5); box-shadow: 0 0 0 3px rgba(79,142,247,0.08); }
    .region-sel { background: #0f1520; border: none; border-right: 1px solid #1c2530; color: #8b97ad; font-size: 12px; font-weight: 700; padding: 0 16px; height: 52px; outline: none; cursor: pointer; font-family: inherit; letter-spacing: .5px; }
    .region-sel option { background: #131920; }
    .search-input { flex: 1; background: transparent; border: none; color: #e2e8f0; font-size: 14px; font-weight: 500; padding: 0 18px; height: 52px; outline: none; font-family: inherit; }
    .search-input::placeholder { color: #2d3a4a; }
    .search-btn { background: #4f8ef7; border: none; color: #fff; font-size: 12px; font-weight: 700; padding: 0 26px; height: 52px; cursor: pointer; font-family: inherit; letter-spacing: .5px; transition: background .15s; }
    .search-btn:hover { background: #3d7de8; }
    .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; max-width: 840px; width: 100%; }
    .feature { background: #131920; border: 1px solid #1c2530; border-radius: 14px; padding: 24px; transition: border-color .2s, transform .2s; cursor: default; }
    .feature:hover { border-color: rgba(79,142,247,0.3); transform: translateY(-3px); }
    .feature-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(79,142,247,0.1); display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 14px; }
    .feature-title { font-size: 14px; font-weight: 700; color: #e2e8f0; margin-bottom: 7px; }
    .feature-desc { font-size: 12px; color: #4a5568; line-height: 1.65; }
    .footer { text-align: center; padding: 28px; font-size: 11px; color: #1e2a3a; border-top: 1px solid #0f1520; }
  </style>
</head>
<body>
  <nav class="nav">
    <div class="logo"><img src="https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/TahmKench.png" alt="Tahm Kench">KENCH<span>STATS</span></div>
    <div class="nav-links">
      <a href="#">Profil Ara</a><a href="#">Şampiyonlar</a><a href="#">Sıralama</a><a href="#">Canlı Oyun</a>
    </div>
  </nav>
  <div class="hero">
    <div class="hero-badge">League of Legends Tracker</div>
    <h1 class="hero-title">Oyununu<br><span>Analiz Et</span></h1>
    <p class="hero-sub">Maç geçmişin, rank bilgin ve şampiyon istatistiklerin tek bir yerde.</p>
    <div class="search-container">
      <div class="search-wrap">
        <select class="region-sel" id="bolge">
          <option value="tr">TR</option><option value="euw">EUW</option>
          <option value="na">NA</option><option value="kr">KR</option><option value="eune">EUNE</option>
        </select>
        <input class="search-input" id="arama" placeholder="Oyuncu adı #TR1" />
        <button class="search-btn" onclick="ara()">ARA</button>
      </div>
    </div>
    <div class="features">
      <div class="feature"><div class="feature-icon">⚔️</div><div class="feature-title">Maç Geçmişi</div><div class="feature-desc">Son maçlarını detaylı KDA, şampiyon ve süre bilgileriyle incele.</div></div>
      <div class="feature"><div class="feature-icon">🏆</div><div class="feature-title">Rank Bilgisi</div><div class="feature-desc">Solo/Duo ve Flex sıralamalarını, LP kazanç/kayıplarını takip et.</div></div>
      <div class="feature"><div class="feature-icon">🎯</div><div class="feature-title">Şampiyon Analizi</div><div class="feature-desc">En çok oynadığın şampiyonlarda kazanma oranını ve performansını gör.</div></div>
    </div>
  </div>
  <div class="footer">KenchStats, Riot Games ile bağlantılı değildir.</div>
  <script>
    function ara() {
      const girdi = document.getElementById('arama').value.trim();
      const bolge = document.getElementById('bolge').value;
      if (!girdi.includes('#')) { alert('Lütfen #TAG formatında gir. Örnek: Duloxetine#RO34'); return; }
      const [isim, tag] = girdi.split('#');
      window.location.href = '/oyuncu/' + bolge + '/' + encodeURIComponent(isim) + '/' + tag;
    }
    document.getElementById('arama').addEventListener('keypress', (e) => { if (e.key === 'Enter') ara(); });
  </script>
</body>
</html>
  `);
});

app.get('/oyuncu/:bolge/:isim/:tag', async (req, res) => {
  const { bolge, isim, tag } = req.params;
  const API_KEY = process.env.RIOT_API_KEY;
  const { sunucu, routing } = BOLGE_MAP[bolge.toLowerCase()] || BOLGE_MAP.tr;

  try {
    const hesap = await axios.get(
      `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${isim}/${tag}`,
      { headers: { 'X-Riot-Token': API_KEY } }
    );
    const puuid = hesap.data.puuid;

    const maclar = await axios.get(
      `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=10`,
      { headers: { 'X-Riot-Token': API_KEY } }
    );

    let rankBilgisi = [];
    try {
      const rankResp = await axios.get(
        `https://${sunucu}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`,
        { headers: { 'X-Riot-Token': API_KEY } }
      );
      rankBilgisi = rankResp.data;
    } catch (e) { rankBilgisi = []; }

    let profileIconId = null;
    try {
      const summonerResp = await axios.get(
        `https://${sunucu}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
        { headers: { 'X-Riot-Token': API_KEY } }
      );
      profileIconId = summonerResp.data.profileIconId;
    } catch (e) { profileIconId = null; }

    const macDetaylari = await Promise.all(
      maclar.data.map(async (macId) => {
        const mac = await axios.get(
          `https://${routing}.api.riotgames.com/lol/match/v5/matches/${macId}`,
          { headers: { 'X-Riot-Token': API_KEY } }
        );
        const oyuncu = mac.data.info.participants.find(p => p.puuid === puuid);
        const itemler = [
          oyuncu.item0, oyuncu.item1, oyuncu.item2,
          oyuncu.item3, oyuncu.item4, oyuncu.item5, oyuncu.item6
        ].filter(id => id && id !== 0);
        return {
          macId, champion: oyuncu.championName, kazandi: oyuncu.win,
          kills: oyuncu.kills, deaths: oyuncu.deaths, assists: oyuncu.assists,
          kda: oyuncu.deaths === 0 ? 'Perfect' : ((oyuncu.kills + oyuncu.assists) / oyuncu.deaths).toFixed(2),
          rol: oyuncu.teamPosition || 'FILL',
          sure: Math.floor(mac.data.info.gameDuration / 60) + ' dk',
          cs: oyuncu.totalMinionsKilled + oyuncu.neutralMinionsKilled,
          queueId: mac.data.info.queueId,
          itemler
        };
      })
    );

    const champMap = {};
    macDetaylari.forEach(m => {
      if (!champMap[m.champion]) champMap[m.champion] = { mac: 0, kazandi: 0 };
      champMap[m.champion].mac++;
      if (m.kazandi) champMap[m.champion].kazandi++;
    });
    const topChamps = Object.entries(champMap)
      .sort((a, b) => b[1].mac - a[1].mac)
      .slice(0, 5)
      .map(([isim, v]) => ({
        isim, mac: v.mac,
        wr: Math.round((v.kazandi / v.mac) * 100)
      }));

    const toplamMac = macDetaylari.length;
    const kazanilanMac = macDetaylari.filter(m => m.kazandi).length;
    const kazanmaOrani = Math.round((kazanilanMac / toplamMac) * 100);
    const ortKDA = (macDetaylari.reduce((acc, m) => {
      const kda = m.kda === 'Perfect' ? 5 : parseFloat(m.kda);
      return acc + kda;
    }, 0) / toplamMac).toFixed(2);

    const ROL_TR = { TOP: 'Top', JUNGLE: 'JGL', MIDDLE: 'Mid', BOTTOM: 'Bot', UTILITY: 'Sup', FILL: 'Fill' };

    const soloRank = rankBilgisi.find(r => r.queueType === 'RANKED_SOLO_5x5');
    const flexRank = rankBilgisi.find(r => r.queueType === 'RANKED_FLEX_SR');

    function rankHTML(rank, tip) {
      if (!rank) return `
        <div class="rank-card rank-empty">
          <div class="rank-tip">${tip}</div>
          <div class="rank-yok">Unranked</div>
          <div class="rank-yok-sub">Sezon içi maç yok</div>
        </div>`;
      const renk = RANK_RENK[rank.tier] || '#c8d0e0';
      const bg = RANK_BG[rank.tier] || '#131920';
      const wr = Math.round((rank.wins / (rank.wins + rank.losses)) * 100);
      const total = rank.wins + rank.losses;
      return `<div class="rank-card" style="background:${bg}; border-color: ${renk}22;">
        <div class="rank-tip">${tip}</div>
        <div class="rank-tier" style="color:${renk}">${rank.tier} <span class="rank-div">${rank.rank}</span></div>
        <div class="rank-lp">${rank.leaguePoints} <span>LP</span></div>
        <div class="rank-progress-wrap">
          <div class="rank-progress-bar">
            <div class="rank-progress-fill" style="width:${wr}%; background:${renk}"></div>
          </div>
          <div class="rank-wl-row">
            <span style="color:${renk}">${wr}% WR</span>
            <span>${rank.wins}W ${rank.losses}L</span>
          </div>
        </div>
      </div>`;
    }

    function wrRenk(wr) {
      if (wr >= 55) return '#00c896';
      if (wr >= 45) return '#f0b429';
      return '#ff4655';
    }

    function kdaRenk(kda) {
      if (kda === 'Perfect') return '#4f8ef7';
      const v = parseFloat(kda);
      if (v >= 4) return '#4f8ef7';
      if (v >= 3) return '#00c896';
      if (v >= 2) return '#f0b429';
      return '#8b97ad';
    }

    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${hesap.data.gameName} — KenchStats</title>
  <style>
    ${NAV_CSS}
    .back { color: #4a5568; text-decoration: none; font-size: 13px; font-weight: 500; transition: color .15s; }
    .back:hover { color: #c8d0e0; }
    .canli-btn { font-size: 12px; font-weight: 700; color: #ff4655; text-decoration: none; border: 1px solid rgba(255,70,85,0.25); padding: 6px 16px; border-radius: 8px; letter-spacing: .3px; transition: background .15s; display: flex; align-items: center; gap: 6px; }
    .canli-btn:hover { background: rgba(255,70,85,0.08); }
    .live-dot { width: 6px; height: 6px; background: #ff4655; border-radius: 50%; animation: pulse 1.4s infinite; }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
    .container { max-width: 880px; margin: 0 auto; padding: 76px 20px 48px; }

    /* Profile header */
    .profil { display: flex; align-items: center; gap: 24px; background: #131920; border: 1px solid #1c2530; border-radius: 16px; padding: 28px 32px; margin-bottom: 10px; position: relative; overflow: hidden; }
    .profil::before { content: ''; position: absolute; top: -60px; right: -60px; width: 200px; height: 200px; background: radial-gradient(circle, rgba(79,142,247,0.05) 0%, transparent 70%); pointer-events: none; }
    .avatar { width: 76px; height: 76px; border-radius: 50%; background: #1c2530; border: 2px solid #4f8ef744; flex-shrink: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 800; color: #4f8ef7; }
    .avatar img { width: 100%; height: 100%; object-fit: cover; }
    .profil-name { font-size: 24px; font-weight: 800; color: #e2e8f0; letter-spacing: -.3px; }
    .profil-tag { font-size: 14px; color: #4a5568; margin-top: 3px; font-weight: 500; }
    .profil-bolge { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; background: rgba(79,142,247,0.1); color: #4f8ef7; border: 1px solid rgba(79,142,247,0.2); padding: 3px 10px; border-radius: 20px; margin-top: 10px; display: inline-block; }

    /* Rank cards */
    .rank-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 10px; }
    .rank-card { background: #131920; border: 1px solid #1c2530; border-radius: 14px; padding: 20px 22px; }
    .rank-card.rank-empty { opacity: .6; }
    .rank-tip { font-size: 10px; color: #4a5568; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; margin-bottom: 10px; }
    .rank-tier { font-size: 22px; font-weight: 800; margin-bottom: 4px; letter-spacing: -.3px; }
    .rank-div { font-size: 18px; font-weight: 600; opacity: .8; }
    .rank-lp { font-size: 13px; color: #8b97ad; margin-bottom: 12px; font-weight: 500; }
    .rank-lp span { font-size: 11px; color: #4a5568; }
    .rank-progress-wrap { }
    .rank-progress-bar { height: 4px; background: #1c2530; border-radius: 4px; margin-bottom: 7px; overflow: hidden; }
    .rank-progress-fill { height: 100%; border-radius: 4px; transition: width .4s; }
    .rank-wl-row { display: flex; justify-content: space-between; font-size: 11px; color: #4a5568; font-weight: 500; }
    .rank-yok { font-size: 18px; color: #2d3a4a; font-weight: 700; margin-top: 4px; }
    .rank-yok-sub { font-size: 11px; color: #1e2a3a; margin-top: 4px; }

    /* Stats */
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 10px; }
    .stat-card { background: #131920; border: 1px solid #1c2530; border-radius: 14px; padding: 18px 20px; text-align: center; }
    .stat-val { font-size: 28px; font-weight: 800; color: #4f8ef7; letter-spacing: -1px; }
    .stat-val.wr-high { color: #00c896; }
    .stat-val.wr-low { color: #ff4655; }
    .stat-label { font-size: 10px; color: #4a5568; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 5px; font-weight: 600; }

    /* Section title */
    .section-title { font-size: 10px; color: #4a5568; text-transform: uppercase; letter-spacing: 2.5px; font-weight: 700; margin-bottom: 10px; margin-top: 20px; }

    /* Champ grid */
    .champ-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 10px; }
    .champ-card { background: #131920; border: 1px solid #1c2530; border-radius: 12px; padding: 14px 10px; text-align: center; transition: border-color .15s, transform .15s; cursor: default; }
    .champ-card:hover { border-color: rgba(79,142,247,0.3); transform: translateY(-2px); }
    .champ-card img { width: 52px; height: 52px; border-radius: 10px; border: 2px solid #1c2530; margin-bottom: 8px; }
    .champ-name { font-size: 11px; font-weight: 700; color: #e2e8f0; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .champ-games { font-size: 10px; color: #4a5568; margin-bottom: 5px; font-weight: 500; }
    .champ-wr { font-size: 12px; font-weight: 800; }
    .champ-wr-bar { height: 3px; background: #1c2530; border-radius: 2px; margin-top: 6px; overflow: hidden; }
    .champ-wr-fill { height: 100%; border-radius: 2px; }

    /* Match history */
    .mac { display: flex; align-items: center; gap: 14px; background: #131920; border: 1px solid #1c2530; border-radius: 12px; padding: 12px 16px; margin-bottom: 6px; border-left: 3px solid #1c2530; transition: border-color .15s, transform .12s; position: relative; overflow: hidden; text-decoration: none; color: inherit; cursor: pointer; }
    .mac:hover { border-color: #2a3a4a; transform: translateX(3px); }
    .mac.kazandi { border-left-color: #00c896; background: #0f1c18; }
    .mac.kaybetti { border-left-color: #ff4655; background: #1a0f10; }
    .mac-glow { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
    .mac.kazandi .mac-glow { background: linear-gradient(90deg, rgba(0,200,150,0.04) 0%, transparent 40%); }
    .mac.kaybetti .mac-glow { background: linear-gradient(90deg, rgba(255,70,85,0.04) 0%, transparent 40%); }
    .badge { font-size: 10px; font-weight: 800; min-width: 60px; text-align: center; padding: 4px 10px; border-radius: 6px; letter-spacing: .3px; flex-shrink: 0; }
    .mac.kazandi .badge { background: rgba(0,200,150,0.12); color: #00c896; }
    .mac.kaybetti .badge { background: rgba(255,70,85,0.12); color: #ff4655; }
    .champ-icon { width: 42px; height: 42px; border-radius: 10px; object-fit: cover; border: 2px solid #1c2530; flex-shrink: 0; }
    .champ-nm { font-size: 14px; font-weight: 700; color: #e2e8f0; min-width: 100px; }
    .kda-wrap { min-width: 100px; }
    .kda-score { font-size: 13px; font-weight: 600; color: #c8d0e0; }
    .kda-ratio { font-size: 11px; font-weight: 700; margin-top: 2px; }
    .meta-row { display: flex; gap: 12px; margin-left: auto; }
    .meta-chip { display: flex; flex-direction: column; align-items: center; }
    .meta-chip span:first-child { font-size: 13px; font-weight: 600; color: #8b97ad; }
    .meta-chip span:last-child { font-size: 10px; color: #4a5568; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; font-weight: 600; }
    .queue-tag { font-size: 10px; color: #4a5568; background: #1c2530; padding: 2px 8px; border-radius: 4px; font-weight: 500; flex-shrink: 0; }
    .item-list { display: flex; gap: 4px; flex-wrap: wrap; align-items: center; }
    .item-img { width: 28px; height: 28px; border-radius: 6px; border: 1px solid #1c2530; object-fit: cover; background: #0b0e14; }
    .detail-arrow { font-size: 20px; color: #2d3a4a; margin-left: 4px; font-weight: 300; transition: color .15s, transform .15s; }
    .mac:hover .detail-arrow { color: #4f8ef7; transform: translateX(3px); }
  </style>
</head>
<body>
  <nav class="nav">
    <a class="logo" href="/"><img src="https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/TahmKench.png" alt="Tahm Kench"><span>KENCH</span>STATS</a>
    <a class="back" href="/">← Ana Sayfa</a>
    <div class="nav-right">
      <a class="canli-btn" href="/canli/${bolge}/${encodeURIComponent(hesap.data.gameName)}/${hesap.data.tagLine}"><div class="live-dot"></div> Canlı Oyun</a>
    </div>
  </nav>
  <div class="container">
    <div class="profil">
      <div class="avatar">${profileIconId ? `<img src="${DDRAGON}/img/profileicon/${profileIconId}.png" alt="profil" onerror="this.style.display='none'"/>` : hesap.data.gameName.charAt(0).toUpperCase()}</div>
      <div>
        <div class="profil-name">${hesap.data.gameName}</div>
        <div class="profil-tag">#${hesap.data.tagLine}</div>
        <div class="profil-bolge">${bolge.toUpperCase()}</div>
      </div>
    </div>

    <div class="rank-grid">
      ${rankHTML(soloRank, 'Solo / Duo')}
      ${rankHTML(flexRank, 'Flex')}
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-val ${kazanmaOrani >= 55 ? 'wr-high' : kazanmaOrani < 45 ? 'wr-low' : ''}">${kazanmaOrani}%</div>
        <div class="stat-label">Kazanma Oranı</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${ortKDA}</div>
        <div class="stat-label">Ort. KDA</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${toplamMac}</div>
        <div class="stat-label">Analiz Edilen Maç</div>
      </div>
    </div>

    <div class="section-title">En Çok Oynanan Şampiyonlar</div>
    <div class="champ-grid">
      ${topChamps.map(c => {
        const renk = wrRenk(c.wr);
        return `
      <div class="champ-card">
        <img src="${DDRAGON}/img/champion/${c.isim}.png" alt="${c.isim}" onerror="this.style.display='none'"/>
        <div class="champ-name">${c.isim}</div>
        <div class="champ-games">${c.mac} maç</div>
        <div class="champ-wr" style="color:${renk}">${c.wr}%</div>
        <div class="champ-wr-bar"><div class="champ-wr-fill" style="width:${c.wr}%;background:${renk}"></div></div>
      </div>`;
      }).join('')}
    </div>

    <div class="section-title">Son ${toplamMac} Maç</div>
    ${macDetaylari.map(m => {
      const kdaClr = kdaRenk(m.kda);
      const queueName = KUYRUK_ADI[m.queueId] || '';
      return `
    <a class="mac ${m.kazandi ? 'kazandi' : 'kaybetti'}" href="/mac/${bolge}/${m.macId}/${puuid}">
      <div class="mac-glow"></div>
      <div class="badge">${m.kazandi ? 'KAZANDI' : 'KAYBETTİ'}</div>
      <img class="champ-icon" src="${DDRAGON}/img/champion/${m.champion}.png" alt="${m.champion}" onerror="this.style.display='none'"/>
      <div class="champ-nm">${m.champion}</div>
      <div class="kda-wrap">
        <div class="kda-score">${m.kills} / <span style="color:#ff4655">${m.deaths}</span> / ${m.assists}</div>
        <div class="kda-ratio" style="color:${kdaClr}">KDA ${m.kda}</div>
      </div>
      <div class="item-list">
        ${m.itemler.map(id => `<img class="item-img" src="${DDRAGON}/img/item/${id}.png" alt="${id}" title="${id}" onerror="this.style.display='none'"/>`).join('')}
      </div>
      <div class="meta-row">
        ${queueName ? `<div class="queue-tag">${queueName}</div>` : ''}
        <div class="meta-chip"><span>${ROL_TR[m.rol] || m.rol}</span><span>Rol</span></div>
        <div class="meta-chip"><span>${m.cs}</span><span>CS</span></div>
        <div class="meta-chip"><span>${m.sure}</span><span>Süre</span></div>
        <div class="detail-arrow">›</div>
      </div>
    </a>`;
    }).join('')}
  </div>
</body>
</html>
    `);

  } catch (error) {
    const detay = error.response ? `${error.response.status} - ${JSON.stringify(error.response.data)}` : error.message;
    res.status(500).send(`
      <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        body{background:#0b0e14;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Inter,sans-serif;}
        .err{background:#131920;border:1px solid rgba(255,70,85,.2);border-radius:16px;padding:40px 48px;max-width:500px;text-align:center;}
        h2{color:#ff4655;font-size:20px;margin-bottom:12px;}p{color:#4a5568;font-size:14px;}
      </style></head><body><div class="err"><h2>Hata Oluştu</h2><p>${detay}</p></div></body></html>
    `);
  }
});

app.get('/canli/:bolge/:isim/:tag', async (req, res) => {
  const { bolge, isim, tag } = req.params;
  const API_KEY = process.env.RIOT_API_KEY;
  const { sunucu, routing } = BOLGE_MAP[bolge.toLowerCase()] || BOLGE_MAP.tr;

  try {
    const hesap = await axios.get(
      `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${isim}/${tag}`,
      { headers: { 'X-Riot-Token': API_KEY } }
    );
    const puuid = hesap.data.puuid;
    const oyuncuAdi = hesap.data.gameName;
    const oyuncuTag = hesap.data.tagLine;

    let canliOyun = null;
    let oyundaMi = false;
    try {
      const canliResp = await axios.get(
        `https://${sunucu}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`,
        { headers: { 'X-Riot-Token': API_KEY } }
      );
      canliOyun = canliResp.data;
      oyundaMi = true;
    } catch (e) {
      if (e.response && e.response.status === 404) {
        oyundaMi = false;
      } else {
        throw e;
      }
    }

    const champMap = oyundaMi ? await getChampIdMap() : {};

    function saniyeStr(s) {
      const d = Math.floor(s / 60);
      const sn = s % 60;
      return `${d}:${String(sn).padStart(2, '0')}`;
    }

    const kuyruAdi = oyundaMi ? (KUYRUK_ADI[canliOyun.gameQueueConfigId] || 'Bilinmeyen Mod') : '';

    const takim1 = oyundaMi ? canliOyun.participants.filter(p => p.teamId === 100) : [];
    const takim2 = oyundaMi ? canliOyun.participants.filter(p => p.teamId === 200) : [];

    const banlar1 = oyundaMi ? (canliOyun.bannedChampions || []).filter(b => b.teamId === 100) : [];
    const banlar2 = oyundaMi ? (canliOyun.bannedChampions || []).filter(b => b.teamId === 200) : [];

    function oyuncuSatiri(p) {
      const champIsim = champMap[p.championId] || 'Bilinmiyor';
      const kendiMi = p.puuid === puuid;
      const profilIkon = p.profileIconId ? `<img class="profil-ikon" src="${DDRAGON}/img/profileicon/${p.profileIconId}.png" alt="" onerror="this.style.display='none'"/>` : '';
      return `<div class="oyuncu-satir ${kendiMi ? 'kendi' : ''}">
        <img class="champ-ikon" src="${DDRAGON}/img/champion/${champIsim}.png" alt="${champIsim}" onerror="this.style.display='none'"/>
        <div class="oyuncu-bilgi">
          <div class="oyuncu-isim ${kendiMi ? 'kendi-isim' : ''}">${kendiMi ? '★ ' : ''}${champIsim}</div>
          <div class="oyuncu-meta">${profilIkon}${p.summonerName || ''}</div>
        </div>
      </div>`;
    }

    function banSatiri(banlar) {
      if (!banlar.length) return '<div class="ban-yok">Ban yok</div>';
      return banlar.map(b => {
        const champIsim = champMap[b.championId];
        if (!champIsim || b.championId === -1) return '';
        return `<img class="ban-ikon" src="${DDRAGON}/img/champion/${champIsim}.png" title="${champIsim}" onerror="this.style.display='none'"/>`;
      }).join('');
    }

    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Canlı Oyun — ${oyuncuAdi} — KenchStats</title>
  <style>
    ${NAV_CSS}
    .back { color: #4a5568; text-decoration: none; font-size: 13px; font-weight: 500; }
    .back:hover { color: #c8d0e0; }
    .profil-link { font-size: 12px; font-weight: 700; color: #4f8ef7; text-decoration: none; border: 1px solid rgba(79,142,247,0.25); padding: 6px 16px; border-radius: 8px; transition: background .15s; }
    .profil-link:hover { background: rgba(79,142,247,0.08); }
    .container { max-width: 920px; margin: 0 auto; padding: 76px 20px 48px; }
    .page-header { font-size: 10px; color: #4a5568; text-transform: uppercase; letter-spacing: 2.5px; font-weight: 700; margin-bottom: 12px; }

    .yok-kart { background: #131920; border: 1px solid #1c2530; border-radius: 16px; padding: 72px 32px; text-align: center; }
    .yok-ikon { font-size: 48px; margin-bottom: 16px; }
    .yok-baslik { font-size: 22px; font-weight: 800; color: #e2e8f0; margin-bottom: 8px; letter-spacing: -.3px; }
    .yok-alt { font-size: 14px; color: #4a5568; }

    .oyun-bilgi { background: #131920; border: 1px solid #1c2530; border-radius: 16px; padding: 22px 28px; margin-bottom: 12px; display: flex; align-items: center; gap: 28px; }
    .oyun-mod { font-size: 20px; font-weight: 800; color: #e2e8f0; letter-spacing: -.3px; }
    .oyun-sure-wrap { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
    .canli-nokta { width: 7px; height: 7px; background: #ff4655; border-radius: 50%; animation: pulse 1.4s infinite; box-shadow: 0 0 6px #ff4655; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
    .oyun-sure { font-size: 22px; font-weight: 800; color: #ff4655; font-variant-numeric: tabular-nums; }
    .oyun-meta { margin-left: auto; font-size: 12px; color: #4a5568; text-align: right; line-height: 1.8; }
    .oyun-meta strong { color: #8b97ad; font-weight: 600; }

    .takim-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .takim-kart { background: #131920; border: 1px solid #1c2530; border-radius: 14px; padding: 18px 20px; }
    .takim-baslik { font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
    .takim-baslik::before { content: ''; display: block; width: 8px; height: 8px; border-radius: 50%; }
    .takim-mavi .takim-baslik { color: #4f8ef7; }
    .takim-mavi .takim-baslik::before { background: #4f8ef7; box-shadow: 0 0 8px #4f8ef7; }
    .takim-kirmizi .takim-baslik { color: #ff4655; }
    .takim-kirmizi .takim-baslik::before { background: #ff4655; box-shadow: 0 0 8px #ff4655; }
    .oyuncu-satir { display: flex; align-items: center; gap: 10px; padding: 8px 6px; border-bottom: 1px solid #0f1825; border-radius: 6px; }
    .oyuncu-satir:last-of-type { border-bottom: none; }
    .oyuncu-satir.kendi { background: rgba(79,142,247,0.06); border: 1px solid rgba(79,142,247,0.15); margin: 2px -4px; padding: 8px 10px; }
    .champ-ikon { width: 38px; height: 38px; border-radius: 9px; border: 2px solid #1c2530; flex-shrink: 0; }
    .oyuncu-bilgi { flex: 1; min-width: 0; }
    .oyuncu-isim { font-size: 13px; font-weight: 700; color: #c8d0e0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .kendi-isim { color: #4f8ef7; }
    .oyuncu-meta { font-size: 11px; color: #4a5568; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 5px; margin-top: 2px; }
    .ban-satir { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 14px; padding-top: 12px; border-top: 1px solid #1c2530; align-items: center; }
    .ban-label { font-size: 10px; color: #4a5568; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-right: 6px; }
    .ban-ikon { width: 26px; height: 26px; border-radius: 6px; border: 1px solid #2a1a1a; opacity: .7; filter: grayscale(.3); }
    .ban-yok { font-size: 11px; color: #2d3a4a; }
    .profil-ikon { width: 20px; height: 20px; border-radius: 50%; border: 1px solid #1c2530; flex-shrink: 0; }
  </style>
</head>
<body>
  <nav class="nav">
    <a class="logo" href="/"><img src="https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/TahmKench.png" alt="Tahm Kench"><span>KENCH</span>STATS</a>
    <a class="back" href="/">← Ana Sayfa</a>
    <div class="nav-right">
      <a class="profil-link" href="/oyuncu/${bolge}/${encodeURIComponent(oyuncuAdi)}/${oyuncuTag}">Profil</a>
    </div>
  </nav>
  <div class="container">
    <div class="page-header">Canlı Oyun — ${oyuncuAdi} #${oyuncuTag}</div>

    ${!oyundaMi ? `
    <div class="yok-kart">
      <div class="yok-ikon">🎮</div>
      <div class="yok-baslik">${oyuncuAdi} şu an oyunda değil</div>
      <div class="yok-alt">Oyuncu aktif bir maçta bulunamadı.</div>
    </div>
    ` : `
    <div class="oyun-bilgi">
      <div>
        <div class="oyun-mod">${kuyruAdi}</div>
        <div class="oyun-sure-wrap">
          <div class="canli-nokta"></div>
          <div class="oyun-sure" id="sure">${saniyeStr(canliOyun.gameLength)}</div>
        </div>
      </div>
      <div class="oyun-meta">
        <strong>Platform:</strong> ${canliOyun.platformId || sunucu.toUpperCase()}<br/>
        <strong>Harita:</strong> ${canliOyun.mapId}
      </div>
    </div>

    <div class="takim-grid">
      <div class="takim-kart takim-mavi">
        <div class="takim-baslik">Mavi Takım</div>
        ${takim1.map(oyuncuSatiri).join('')}
        <div class="ban-satir">
          <span class="ban-label">Banlar</span>
          ${banSatiri(banlar1)}
        </div>
      </div>
      <div class="takim-kart takim-kirmizi">
        <div class="takim-baslik">Kırmızı Takım</div>
        ${takim2.map(oyuncuSatiri).join('')}
        <div class="ban-satir">
          <span class="ban-label">Banlar</span>
          ${banSatiri(banlar2)}
        </div>
      </div>
    </div>

    <script>
      let saniye = ${canliOyun.gameLength};
      function saniyeStr(s) {
        const d = Math.floor(s / 60);
        const sn = s % 60;
        return d + ':' + String(sn).padStart(2, '0');
      }
      setInterval(() => {
        saniye++;
        document.getElementById('sure').textContent = saniyeStr(saniye);
      }, 1000);
    </script>
    `}
  </div>
</body>
</html>
    `);

  } catch (error) {
    const detay = error.response ? `${error.response.status} - ${JSON.stringify(error.response.data)}` : error.message;
    res.status(500).send(`
      <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        body{background:#0b0e14;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Inter,sans-serif;}
        .err{background:#131920;border:1px solid rgba(255,70,85,.2);border-radius:16px;padding:40px 48px;max-width:500px;text-align:center;}
        h2{color:#ff4655;font-size:20px;margin-bottom:12px;}p{color:#4a5568;font-size:14px;}
      </style></head><body><div class="err"><h2>Hata Oluştu</h2><p>${detay}</p></div></body></html>
    `);
  }
});

app.get('/mac/:bolge/:macId/:puuid', async (req, res) => {
  const { bolge, macId, puuid } = req.params;
  const API_KEY = process.env.RIOT_API_KEY;
  const { routing } = BOLGE_MAP[bolge.toLowerCase()] || BOLGE_MAP.tr;

  try {
    const [macResp, spellMap] = await Promise.all([
      axios.get(`https://${routing}.api.riotgames.com/lol/match/v5/matches/${macId}`, { headers: { 'X-Riot-Token': API_KEY } }),
      getSpellIdMap()
    ]);

    const info = macResp.data.info;
    const queueName = KUYRUK_ADI[info.queueId] || 'Bilinmeyen Mod';
    const sureDk = Math.floor(info.gameDuration / 60);
    const sureSn = String(info.gameDuration % 60).padStart(2, '0');
    const tarih = new Date(info.gameEndTimestamp || info.gameStartTimestamp).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });

    const benimOyuncu = info.participants.find(p => p.puuid === puuid);
    const benimKazandim = benimOyuncu ? benimOyuncu.win : false;

    const takim100 = info.participants.filter(p => p.teamId === 100);
    const takim200 = info.participants.filter(p => p.teamId === 200);
    const takim100Kazandi = takim100[0]?.win;
    const takim200Kazandi = takim200[0]?.win;

    const maxHasar = Math.max(...info.participants.map(p => p.totalDamageDealtToChampions));

    function oyuncuSatiri(p) {
      const kendiMi = p.puuid === puuid;
      const kda = p.deaths === 0 ? 'Perfect' : ((p.kills + p.assists) / p.deaths).toFixed(2);
      const kdaClr = kda === 'Perfect' ? '#4f8ef7' : parseFloat(kda) >= 4 ? '#4f8ef7' : parseFloat(kda) >= 3 ? '#00c896' : parseFloat(kda) >= 2 ? '#f0b429' : '#8b97ad';
      const cs = p.totalMinionsKilled + p.neutralMinionsKilled;
      const csPerMin = (cs / (info.gameDuration / 60)).toFixed(1);
      const spell1 = spellMap[p.summoner1Id] || '';
      const spell2 = spellMap[p.summoner2Id] || '';
      const itemler = [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6];
      const hasarPct = Math.round((p.totalDamageDealtToChampions / maxHasar) * 100);
      const goldK = (p.goldEarned / 1000).toFixed(1);
      const hasarK = Math.round(p.totalDamageDealtToChampions / 1000);
      const oyuncuIsim = p.riotIdGameName || p.summonerName || p.championName;

      return `
      <tr class="p-row ${kendiMi ? 'p-row-kendi' : ''}">
        <td class="td-champ">
          <div class="champ-cell">
            <div style="position:relative;flex-shrink:0;">
              <img class="p-champ-img" src="${DDRAGON}/img/champion/${p.championName}.png" alt="${p.championName}" onerror="this.style.display='none'"/>
              <div class="p-lvl">${p.champLevel}</div>
            </div>
            <div class="spell-stack">
              ${spell1 ? `<img class="p-spell" src="${DDRAGON}/img/spell/${spell1}.png" title="${spell1}" onerror="this.style.display='none'"/>` : '<div class="p-spell p-spell-bos"></div>'}
              ${spell2 ? `<img class="p-spell" src="${DDRAGON}/img/spell/${spell2}.png" title="${spell2}" onerror="this.style.display='none'"/>` : '<div class="p-spell p-spell-bos"></div>'}
            </div>
            <div class="p-name-col">
              ${p.riotIdGameName && p.riotIdTagline
                ? `<a class="p-name ${kendiMi ? 'p-name-kendi' : ''} p-name-link" href="/oyuncu/${bolge}/${encodeURIComponent(p.riotIdGameName)}/${encodeURIComponent(p.riotIdTagline)}">${kendiMi ? '★ ' : ''}${oyuncuIsim}</a>`
                : `<div class="p-name ${kendiMi ? 'p-name-kendi' : ''}">${kendiMi ? '★ ' : ''}${oyuncuIsim}</div>`
              }
              <div class="p-champ-sub">${p.championName}</div>
            </div>
          </div>
        </td>
        <td class="td-kda">
          <div class="p-kda-score">${p.kills} / <span class="p-death">${p.deaths}</span> / ${p.assists}</div>
          <div class="p-kda-ratio" style="color:${kdaClr}">${kda === 'Perfect' ? 'Perfect' : kda + ' KDA'}</div>
        </td>
        <td class="td-stat-num">
          <div class="p-stat-val">${cs}</div>
          <div class="p-stat-sub">${csPerMin}/dk</div>
        </td>
        <td class="td-stat-num">
          <div class="p-stat-val">${goldK}k</div>
          <div class="p-stat-sub">Gold</div>
        </td>
        <td class="td-hasar">
          <div class="p-hasar-val">${hasarK}k</div>
          <div class="p-hasar-bar-wrap"><div class="p-hasar-bar" style="width:${hasarPct}%; background:${p.win ? '#00c896' : '#ff4655'}"></div></div>
        </td>
        <td class="td-stat-num">
          <div class="p-stat-val">${p.visionScore}</div>
          <div class="p-stat-sub">${p.wardsPlaced || 0}W ${p.wardsKilled || 0}K</div>
        </td>
        <td class="td-items">
          <div class="p-item-list">
            ${itemler.map(id => id && id !== 0
              ? `<img class="p-item" src="${DDRAGON}/img/item/${id}.png" alt="${id}" onerror="this.style.display='none'"/>`
              : '<div class="p-item p-item-bos"></div>'
            ).join('')}
          </div>
        </td>
      </tr>`;
    }

    function takimTablosu(takim, kazandi, takim100mi) {
      const takimRenk = takim100mi ? '#4f8ef7' : '#ff4655';
      const takimAd = takim100mi ? 'Mavi Takım' : 'Kırmızı Takım';
      const sonuc = kazandi ? 'GERİ DÖNDÜ' : 'YIKILDI';
      const sonucRenk = kazandi ? '#00c896' : '#ff4655';
      const totalKills = takim.reduce((a, p) => a + p.kills, 0);
      const totalGold = (takim.reduce((a, p) => a + p.goldEarned, 0) / 1000).toFixed(1);
      const teamObj = info.teams?.find(t => t.teamId === (takim100mi ? 100 : 200));
      const objStr = teamObj ? [
        teamObj.objectives?.baron?.kills ? `${teamObj.objectives.baron.kills} Baron` : '',
        teamObj.objectives?.dragon?.kills ? `${teamObj.objectives.dragon.kills} Ejder` : '',
        teamObj.objectives?.tower?.kills ? `${teamObj.objectives.tower.kills} Kule` : '',
      ].filter(Boolean).join(' · ') : '';

      return `
      <div class="takim-blok">
        <div class="takim-header">
          <div class="takim-adi" style="color:${takimRenk}">${takimAd}</div>
          <div class="takim-sonuc" style="color:${sonucRenk}">${sonuc}</div>
          <div class="takim-stats">${totalKills} Kill · ${totalGold}k Gold${objStr ? ' · ' + objStr : ''}</div>
        </div>
        <div class="tablo-wrap">
          <table class="mac-tablo">
            <thead>
              <tr>
                <th class="th-champ">Oyuncu</th>
                <th>KDA</th>
                <th>CS</th>
                <th>Gold</th>
                <th>Hasar</th>
                <th>Vision</th>
                <th>Eşyalar</th>
              </tr>
            </thead>
            <tbody>
              ${takim.map(oyuncuSatiri).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
    }

    const profilUrl = `/oyuncu/${bolge}/${encodeURIComponent(benimOyuncu?.riotIdGameName || '')}/${benimOyuncu?.riotIdTagline || ''}`;

    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Maç Detayı — KenchStats</title>
  <style>
    ${NAV_CSS}
    .back { color: #4a5568; text-decoration: none; font-size: 13px; font-weight: 500; transition: color .15s; }
    .back:hover { color: #c8d0e0; }
    .profil-link { font-size: 12px; font-weight: 700; color: #4f8ef7; text-decoration: none; border: 1px solid rgba(79,142,247,0.25); padding: 6px 16px; border-radius: 8px; transition: background .15s; }
    .profil-link:hover { background: rgba(79,142,247,0.08); }
    .container { max-width: 1080px; margin: 0 auto; padding: 76px 20px 48px; }

    /* Match header */
    .mac-header { background: #131920; border: 1px solid #1c2530; border-radius: 16px; padding: 22px 28px; margin-bottom: 14px; display: flex; align-items: center; gap: 24px; border-left: 4px solid ${benimKazandim ? '#00c896' : '#ff4655'}; }
    .mac-sonuc-badge { font-size: 13px; font-weight: 800; padding: 6px 16px; border-radius: 8px; letter-spacing: .5px; background: ${benimKazandim ? 'rgba(0,200,150,0.12)' : 'rgba(255,70,85,0.12)'}; color: ${benimKazandim ? '#00c896' : '#ff4655'}; flex-shrink: 0; }
    .mac-mod { font-size: 20px; font-weight: 800; color: #e2e8f0; }
    .mac-meta-row { font-size: 12px; color: #4a5568; margin-top: 4px; display: flex; gap: 14px; }
    .mac-meta-row span { color: #8b97ad; font-weight: 500; }
    .mac-champ-preview { display: flex; align-items: center; gap: 12px; margin-left: auto; }
    .mac-champ-preview img { width: 52px; height: 52px; border-radius: 12px; border: 2px solid #1c2530; }
    .mac-kda-big { font-size: 18px; font-weight: 800; color: #e2e8f0; }
    .mac-kda-big .d { color: #ff4655; }
    .mac-kda-sub { font-size: 11px; color: #4a5568; margin-top: 3px; }

    /* Team blocks */
    .takim-blok { margin-bottom: 16px; }
    .takim-header { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; padding: 0 4px; }
    .takim-adi { font-size: 12px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; }
    .takim-sonuc { font-size: 11px; font-weight: 700; letter-spacing: 1px; }
    .takim-stats { font-size: 11px; color: #4a5568; margin-left: auto; font-weight: 500; }

    /* Table */
    .tablo-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid #1c2530; }
    .mac-tablo { width: 100%; border-collapse: collapse; font-size: 13px; }
    .mac-tablo thead tr { background: #0f1520; }
    .mac-tablo th { padding: 9px 12px; font-size: 10px; font-weight: 700; color: #4a5568; text-transform: uppercase; letter-spacing: 1.5px; text-align: left; white-space: nowrap; }
    .mac-tablo tbody tr { border-top: 1px solid #1a2230; transition: background .12s; }
    .mac-tablo tbody tr:hover { background: rgba(255,255,255,0.02); }
    .p-row-kendi { background: rgba(79,142,247,0.06) !important; }
    .p-row-kendi:hover { background: rgba(79,142,247,0.09) !important; }

    /* Champion cell */
    .td-champ { padding: 10px 12px; min-width: 200px; }
    .champ-cell { display: flex; align-items: center; gap: 8px; }
    .p-champ-img { width: 40px; height: 40px; border-radius: 10px; border: 2px solid #1c2530; flex-shrink: 0; }
    .p-lvl { position: absolute; bottom: -4px; right: -4px; background: #0b0e14; color: #8b97ad; font-size: 9px; font-weight: 800; border-radius: 4px; padding: 1px 4px; border: 1px solid #1c2530; }
    .spell-stack { display: flex; flex-direction: column; gap: 2px; flex-shrink: 0; }
    .p-spell { width: 18px; height: 18px; border-radius: 4px; border: 1px solid #1c2530; object-fit: cover; }
    .p-spell-bos { background: #0b0e14; }
    .p-name-col { min-width: 0; }
    .p-name { font-size: 13px; font-weight: 700; color: #c8d0e0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; }
    .p-name-kendi { color: #4f8ef7; }
    .p-name-link { text-decoration: none; cursor: pointer; }
    .p-name-link:hover { text-decoration: underline; opacity: 0.85; }
    .p-champ-sub { font-size: 10px; color: #4a5568; margin-top: 2px; font-weight: 500; }

    /* KDA */
    .td-kda { padding: 10px 12px; white-space: nowrap; }
    .p-kda-score { font-size: 13px; font-weight: 700; color: #c8d0e0; }
    .p-death { color: #ff4655; }
    .p-kda-ratio { font-size: 11px; font-weight: 600; margin-top: 2px; }

    /* Stats */
    .td-stat-num { padding: 10px 12px; text-align: center; white-space: nowrap; }
    .p-stat-val { font-size: 13px; font-weight: 700; color: #c8d0e0; }
    .p-stat-sub { font-size: 10px; color: #4a5568; margin-top: 2px; font-weight: 500; }

    /* Damage bar */
    .td-hasar { padding: 10px 12px; min-width: 90px; }
    .p-hasar-val { font-size: 13px; font-weight: 700; color: #c8d0e0; margin-bottom: 4px; }
    .p-hasar-bar-wrap { height: 4px; background: #1c2530; border-radius: 4px; overflow: hidden; }
    .p-hasar-bar { height: 100%; border-radius: 4px; min-width: 2px; }

    /* Items */
    .td-items { padding: 10px 12px; }
    .p-item-list { display: flex; gap: 3px; flex-wrap: wrap; align-items: center; }
    .p-item { width: 26px; height: 26px; border-radius: 6px; border: 1px solid #1c2530; object-fit: cover; background: #0b0e14; }
    .p-item-bos { background: #0b0e14; opacity: .3; }
  </style>
</head>
<body>
  <nav class="nav">
    <a class="logo" href="/"><img src="https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/TahmKench.png" alt="Tahm Kench"><span>KENCH</span>STATS</a>
    <a class="back" href="javascript:history.back()">← Geri</a>
    <div class="nav-right">
      <a class="profil-link" href="${profilUrl}">Profil</a>
    </div>
  </nav>
  <div class="container">

    <div class="mac-header">
      <div class="mac-sonuc-badge">${benimKazandim ? 'KAZANDI' : 'KAYBETTİ'}</div>
      <div>
        <div class="mac-mod">${queueName}</div>
        <div class="mac-meta-row">
          <span>${sureDk}:${sureSn} dk</span>
          <span>${tarih}</span>
        </div>
      </div>
      ${benimOyuncu ? `
      <div class="mac-champ-preview">
        <img src="${DDRAGON}/img/champion/${benimOyuncu.championName}.png" alt="${benimOyuncu.championName}" onerror="this.style.display='none'"/>
        <div>
          <div class="mac-kda-big">${benimOyuncu.kills} / <span class="d">${benimOyuncu.deaths}</span> / ${benimOyuncu.assists}</div>
          <div class="mac-kda-sub">${benimOyuncu.championName} · ${benimOyuncu.deaths === 0 ? 'Perfect KDA' : (((benimOyuncu.kills + benimOyuncu.assists) / benimOyuncu.deaths).toFixed(2) + ' KDA')}</div>
        </div>
      </div>` : ''}
    </div>

    ${takimTablosu(takim100, takim100Kazandi, true)}
    ${takimTablosu(takim200, takim200Kazandi, false)}

  </div>
</body>
</html>
    `);

  } catch (error) {
    const detay = error.response ? `${error.response.status} - ${JSON.stringify(error.response.data)}` : error.message;
    res.status(500).send(`
      <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        body{background:#0b0e14;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Inter,sans-serif;}
        .err{background:#131920;border:1px solid rgba(255,70,85,.2);border-radius:16px;padding:40px 48px;max-width:500px;text-align:center;}
        h2{color:#ff4655;font-size:20px;margin-bottom:12px;}p{color:#4a5568;font-size:14px;}
      </style></head><body><div class="err"><h2>Hata Oluştu</h2><p>${detay}</p></div></body></html>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`KenchStats ${PORT} portunda çalışıyor!`);
});
