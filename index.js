const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
require('dotenv').config();

const cache = new NodeCache({ stdTTL: 300 });

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

const CHAMPION_NAME_MAP = {
  'TahmKench': 'Tahm Kench',
  'MissFortune': 'Miss Fortune',
  'RenataGlasc': 'Renata Glasc',
  'AurelionSol': 'Aurelion Sol',
  'DrMundo': 'Dr. Mundo',
  'JarvanIV': 'Jarvan IV',
  'LeeSin': 'Lee Sin',
  'MasterYi': 'Master Yi',
  'MonkeyKing': 'Wukong',
  'Nunu': 'Nunu & Willump',
  'TwistedFate': 'Twisted Fate',
  'XinZhao': 'Xin Zhao',
  'KogMaw': "Kog'Maw",
  'Kaisa': "Kai'Sa",
  'Khazix': "Kha'Zix",
  'Chogath': "Cho'Gath",
  'Velkoz': "Vel'Koz",
  'Reksai': "Rek'Sai",
  'BelVeth': "Bel'Veth",
  'Belveth': "Bel'Veth",
  'KSante': "K'Sante",
  'Ksante': "K'Sante",
  'NunuWillump': 'Nunu & Willump',
  'RekSai': "Rek'Sai",
  'VelKoz': "Vel'Koz",
  'ChoGath': "Cho'Gath",
  'KhaZix': "Kha'Zix",
  'KaiSa': "Kai'Sa",
};

function formatChampionName(id) {
  if (!id) return id;
  return CHAMPION_NAME_MAP[id] || id;
}

const KUYRUK_ADI = {
  420: 'Ranked Solo/Duo', 440: 'Ranked Flex', 400: 'Normal Draft',
  430: 'Normal Blind', 450: 'ARAM', 700: 'Clash', 490: 'Quickplay',
  0: 'Custom'
};

async function getChampIdMap() {
  const cached = cache.get('champIdMap');
  if (cached) return cached;
  const r = await axios.get(`${DDRAGON}/data/tr_TR/champion.json`);
  const champIdMap = {};
  for (const champ of Object.values(r.data.data)) {
    champIdMap[parseInt(champ.key)] = champ.id;
  }
  cache.set('champIdMap', champIdMap, 3600);
  return champIdMap;
}

async function getSpellIdMap() {
  const cached = cache.get('spellIdMap');
  if (cached) return cached;
  const r = await axios.get(`${DDRAGON}/data/tr_TR/summoner.json`);
  const spellIdMap = {};
  for (const spell of Object.values(r.data.data)) {
    spellIdMap[parseInt(spell.key)] = spell.id;
  }
  cache.set('spellIdMap', spellIdMap, 3600);
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
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0b0e14; color: #c8d0e0; font-family: 'Inter', 'Segoe UI', sans-serif; min-height: 100vh; }
    .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(11,14,20,0.95); border-bottom: 1px solid #1c2530; backdrop-filter: blur(12px); padding: 0 40px; height: 58px; display: flex; align-items: center; gap: 20px; }
    .logo { font-size: 17px; font-weight: 700; letter-spacing: 2px; color: #e2e8f0; text-decoration: none; display: flex; align-items: center; gap: 0; font-family: 'Cinzel', serif; }
    .logo img { width: 30px; height: 30px; border-radius: 8px; object-fit: cover; margin-right: 10px; }
    .logo span { color: #4f8ef7; letter-spacing: 0; margin-left: -2px; }
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
  <title>LolStats — LoL İstatistikleri</title>
  <style>
    ${NAV_CSS}
    body { background: #070C14; }
    #particles-canvas { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
    .nav { z-index: 100; background: rgba(7,12,20,0.96); border-bottom: 1px solid #1a2230; }
    .logo span { color: #C89B3C; letter-spacing: 0; margin-left: -2px; }

    .hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 90px 20px 70px; position: relative; z-index: 1; }
    .hero-glow { position: absolute; top: 38%; left: 50%; transform: translate(-50%, -50%); width: 780px; height: 420px; background: radial-gradient(ellipse, rgba(200,155,60,0.055) 0%, rgba(79,195,247,0.025) 55%, transparent 72%); pointer-events: none; }

    .hero-badge { font-size: 10px; font-weight: 600; letter-spacing: 3px; color: #C89B3C; text-transform: uppercase; margin-bottom: 28px; background: rgba(200,155,60,0.07); border: 1px solid rgba(200,155,60,0.22); padding: 6px 20px; border-radius: 20px; }

    .hero-title { font-size: 68px; font-weight: 900; text-align: center; line-height: 1.05; margin-bottom: 18px; font-family: 'Cinzel', serif; letter-spacing: 2px; background: linear-gradient(160deg, #ede0be 0%, #C89B3C 45%, #9a7228 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .hero-title .accent { background: linear-gradient(160deg, #a8dff5 0%, #4FC3F7 50%, #1e9fd4 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

    .hero-sub { font-size: 15px; color: #3a4a5c; text-align: center; margin-bottom: 48px; max-width: 460px; line-height: 1.85; }

    .search-container { width: 100%; max-width: 640px; margin-bottom: 24px; }
    .search-wrap { display: flex; border-radius: 14px; overflow: hidden; border: 1px solid #182030; background: #0b1522; transition: border-color .3s, box-shadow .3s; }
    .search-wrap.glow { border-color: rgba(200,155,60,0.48); box-shadow: 0 0 0 3px rgba(200,155,60,0.07), 0 0 28px rgba(200,155,60,0.1); }
    .region-sel { background: #080f1a; border: none; border-right: 1px solid #182030; color: #C89B3C; font-size: 12px; font-weight: 700; padding: 0 20px; height: 64px; outline: none; cursor: pointer; font-family: inherit; letter-spacing: 1px; min-width: 82px; }
    .region-sel option { background: #0b1522; color: #c8d0e0; }
    .search-input { flex: 1; background: transparent; border: none; color: #dde4ef; font-size: 16px; padding: 0 20px; height: 64px; outline: none; font-family: inherit; }
    .search-input::placeholder { color: #1c2a3a; }
    .search-btn { background: linear-gradient(135deg, #C89B3C 0%, #9a7228 100%); border: none; color: #070C14; font-size: 11px; font-weight: 800; padding: 0 34px; height: 64px; cursor: pointer; font-family: 'Cinzel', serif; letter-spacing: 2px; transition: opacity .15s, transform .1s; flex-shrink: 0; }
    .search-btn:hover { opacity: .85; }
    .search-btn:active { transform: scale(.97); }

    .recent-section { width: 100%; max-width: 640px; margin-bottom: 64px; min-height: 38px; }
    .recent-label { font-size: 10px; letter-spacing: 2.5px; color: #243040; text-transform: uppercase; font-weight: 600; margin-bottom: 10px; }
    .recent-list { display: flex; gap: 8px; flex-wrap: wrap; }
    .recent-chip { display: flex; align-items: center; gap: 8px; background: #0b1522; border: 1px solid #182030; border-radius: 8px; padding: 7px 14px; cursor: pointer; transition: border-color .15s, background .15s; text-decoration: none; }
    .recent-chip:hover { border-color: rgba(200,155,60,0.32); background: #0f1d2e; }
    .recent-chip-region { font-size: 9px; font-weight: 700; letter-spacing: 1px; color: #C89B3C; background: rgba(200,155,60,0.09); padding: 2px 7px; border-radius: 4px; }
    .recent-chip-name { font-size: 12px; font-weight: 600; color: #7a8899; }
    .recent-chip-tag { color: #2a3a4a; }

    .features { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; max-width: 920px; width: 100%; }
    .feature { background: linear-gradient(160deg, #0e1828 0%, #090f1c 100%); border: 1px solid #192230; border-radius: 18px; padding: 34px 28px 28px; transition: transform .22s, box-shadow .22s, border-color .22s; cursor: default; position: relative; overflow: hidden; }
    .feature::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent 0%, #C89B3C 50%, transparent 100%); opacity: .55; transition: opacity .22s; }
    .feature:hover { transform: translateY(-6px); box-shadow: 0 16px 48px rgba(0,0,0,0.5), 0 0 24px rgba(200,155,60,0.06); border-color: rgba(200,155,60,0.18); }
    .feature:hover::before { opacity: 1; }
    .feature-icon { width: 54px; height: 54px; border-radius: 14px; background: rgba(200,155,60,0.07); border: 1px solid rgba(200,155,60,0.14); display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 22px; }
    .feature-title { font-size: 15px; font-weight: 700; color: #d8c9a4; margin-bottom: 10px; font-family: 'Cinzel', serif; letter-spacing: .5px; }
    .feature-desc { font-size: 13px; color: #2e3d50; line-height: 1.8; }
    .feature-tag { display: inline-block; margin-top: 18px; font-size: 9px; font-weight: 700; letter-spacing: 1.8px; color: #C89B3C; opacity: .5; text-transform: uppercase; }

    .footer { text-align: center; padding: 28px; font-size: 11px; color: #0f1c28; border-top: 1px solid #0a1018; position: relative; z-index: 1; }
  </style>
</head>
<body>
  <canvas id="particles-canvas"></canvas>
  <nav class="nav">
    <a class="logo" href="/"><img src="https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/TahmKench.png" alt="Tahm Kench">LOLSTATS<span>.LOL</span></a>
    <div class="nav-links">
      <a href="/search">Profil Ara</a><a href="/champions">Şampiyonlar</a><a href="/leaderboard">Sıralama</a>
    </div>
  </nav>
  <div class="hero">
    <div class="hero-glow"></div>
    <div class="hero-badge">League of Legends Tracker</div>
    <h1 class="hero-title">Oyununu<br><span class="accent">Analiz Et</span></h1>
    <p class="hero-sub">Maç geçmişin, rank bilgin ve şampiyon istatistiklerin tek bir yerde.</p>
    <div class="search-container">
      <div class="search-wrap" id="searchWrap">
        <select class="region-sel" id="bolge">
          <option value="tr">TR</option>
          <option value="euw">EUW</option>
          <option value="na">NA</option>
          <option value="kr">KR</option>
          <option value="eune">EUNE</option>
        </select>
        <input class="search-input" id="arama" placeholder="Oyuncu adı #TR1" autocomplete="off" />
        <button class="search-btn" onclick="ara()">ARA</button>
      </div>
    </div>
    <div class="recent-section" id="recentSection"></div>
    <div class="features">
      <div class="feature">
        <div class="feature-icon">⚔️</div>
        <div class="feature-title">Maç Geçmişi</div>
        <div class="feature-desc">Son maçlarını detaylı KDA, şampiyon performansı, item build ve süre bilgileriyle incele.</div>
        <div class="feature-tag">Son 20 Maç</div>
      </div>
      <div class="feature">
        <div class="feature-icon">🏆</div>
        <div class="feature-title">Rank Bilgisi</div>
        <div class="feature-desc">Solo/Duo ve Flex sıralamalarını, LP kazanç/kayıplarını ve sezon istatistiklerini takip et.</div>
        <div class="feature-tag">Solo · Flex</div>
      </div>
      <div class="feature">
        <div class="feature-icon">🎯</div>
        <div class="feature-title">Şampiyon Analizi</div>
        <div class="feature-desc">En çok oynadığın şampiyonlarda kazanma oranını, ortalama KDA ve CS istatistiklerini gör.</div>
        <div class="feature-tag">Top 5 Şampiyon</div>
      </div>
    </div>
  </div>
  <div class="footer">LolStats, Riot Games ile bağlantılı değildir.</div>
  <script>
    // Particle system
    (function () {
      const canvas = document.getElementById('particles-canvas');
      const ctx = canvas.getContext('2d');
      let W, H, particles = [];

      function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
      function rand(a, b) { return Math.random() * (b - a) + a; }

      function newParticle(randomY) {
        return {
          x: rand(0, W || window.innerWidth),
          y: randomY ? rand(0, H || window.innerHeight) : (H || window.innerHeight) + rand(5, 20),
          r: rand(0.8, 2.4),
          vy: rand(0.25, 0.75),
          vx: rand(-0.12, 0.12),
          alpha: rand(0.1, 0.5),
          fadeDir: Math.random() > 0.5 ? 1 : -1,
          fadeSpeed: rand(0.002, 0.006)
        };
      }

      function init() {
        particles = [];
        const n = Math.floor(W * H / 12000);
        for (let i = 0; i < n; i++) particles.push(newParticle(true));
      }

      function frame() {
        ctx.clearRect(0, 0, W, H);
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(200,155,60,' + p.alpha.toFixed(3) + ')';
          ctx.fill();
          p.y -= p.vy;
          p.x += p.vx;
          p.alpha += p.fadeDir * p.fadeSpeed;
          if (p.alpha > 0.52 || p.alpha < 0.07) p.fadeDir *= -1;
          if (p.y < -8) particles[i] = newParticle(false);
        }
        requestAnimationFrame(frame);
      }

      window.addEventListener('resize', () => { resize(); init(); });
      resize(); init(); frame();
    })();

    // Search glow on input
    const searchWrap = document.getElementById('searchWrap');
    document.getElementById('arama').addEventListener('input', function () {
      searchWrap.classList.toggle('glow', this.value.length > 0);
    });

    // Recently searched
    const RECENT_KEY = 'lolstats_recent_v1';
    function getRecent() { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; } }
    function saveRecent(bolge, isim, tag) {
      const list = getRecent().filter(r => !(r.b === bolge && r.i.toLowerCase() === isim.toLowerCase() && r.t.toLowerCase() === tag.toLowerCase()));
      list.unshift({ b: bolge, i: isim, t: tag });
      localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 5)));
    }
    function renderRecent() {
      const list = getRecent();
      const sec = document.getElementById('recentSection');
      if (!list.length) { sec.innerHTML = ''; return; }
      sec.innerHTML = '<div class="recent-label">Son Aramalar</div><div class="recent-list">' +
        list.map(r =>
          '<a class="recent-chip" href="/oyuncu/' + r.b + '/' + encodeURIComponent(r.i) + '/' + r.t + '">' +
          '<span class="recent-chip-region">' + r.b.toUpperCase() + '</span>' +
          '<span class="recent-chip-name">' + r.i + '<span class="recent-chip-tag">#' + r.t + '</span></span>' +
          '</a>'
        ).join('') + '</div>';
    }
    renderRecent();

    // Search
    function ara() {
      const girdi = document.getElementById('arama').value.trim();
      const bolge = document.getElementById('bolge').value;
      if (!girdi.includes('#')) { alert('Lütfen #TAG formatında gir. Örnek: Duloxetine#RO34'); return; }
      const [isim, ...tagParts] = girdi.split('#');
      const tag = tagParts.join('#');
      saveRecent(bolge, isim, tag);
      window.location.href = '/oyuncu/' + bolge + '/' + encodeURIComponent(isim) + '/' + tag;
    }
    document.getElementById('arama').addEventListener('keypress', function (e) { if (e.key === 'Enter') ara(); });
  </script>
</body>
</html>
  `);
});

app.get('/oyuncu/:bolge/:isim/:tag', async (req, res) => {
  const { bolge, isim, tag } = req.params;
  const cacheKey = `${bolge}-${isim}-${tag}`;
  const cachedHtml = cache.get(cacheKey);
  if (cachedHtml) {
    return res.send(cachedHtml);
  }

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

    const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${hesap.data.gameName} — LolStats</title>
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
    .profil-name { font-size: 24px; font-weight: 700; color: #e2e8f0; letter-spacing: .5px; font-family: 'Cinzel', serif; }
    .profil-tag { font-size: 14px; color: #4a5568; margin-top: 3px; font-weight: 500; }
    .profil-bolge { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; background: rgba(79,142,247,0.1); color: #4f8ef7; border: 1px solid rgba(79,142,247,0.2); padding: 3px 10px; border-radius: 20px; margin-top: 10px; display: inline-block; }

    /* Rank cards */
    .rank-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 10px; }
    .rank-card { background: #131920; border: 1px solid #1c2530; border-radius: 14px; padding: 20px 22px; }
    .rank-card.rank-empty { opacity: .6; }
    .rank-tip { font-size: 10px; color: #4a5568; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; margin-bottom: 10px; }
    .rank-tier { font-size: 22px; font-weight: 700; margin-bottom: 4px; letter-spacing: 1px; font-family: 'Cinzel', serif; }
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
    <a class="logo" href="/"><img src="https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/TahmKench.png" alt="Tahm Kench">LOLSTATS<span>.LOL</span></a>
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
      <div class="champ-nm">${formatChampionName(m.champion)}</div>
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
    `;
    cache.set(cacheKey, html);
    res.send(html);

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
  <title>Canlı Oyun — ${oyuncuAdi} — LolStats</title>
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
    <a class="logo" href="/"><img src="https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/TahmKench.png" alt="Tahm Kench">LOLSTATS<span>.LOL</span></a>
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
              <div class="p-champ-sub">${formatChampionName(p.championName)}</div>
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
  <title>Maç Detayı — LolStats</title>
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
    <a class="logo" href="/"><img src="https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/TahmKench.png" alt="Tahm Kench">LOLSTATS<span>.LOL</span></a>
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
          <div class="mac-kda-sub">${formatChampionName(benimOyuncu.championName)} · ${benimOyuncu.deaths === 0 ? 'Perfect KDA' : (((benimOyuncu.kills + benimOyuncu.assists) / benimOyuncu.deaths).toFixed(2) + ' KDA')}</div>
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

// ── /search ───────────────────────────────────────────────────────────────────
app.get('/search', async (req, res) => {
  const FIXED_CHAMPS = ['Leona', 'MissFortune', 'TahmKench', 'Tristana', 'Senna'];
  let slideshowChamps = [...FIXED_CHAMPS];
  try {
    const champList = await axios.get(`${DDRAGON}/data/tr_TR/champion.json`);
    const all = Object.keys(champList.data.data).filter(c => !FIXED_CHAMPS.includes(c));
    const shuffled = all.sort(() => Math.random() - 0.5).slice(0, 5);
    slideshowChamps = [...FIXED_CHAMPS, ...shuffled].sort(() => Math.random() - 0.5);
  } catch (_) { /* keep fixed 5 on error */ }

  res.send(`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Profil Ara — LolStats</title>
  <style>
    ${NAV_CSS}
    body { background: #070C14; }
    .logo span { color: #C89B3C; letter-spacing: 0; margin-left: -2px; }
    .nav { background: rgba(7,12,20,0.96); border-bottom: 1px solid #1a2230; }
    .slideshow-bg { position: fixed; inset: 0; z-index: 1; overflow: hidden; background: #070C14; }
    .slide { position: absolute; inset: 0; opacity: 0; transition: opacity 1.5s ease-in-out; display: flex; align-items: center; justify-content: center; background: #070C14; }
    .slide.active { opacity: 1; }
    .slide-img { max-width: 60%; max-height: 100%; width: auto; height: auto; object-fit: contain; display: block; }
    .slideshow-overlay { position: fixed; inset: 0; z-index: 2; background: rgba(0,0,0,0.6); pointer-events: none; }
    .page-wrap { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 90px 20px 60px; position: relative; z-index: 3; }
    .page-title { font-size: 42px; font-weight: 900; font-family: 'Cinzel', serif; letter-spacing: 2px; background: linear-gradient(160deg, #ede0be 0%, #C89B3C 45%, #9a7228 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 12px; text-align: center; }
    .page-sub { font-size: 14px; color: #3a4a5c; margin-bottom: 36px; text-align: center; }
    .search-container { width: 100%; max-width: 640px; margin-bottom: 24px; }
    .search-wrap { display: flex; border-radius: 14px; overflow: hidden; border: 1px solid #182030; background: #0b1522; transition: border-color .3s, box-shadow .3s; }
    .search-wrap.glow { border-color: rgba(200,155,60,0.48); box-shadow: 0 0 0 3px rgba(200,155,60,0.07), 0 0 28px rgba(200,155,60,0.1); }
    .region-sel { background: #080f1a; border: none; border-right: 1px solid #182030; color: #C89B3C; font-size: 12px; font-weight: 700; padding: 0 20px; height: 64px; outline: none; cursor: pointer; font-family: inherit; letter-spacing: 1px; min-width: 82px; }
    .region-sel option { background: #0b1522; color: #c8d0e0; }
    .search-input { flex: 1; background: transparent; border: none; color: #dde4ef; font-size: 16px; padding: 0 20px; height: 64px; outline: none; font-family: inherit; }
    .search-input::placeholder { color: #1c2a3a; }
    .search-btn { background: linear-gradient(135deg, #C89B3C 0%, #9a7228 100%); border: none; color: #070C14; font-size: 11px; font-weight: 800; padding: 0 34px; height: 64px; cursor: pointer; font-family: 'Cinzel', serif; letter-spacing: 2px; transition: opacity .15s, transform .1s; flex-shrink: 0; }
    .search-btn:hover { opacity: .85; }
    .search-btn:active { transform: scale(.97); }
    .recent-section { width: 100%; max-width: 640px; min-height: 38px; }
    .recent-label { font-size: 10px; letter-spacing: 2.5px; color: #243040; text-transform: uppercase; font-weight: 600; margin-bottom: 10px; }
    .recent-list { display: flex; gap: 8px; flex-wrap: wrap; }
    .recent-chip { display: flex; align-items: center; gap: 8px; background: #0b1522; border: 1px solid #182030; border-radius: 8px; padding: 7px 14px; cursor: pointer; transition: border-color .15s, background .15s; text-decoration: none; }
    .recent-chip:hover { border-color: rgba(200,155,60,0.32); background: #0f1d2e; }
    .recent-chip-region { font-size: 9px; font-weight: 700; letter-spacing: 1px; color: #C89B3C; background: rgba(200,155,60,0.09); padding: 2px 7px; border-radius: 4px; }
    .recent-chip-name { font-size: 12px; font-weight: 600; color: #7a8899; }
    .recent-chip-tag { color: #2a3a4a; }
  </style>
</head>
<body>
  <div class="slideshow-bg" id="slideshowBg">
    ${slideshowChamps.map(c => `<div class="slide"><img class="slide-img" src="https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${c}_0.jpg" alt="${c}"/></div>`).join('\n    ')}
  </div>
  <div class="slideshow-overlay"></div>
  <nav class="nav">
    <a class="logo" href="/"><img src="${DDRAGON}/img/champion/TahmKench.png" alt="Tahm Kench">LOLSTATS<span>.LOL</span></a>
    <div class="nav-links">
      <a href="/search" style="color:#C89B3C">Profil Ara</a>
      <a href="/champions">Şampiyonlar</a>
      <a href="/leaderboard">Sıralama</a>
    </div>
    <div class="nav-right">
      <a href="/" style="font-size:13px;color:#4a5568;text-decoration:none;transition:color .15s" onmouseover="this.style.color='#c8d0e0'" onmouseout="this.style.color='#4a5568'">← Ana Sayfa</a>
    </div>
  </nav>
  <div class="page-wrap">
    <div class="page-title">Profil Ara</div>
    <p class="page-sub">Oyuncu adı ve etiketini girerek profil sayfasına ulaş.</p>
    <div class="search-container">
      <div class="search-wrap" id="searchWrap">
        <select class="region-sel" id="bolge">
          <option value="tr">TR</option>
          <option value="euw">EUW</option>
          <option value="na">NA</option>
          <option value="kr">KR</option>
          <option value="eune">EUNE</option>
        </select>
        <input class="search-input" id="arama" placeholder="Oyuncu adı #TR1" autocomplete="off" />
        <button class="search-btn" onclick="ara()">ARA</button>
      </div>
    </div>
    <div class="recent-section" id="recentSection"></div>
  </div>
  <script>
    const searchWrap = document.getElementById('searchWrap');
    document.getElementById('arama').addEventListener('input', function () {
      searchWrap.classList.toggle('glow', this.value.length > 0);
    });
    const RECENT_KEY = 'lolstats_recent_v1';
    function getRecent() { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch { return []; } }
    function saveRecent(bolge, isim, tag) {
      const list = getRecent().filter(r => !(r.b === bolge && r.i.toLowerCase() === isim.toLowerCase() && r.t.toLowerCase() === tag.toLowerCase()));
      list.unshift({ b: bolge, i: isim, t: tag });
      localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 5)));
    }
    function renderRecent() {
      const list = getRecent();
      const sec = document.getElementById('recentSection');
      if (!list.length) { sec.innerHTML = ''; return; }
      sec.innerHTML = '<div class="recent-label">Son Aramalar</div><div class="recent-list">' +
        list.map(r =>
          '<a class="recent-chip" href="/oyuncu/' + r.b + '/' + encodeURIComponent(r.i) + '/' + r.t + '">' +
          '<span class="recent-chip-region">' + r.b.toUpperCase() + '</span>' +
          '<span class="recent-chip-name">' + r.i + '<span class="recent-chip-tag">#' + r.t + '</span></span>' +
          '</a>'
        ).join('') + '</div>';
    }
    renderRecent();
    function ara() {
      const girdi = document.getElementById('arama').value.trim();
      const bolge = document.getElementById('bolge').value;
      if (!girdi.includes('#')) { alert('Lütfen #TAG formatında gir. Örnek: Duloxetine#RO34'); return; }
      const [isim, ...tagParts] = girdi.split('#');
      const tag = tagParts.join('#');
      saveRecent(bolge, isim, tag);
      window.location.href = '/oyuncu/' + bolge + '/' + encodeURIComponent(isim) + '/' + tag;
    }
    document.getElementById('arama').addEventListener('keypress', function (e) { if (e.key === 'Enter') ara(); });
    (function() {
      const slides = document.querySelectorAll('#slideshowBg .slide');
      if (!slides.length) return;
      let current = 0;
      slides[0].classList.add('active');
      setInterval(function() {
        slides[current].classList.remove('active');
        current = (current + 1) % slides.length;
        slides[current].classList.add('active');
      }, 4000);
    })();
  </script>
</body>
</html>`);
});

// ── /champions ────────────────────────────────────────────────────────────────
app.get('/champions', async (req, res) => {
  try {
    const r = await axios.get(`${DDRAGON}/data/tr_TR/champion.json`);
    const champions = Object.values(r.data.data).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    res.send(`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Şampiyonlar — LolStats</title>
  <style>
    ${NAV_CSS}
    body { background: #070C14; }
    .logo span { color: #C89B3C; letter-spacing: 0; margin-left: -2px; }
    .nav { background: rgba(7,12,20,0.96); border-bottom: 1px solid #1a2230; }
    .container { max-width: 1200px; margin: 0 auto; padding: 80px 24px 60px; }
    .page-title { font-size: 32px; font-weight: 900; font-family: 'Cinzel', serif; letter-spacing: 2px; background: linear-gradient(160deg, #ede0be 0%, #C89B3C 45%, #9a7228 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 6px; }
    .page-sub { font-size: 13px; color: #3a4a5c; margin-bottom: 20px; }
    .toolbar { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .filter-input { flex: 1; max-width: 340px; background: #0b1522; border: 1px solid #182030; border-radius: 10px; color: #dde4ef; font-size: 14px; padding: 10px 16px; outline: none; font-family: inherit; transition: border-color .2s; }
    .filter-input:focus { border-color: rgba(200,155,60,0.4); }
    .filter-input::placeholder { color: #2a3a4a; }
    .champ-count { font-size: 12px; color: #3a4a5c; }
    .champ-count span { color: #C89B3C; font-weight: 700; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 10px; }
    .champ-card { background: #0e1624; border: 1px solid #182030; border-radius: 12px; padding: 14px 8px 10px; text-align: center; text-decoration: none; transition: border-color .15s, transform .15s, background .15s; display: block; }
    .champ-card:hover { border-color: rgba(200,155,60,0.4); background: #141e2e; transform: translateY(-3px); }
    .champ-card img { width: 64px; height: 64px; border-radius: 10px; border: 2px solid #182030; object-fit: cover; margin-bottom: 8px; transition: border-color .15s; display: block; margin-left: auto; margin-right: auto; }
    .champ-card:hover img { border-color: rgba(200,155,60,0.4); }
    .champ-name { font-size: 11px; font-weight: 700; color: #8b97ad; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .no-results { text-align: center; padding: 60px 20px; color: #3a4a5c; font-size: 15px; display: none; }
  </style>
</head>
<body>
  <nav class="nav">
    <a class="logo" href="/"><img src="${DDRAGON}/img/champion/TahmKench.png" alt="Tahm Kench">LOLSTATS<span>.LOL</span></a>
    <div class="nav-links">
      <a href="/search">Profil Ara</a>
      <a href="/champions" style="color:#C89B3C">Şampiyonlar</a>
      <a href="/leaderboard">Sıralama</a>
    </div>
  </nav>
  <div class="container">
    <div class="page-title">Şampiyonlar</div>
    <div class="page-sub">Tüm League of Legends şampiyonları</div>
    <div class="toolbar">
      <input class="filter-input" id="filterInput" placeholder="Şampiyon ara..." autocomplete="off" oninput="filterChamps(this.value)" />
      <div class="champ-count">Toplam <span id="count">${champions.length}</span> şampiyon</div>
    </div>
    <div class="grid" id="grid">
      ${champions.map(c => `<a class="champ-card" href="/champions/${encodeURIComponent(c.id)}" data-name="${c.name.toLowerCase()} ${c.id.toLowerCase()}">
        <img src="${DDRAGON}/img/champion/${c.id}.png" alt="${c.name}" loading="lazy" onerror="this.style.opacity='.3'"/>
        <div class="champ-name">${c.name}</div>
      </a>`).join('')}
    </div>
    <div class="no-results" id="noResults">Şampiyon bulunamadı.</div>
  </div>
  <script>
    function filterChamps(q) {
      const cards = document.querySelectorAll('.champ-card');
      const query = q.toLowerCase().trim();
      let visible = 0;
      cards.forEach(card => {
        const show = !query || card.dataset.name.includes(query);
        card.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      document.getElementById('count').textContent = visible;
      document.getElementById('noResults').style.display = visible === 0 ? 'block' : 'none';
    }
  </script>
</body>
</html>`);
  } catch (e) {
    res.status(500).send(`<!DOCTYPE html><html><body style="background:#070C14;color:#ff4655;display:flex;align-items:center;justify-content:center;height:100vh;font-family:Inter,sans-serif">Şampiyonlar yüklenirken hata oluştu.</body></html>`);
  }
});

// ── /champions/:championName ───────────────────────────────────────────────────
app.get('/champions/:championName', async (req, res) => {
  const { championName } = req.params;
  const region = (req.query.region || 'euw').toLowerCase();
  const { sunucu, routing } = BOLGE_MAP[region] || BOLGE_MAP.euw;
  const API_KEY = process.env.RIOT_API_KEY;
  const SPELL_KEYS = ['Q', 'W', 'E', 'R'];

  try {
    const champResp = await axios.get(`${DDRAGON}/data/tr_TR/champion/${championName}.json`);
    const champ = champResp.data.data[championName];
    if (!champ) {
      return res.status(404).send(`<!DOCTYPE html><html><body style="background:#070C14;color:#ff4655;display:flex;align-items:center;justify-content:center;height:100vh;font-family:Inter,sans-serif">Şampiyon bulunamadı: ${championName}</body></html>`);
    }

    let recentMatches = [];
    try {
      const chalResp = await axios.get(
        `https://${sunucu}.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5`,
        { headers: { 'X-Riot-Token': API_KEY } }
      );
      const top5 = chalResp.data.entries.sort((a, b) => b.leaguePoints - a.leaguePoints).slice(0, 5);
      const puuids = (await Promise.all(
        top5.map(async p => {
          try {
            const r = await axios.get(`https://${sunucu}.api.riotgames.com/lol/summoner/v4/summoners/${p.summonerId}`, { headers: { 'X-Riot-Token': API_KEY } });
            return r.data.puuid;
          } catch { return null; }
        })
      )).filter(Boolean);

      const allMatchIds = [...new Set((await Promise.all(
        puuids.map(async puuid => {
          try {
            const r = await axios.get(`https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&count=5`, { headers: { 'X-Riot-Token': API_KEY } });
            return r.data;
          } catch { return []; }
        })
      )).flat())].slice(0, 20);

      const details = (await Promise.all(
        allMatchIds.map(async id => {
          try {
            const r = await axios.get(`https://${routing}.api.riotgames.com/lol/match/v5/matches/${id}`, { headers: { 'X-Riot-Token': API_KEY } });
            return r.data;
          } catch { return null; }
        })
      )).filter(Boolean);

      recentMatches = details
        .filter(m => m.info.participants.some(p => p.championName === championName))
        .slice(0, 5)
        .map(m => {
          const player = m.info.participants.find(p => p.championName === championName);
          const items = [player.item0, player.item1, player.item2, player.item3, player.item4, player.item5, player.item6].filter(id => id && id !== 0);
          const kda = player.deaths === 0 ? 'Perfect' : ((player.kills + player.assists) / player.deaths).toFixed(2);
          return {
            playerName: player.riotIdGameName || player.summonerName || '—',
            win: player.win, kills: player.kills, deaths: player.deaths, assists: player.assists,
            kda, items,
            cs: player.totalMinionsKilled + player.neutralMinionsKilled,
            duration: Math.floor(m.info.gameDuration / 60) + ':' + String(m.info.gameDuration % 60).padStart(2, '0')
          };
        });
    } catch (e) { recentMatches = []; }

    const splashUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championName}_0.jpg`;
    const stripTags = s => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const escapeAttr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    res.send(`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${champ.name} — LolStats</title>
  <style>
    ${NAV_CSS}
    body { background: #070C14; }
    .logo span { color: #C89B3C; letter-spacing: 0; margin-left: -2px; }
    .nav { background: rgba(7,12,20,0.96); border-bottom: 1px solid #1a2230; }
    .splash-wrap { position: relative; height: 440px; overflow: hidden; margin-top: 58px; }
    .splash-img { width: 100%; height: 100%; object-fit: cover; object-position: center 20%; display: block; }
    .splash-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(7,12,20,0.15) 0%, rgba(7,12,20,0.5) 55%, #070C14 100%); }
    .splash-info { position: absolute; bottom: 36px; left: 50%; transform: translateX(-50%); text-align: center; width: 100%; padding: 0 24px; }
    .champ-title-sub { font-size: 12px; letter-spacing: 3px; color: #C89B3C; text-transform: uppercase; font-weight: 600; margin-bottom: 8px; }
    .champ-title-name { font-size: 56px; font-weight: 900; font-family: 'Cinzel', serif; letter-spacing: 3px; color: #e2e8f0; text-shadow: 0 2px 20px rgba(0,0,0,0.9); }
    .container { max-width: 960px; margin: 0 auto; padding: 0 24px 60px; }
    .section-hdr { font-size: 10px; color: #4a5568; text-transform: uppercase; letter-spacing: 2.5px; font-weight: 700; margin: 32px 0 14px; display: flex; align-items: center; gap: 16px; }
    .abilities-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
    .ability-card { background: #0e1624; border: 1px solid #182030; border-radius: 12px; padding: 14px 12px; text-align: center; transition: border-color .15s; cursor: pointer; }
    .ability-card:hover { border-color: rgba(200,155,60,0.35); }
    .ability-modal-overlay { display: none; position: fixed; inset: 0; background: rgba(7,12,20,0.85); z-index: 1000; align-items: center; justify-content: center; padding: 24px; }
    .ability-modal-overlay.open { display: flex; }
    .ability-modal { background: #0e1624; border: 1px solid rgba(200,155,60,0.4); border-radius: 16px; padding: 32px 28px; max-width: 480px; width: 100%; position: relative; }
    .ability-modal-close { position: absolute; top: 14px; right: 16px; background: none; border: none; color: #4a5568; font-size: 20px; cursor: pointer; line-height: 1; padding: 4px 8px; border-radius: 6px; transition: color .15s; }
    .ability-modal-close:hover { color: #c8d0e0; }
    .ability-modal-key { font-size: 9px; font-weight: 800; letter-spacing: 2px; color: #C89B3C; text-transform: uppercase; margin-bottom: 16px; }
    .ability-modal-icon { width: 64px; height: 64px; border-radius: 12px; border: 2px solid rgba(200,155,60,0.4); margin: 0 auto 16px; display: block; }
    .ability-modal-name { font-size: 16px; font-weight: 700; color: #c8d0e0; margin-bottom: 12px; text-align: center; }
    .ability-modal-desc { font-size: 13px; color: #8b97ad; line-height: 1.7; text-align: left; max-height: 280px; overflow-y: auto; }
    .ability-key { font-size: 9px; font-weight: 800; letter-spacing: 2px; color: #C89B3C; text-transform: uppercase; margin-bottom: 8px; }
    .ability-img { width: 52px; height: 52px; border-radius: 10px; border: 2px solid #182030; margin: 0 auto 8px; display: block; }
    .ability-name { font-size: 11px; font-weight: 700; color: #c8d0e0; margin-bottom: 6px; }
    .ability-desc { font-size: 10px; color: #3a4a5c; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
    .region-btn { font-size: 11px; font-weight: 700; letter-spacing: 1px; padding: 5px 12px; border-radius: 6px; border: 1px solid #182030; background: #0e1624; color: #4a5568; text-decoration: none; transition: all .15s; }
    .region-btn:hover { border-color: rgba(200,155,60,0.35); color: #c8d0e0; }
    .region-btn.active { background: rgba(200,155,60,0.1); border-color: rgba(200,155,60,0.4); color: #C89B3C; }
    .region-btns { display: flex; gap: 6px; }
    .match-card { display: flex; align-items: center; gap: 14px; background: #0e1624; border: 1px solid #182030; border-radius: 12px; padding: 14px 18px; margin-bottom: 8px; border-left: 3px solid transparent; }
    .match-card.win { border-left-color: #00c896; background: #0c1a16; }
    .match-card.loss { border-left-color: #ff4655; background: #180c10; }
    .match-badge { font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 6px; flex-shrink: 0; min-width: 68px; text-align: center; }
    .match-card.win .match-badge { background: rgba(0,200,150,0.12); color: #00c896; }
    .match-card.loss .match-badge { background: rgba(255,70,85,0.12); color: #ff4655; }
    .match-player { font-size: 13px; font-weight: 700; color: #c8d0e0; min-width: 120px; }
    .match-kda { font-size: 12px; color: #8b97ad; font-weight: 600; min-width: 90px; }
    .match-items { display: flex; gap: 4px; flex-wrap: wrap; flex: 1; }
    .match-item { width: 28px; height: 28px; border-radius: 6px; border: 1px solid #182030; object-fit: cover; }
    .match-meta { font-size: 11px; color: #4a5568; text-align: right; white-space: nowrap; }
    .no-matches { background: #0e1624; border: 1px solid #182030; border-radius: 12px; padding: 40px; text-align: center; color: #3a4a5c; font-size: 13px; }
  </style>
</head>
<body>
  <nav class="nav">
    <a class="logo" href="/"><img src="${DDRAGON}/img/champion/TahmKench.png" alt="Tahm Kench">LOLSTATS<span>.LOL</span></a>
    <div class="nav-links">
      <a href="/search">Profil Ara</a>
      <a href="/champions" style="color:#C89B3C">Şampiyonlar</a>
      <a href="/leaderboard">Sıralama</a>
    </div>
    <div class="nav-right">
      <a href="/champions" style="font-size:13px;color:#4a5568;text-decoration:none;transition:color .15s" onmouseover="this.style.color='#c8d0e0'" onmouseout="this.style.color='#4a5568'">← Şampiyonlar</a>
    </div>
  </nav>
  <div class="splash-wrap">
    <img class="splash-img" src="${splashUrl}" alt="${champ.name}" onerror="this.style.background='#131920'"/>
    <div class="splash-overlay"></div>
    <div class="splash-info">
      <div class="champ-title-sub">${champ.title}</div>
      <div class="champ-title-name">${champ.name}</div>
    </div>
  </div>
  <div class="container">
    <div class="section-hdr">Yetenekler</div>
    <div class="abilities-grid">
      <div class="ability-card" onclick="openAbilityModal(this)" data-key="Pasif" data-name="${escapeAttr(champ.passive.name)}" data-img="${DDRAGON}/img/passive/${champ.passive.image.full}" data-desc="${escapeAttr(stripTags(champ.passive.description))}">
        <div class="ability-key">Pasif</div>
        <img class="ability-img" src="${DDRAGON}/img/passive/${champ.passive.image.full}" alt="${champ.passive.name}" onerror="this.style.background='#131920'"/>
        <div class="ability-name">${champ.passive.name}</div>
        <div class="ability-desc">${stripTags(champ.passive.description)}</div>
      </div>
      ${champ.spells.map((s, i) => `<div class="ability-card" onclick="openAbilityModal(this)" data-key="${SPELL_KEYS[i]}" data-name="${escapeAttr(s.name)}" data-img="${DDRAGON}/img/spell/${s.image.full}" data-desc="${escapeAttr(stripTags(s.description))}">
        <div class="ability-key">${SPELL_KEYS[i]}</div>
        <img class="ability-img" src="${DDRAGON}/img/spell/${s.image.full}" alt="${s.name}" onerror="this.style.background='#131920'"/>
        <div class="ability-name">${s.name}</div>
        <div class="ability-desc">${stripTags(s.description)}</div>
      </div>`).join('')}
    </div>

    <div class="section-hdr">
      <span>Son Yüksek Elo Maçlar</span>
      <div class="region-btns">
        ${['tr', 'euw', 'na', 'kr', 'eune'].map(r =>
          `<a class="region-btn ${r === region ? 'active' : ''}" href="/champions/${championName}?region=${r}">${r.toUpperCase()}</a>`
        ).join('')}
      </div>
    </div>

    ${recentMatches.length === 0
      ? `<div class="no-matches">Bu şampiyon için ${region.toUpperCase()} sunucusunda yüksek elo maçı bulunamadı.</div>`
      : recentMatches.map(m => `<div class="match-card ${m.win ? 'win' : 'loss'}">
        <div class="match-badge">${m.win ? 'KAZANDI' : 'KAYBETTİ'}</div>
        <div class="match-player">${m.playerName}</div>
        <div class="match-kda">${m.kills}/${m.deaths}/${m.assists} <span style="font-size:10px;color:#4a5568">${m.kda} KDA</span></div>
        <div class="match-items">
          ${m.items.map(id => `<img class="match-item" src="${DDRAGON}/img/item/${id}.png" alt="${id}" onerror="this.style.display='none'"/>`).join('')}
        </div>
        <div class="match-meta">${m.cs} CS<br/>${m.duration}</div>
      </div>`).join('')}
  </div>

  <div class="ability-modal-overlay" id="abilityModal" onclick="closeAbilityModal(event)">
    <div class="ability-modal">
      <button class="ability-modal-close" onclick="document.getElementById('abilityModal').classList.remove('open')">✕</button>
      <div class="ability-modal-key" id="modalKey"></div>
      <img class="ability-modal-icon" id="modalIcon" src="" alt=""/>
      <div class="ability-modal-name" id="modalName"></div>
      <div class="ability-modal-desc" id="modalDesc"></div>
    </div>
  </div>
  <script>
    function openAbilityModal(card) {
      document.getElementById('modalKey').textContent = card.dataset.key;
      document.getElementById('modalName').textContent = card.dataset.name;
      document.getElementById('modalDesc').textContent = card.dataset.desc;
      document.getElementById('modalIcon').src = card.dataset.img;
      document.getElementById('modalIcon').alt = card.dataset.name;
      document.getElementById('abilityModal').classList.add('open');
    }
    function closeAbilityModal(e) {
      if (e.target === document.getElementById('abilityModal')) {
        document.getElementById('abilityModal').classList.remove('open');
      }
    }
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') document.getElementById('abilityModal').classList.remove('open');
    });
  </script>
</body>
</html>`);
  } catch (e) {
    const msg = e.response ? `${e.response.status} — ${JSON.stringify(e.response.data)}` : e.message;
    res.status(500).send(`<!DOCTYPE html><html><body style="background:#070C14;color:#ff4655;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:Inter,sans-serif;gap:12px"><div style="font-size:20px">Hata Oluştu</div><div style="font-size:13px;color:#4a5568">${msg}</div><a href="/champions" style="color:#4FC3F7;font-size:13px">← Şampiyonlar</a></body></html>`);
  }
});

// ── /leaderboard ──────────────────────────────────────────────────────────────
app.get('/leaderboard', async (req, res) => {
  const region = (req.query.region || 'euw').toLowerCase();
  const { sunucu, routing } = BOLGE_MAP[region] || BOLGE_MAP.euw;
  const API_KEY = process.env.RIOT_API_KEY;
  const searchQuery = (req.query.q || '').trim();

  let top10 = [];
  let leagueName = '';
  let userRank = null;
  let userError = null;

  try {
    const leagueResp = await axios.get(
      `https://${sunucu}.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5`,
      { headers: { 'X-Riot-Token': API_KEY } }
    );
    leagueName = leagueResp.data.name || (region.toUpperCase() + ' Challenger');
    top10 = leagueResp.data.entries
      .sort((a, b) => b.leaguePoints - a.leaguePoints)
      .slice(0, 10)
      .map((e, i) => ({ ...e, pos: i + 1 }));
  } catch (e) { top10 = []; }

  if (searchQuery && searchQuery.includes('#')) {
    try {
      const [playerName, ...tagParts] = searchQuery.split('#');
      const playerTag = tagParts.join('#');
      const accountResp = await axios.get(
        `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(playerName)}/${encodeURIComponent(playerTag)}`,
        { headers: { 'X-Riot-Token': API_KEY } }
      );
      const puuid = accountResp.data.puuid;
      const rankResp = await axios.get(
        `https://${sunucu}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`,
        { headers: { 'X-Riot-Token': API_KEY } }
      );
      const soloEntry = rankResp.data.find(r => r.queueType === 'RANKED_SOLO_5x5');
      if (soloEntry) {
        userRank = {
          name: accountResp.data.gameName, tag: accountResp.data.tagLine,
          tier: soloEntry.tier, rank: soloEntry.rank,
          lp: soloEntry.leaguePoints, wins: soloEntry.wins, losses: soloEntry.losses,
          wr: Math.round((soloEntry.wins / (soloEntry.wins + soloEntry.losses)) * 100)
        };
      } else {
        userRank = { name: accountResp.data.gameName, tag: accountResp.data.tagLine, unranked: true };
      }
    } catch (e) {
      userError = 'Oyuncu bulunamadı. Doğru bölgeyi ve #TAG formatını kontrol et.';
    }
  }

  const wrColor = wr => wr >= 55 ? '#00c896' : wr < 45 ? '#ff4655' : '#f0b429';

  res.send(`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sıralama — LolStats</title>
  <style>
    ${NAV_CSS}
    body { background: #070C14; }
    .logo span { color: #C89B3C; letter-spacing: 0; margin-left: -2px; }
    .nav { background: rgba(7,12,20,0.96); border-bottom: 1px solid #1a2230; }
    .container { max-width: 900px; margin: 0 auto; padding: 80px 24px 60px; }
    .page-title { font-size: 32px; font-weight: 900; font-family: 'Cinzel', serif; letter-spacing: 2px; background: linear-gradient(160deg, #ede0be 0%, #C89B3C 45%, #9a7228 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 6px; }
    .page-sub { font-size: 13px; color: #3a4a5c; margin-bottom: 24px; }
    .region-tabs { display: flex; gap: 6px; margin-bottom: 24px; }
    .region-tab { font-size: 11px; font-weight: 700; letter-spacing: 1px; padding: 7px 16px; border-radius: 8px; border: 1px solid #182030; background: #0e1624; color: #4a5568; text-decoration: none; transition: all .15s; }
    .region-tab:hover { border-color: rgba(200,155,60,0.35); color: #c8d0e0; }
    .region-tab.active { background: rgba(200,155,60,0.1); border-color: rgba(200,155,60,0.4); color: #C89B3C; }
    .search-row { display: flex; gap: 10px; margin-bottom: 24px; }
    .player-input { flex: 1; max-width: 440px; background: #0b1522; border: 1px solid #182030; border-radius: 10px; color: #dde4ef; font-size: 14px; padding: 12px 16px; outline: none; font-family: inherit; transition: border-color .2s; }
    .player-input:focus { border-color: rgba(200,155,60,0.4); }
    .player-input::placeholder { color: #2a3a4a; }
    .search-btn2 { background: linear-gradient(135deg, #C89B3C 0%, #9a7228 100%); border: none; color: #070C14; font-size: 11px; font-weight: 800; padding: 0 24px; border-radius: 10px; cursor: pointer; font-family: 'Cinzel', serif; letter-spacing: 2px; transition: opacity .15s; }
    .search-btn2:hover { opacity: .85; }
    .user-card { background: #131920; border: 1px solid rgba(200,155,60,0.22); border-radius: 14px; padding: 20px 24px; margin-bottom: 24px; display: flex; align-items: center; gap: 20px; }
    .user-name { font-size: 18px; font-weight: 700; color: #e2e8f0; font-family: 'Cinzel', serif; }
    .user-tag { font-size: 13px; color: #4a5568; margin-top: 2px; }
    .user-tier { font-size: 22px; font-weight: 800; font-family: 'Cinzel', serif; margin-left: auto; }
    .user-details { text-align: right; }
    .user-lp { font-size: 13px; color: #8b97ad; }
    .user-wr { font-size: 11px; margin-top: 3px; font-weight: 600; }
    .user-unranked { font-size: 16px; color: #3a4a5c; margin-left: auto; font-weight: 700; }
    .user-error { background: rgba(255,70,85,0.08); border: 1px solid rgba(255,70,85,0.2); border-radius: 12px; padding: 14px 20px; color: #ff4655; font-size: 13px; margin-bottom: 20px; }
    .section-hdr { font-size: 10px; color: #4a5568; text-transform: uppercase; letter-spacing: 2.5px; font-weight: 700; margin-bottom: 12px; }
    .lb-wrap { border: 1px solid #182030; border-radius: 14px; overflow: hidden; }
    .lb-table { width: 100%; border-collapse: collapse; }
    .lb-table thead tr { background: #0b1220; }
    .lb-table th { padding: 10px 16px; font-size: 10px; font-weight: 700; color: #4a5568; text-transform: uppercase; letter-spacing: 1.5px; text-align: left; }
    .lb-table tbody tr { border-top: 1px solid #182030; background: #0e1624; transition: background .12s; }
    .lb-table tbody tr:hover { background: #111d2e; }
    .lb-table td { padding: 13px 16px; font-size: 13px; color: #c8d0e0; }
    .rank-num { font-size: 14px; font-weight: 800; color: #4a5568; }
    .rank-gold { color: #C89B3C; }
    .rank-silver { color: #94a3b8; }
    .rank-bronze { color: #cd7f32; }
    .player-cell { font-weight: 700; color: #e2e8f0; }
    .lp-cell { font-weight: 800; color: #C89B3C; }
    .wl-cell { color: #4a5568; font-size: 12px; }
    .wr-cell { font-weight: 700; }
    .empty-state { background: #0e1624; border: 1px solid #182030; border-radius: 12px; padding: 40px; text-align: center; color: #3a4a5c; font-size: 13px; }
  </style>
</head>
<body>
  <nav class="nav">
    <a class="logo" href="/"><img src="${DDRAGON}/img/champion/TahmKench.png" alt="Tahm Kench">LOLSTATS<span>.LOL</span></a>
    <div class="nav-links">
      <a href="/search">Profil Ara</a>
      <a href="/champions">Şampiyonlar</a>
      <a href="/leaderboard" style="color:#C89B3C">Sıralama</a>
    </div>
  </nav>
  <div class="container">
    <div class="page-title">Sıralama</div>
    <div class="page-sub">Sunucu liderlik tablosu ve oyuncu sıralama araması</div>

    <div class="region-tabs">
      ${['tr', 'euw', 'na', 'kr', 'eune'].map(r =>
        `<a class="region-tab ${r === region ? 'active' : ''}" href="/leaderboard?region=${r}">${r.toUpperCase()}</a>`
      ).join('')}
    </div>

    <form action="/leaderboard" method="get" style="display:contents">
      <input type="hidden" name="region" value="${region}">
      <div class="search-row">
        <input class="player-input" name="q" placeholder="Oyuncu adı #TR1" value="${searchQuery.replace(/"/g, '&quot;')}" autocomplete="off"/>
        <button type="submit" class="search-btn2">ARA</button>
      </div>
    </form>

    ${userError ? `<div class="user-error">${userError}</div>` : ''}

    ${userRank && !userRank.unranked ? `<div class="user-card">
      <div>
        <div class="user-name">${userRank.name}</div>
        <div class="user-tag">#${userRank.tag} · ${region.toUpperCase()}</div>
      </div>
      <div class="user-tier" style="color:${RANK_RENK[userRank.tier] || '#c8d0e0'}">${userRank.tier} ${userRank.rank}</div>
      <div class="user-details">
        <div class="user-lp">${userRank.lp} LP</div>
        <div class="user-wr" style="color:${wrColor(userRank.wr)}">${userRank.wr}% WR · ${userRank.wins}W ${userRank.losses}L</div>
      </div>
    </div>` : ''}

    ${userRank && userRank.unranked ? `<div class="user-card">
      <div>
        <div class="user-name">${userRank.name}</div>
        <div class="user-tag">#${userRank.tag} · ${region.toUpperCase()}</div>
      </div>
      <div class="user-unranked">Unranked</div>
    </div>` : ''}

    <div class="section-hdr">${leagueName || region.toUpperCase() + ' Challenger'} — Top 10</div>
    ${top10.length > 0 ? `<div class="lb-wrap">
      <table class="lb-table">
        <thead><tr><th>#</th><th>Oyuncu</th><th>LP</th><th>Maç</th><th>WR</th></tr></thead>
        <tbody>
          ${top10.map((e, i) => {
            const wr = Math.round((e.wins / (e.wins + e.losses)) * 100);
            const rankCls = i === 0 ? 'rank-gold' : i === 1 ? 'rank-silver' : i === 2 ? 'rank-bronze' : '';
            const wrCls = wr >= 55 ? 'wr-high' : wr < 45 ? 'wr-low' : 'wr-mid';
            return `<tr>
              <td><span class="rank-num ${rankCls}">${i + 1}</span></td>
              <td class="player-cell">${e.summonerName || '—'}</td>
              <td class="lp-cell">${e.leaguePoints.toLocaleString('tr-TR')} LP</td>
              <td class="wl-cell">${e.wins}W ${e.losses}L</td>
              <td class="wr-cell" style="color:${wrColor(wr)}">${wr}%</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>` : `<div class="empty-state">Liderlik tablosu yüklenemedi.</div>`}
  </div>
</body>
</html>`);
});

app.listen(PORT, () => {
  console.log(`LolStats ${PORT} portunda çalışıyor!`);
});
