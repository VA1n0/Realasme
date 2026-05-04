let playerChar = null;
let currentEnemy = null;
let playingNode = 1;
let isBossNode = false;
let isSurvivalMode = false;
let survivalWave = 1;
let SKILLS_DB = {};
let activePetForSkill = null;

const AVATARS = {
    'Некромант': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500',
    'Воїн': 'https://images.unsplash.com/photo-1605640840482-96947f6ff037?w=500',
    'Маг': 'https://images.unsplash.com/photo-1549488344-c78b4bdc7e14?w=500',
    'Асасин': 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=500'
};

const ACH_DB = [
    { id: "kills_50", name: "Кат", desc: "Вбити 50 ворогів" },
    { id: "boss_5", name: "Гроза Лордів", desc: "Вбити 5 Босів" }
];

function showPopup(t, tx, ty = "win", ic = "🏆") {
    const o = document.getElementById('custom-popup');
    const b = document.getElementById('popup-box');
    document.getElementById('popup-title').innerText = t;
    document.getElementById('popup-text').innerHTML = tx;
    document.getElementById('popup-icon').innerText = ic;
    b.className = `custom-popup-box popup-${ty}`;
    o.classList.add('show');
}

function closePopup() { 
    document.getElementById('custom-popup').classList.remove('show'); 
}

function toggleAuth(fId) {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('reg-form').classList.add('hidden');
    document.getElementById(fId).classList.remove('hidden');
}

async function authCall(ep, uF, eF, pF) {
    const p = { 
        email: document.getElementById(eF).value, 
        password: document.getElementById(pF).value 
    };
    if(uF) p.username = document.getElementById(uF).value;
    
    try {
        const r = await fetch(ep, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(p) 
        });
        const d = await r.json();
        if(r.ok) { 
            localStorage.setItem('rpg_token', d.token); 
            loadPlayerData(); 
        } else {
            showPopup("ПОМИЛКА", d.message, "loss", "❌");
        }
    } catch(err) {
        showPopup("ПОМИЛКА", "Сервер не відповідає", "loss", "❌");
    }
}

async function registerUser(e) { 
    e.preventDefault(); 
    authCall('/api/register', 'r-user', 'r-email', 'r-pass'); 
}

async function loginUser(e) { 
    e.preventDefault(); 
    authCall('/api/login', null, 'l-email', 'l-pass'); 
}

async function selectClass(cN) {
    const r = await fetch('/api/create_character', { 
        method: 'POST', 
        headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` 
        }, 
        body: JSON.stringify({ 
            name: document.getElementById('char-name').value, 
            class_name: cN 
        }) 
    });
    if(r.ok) loadPlayerData();
}

async function loadPlayerData() {
    const t = localStorage.getItem('rpg_token'); 
    if (!t) return;
    
    const r = await fetch('/api/me', { headers: { 'Authorization': `Bearer ${t}` } });
    const d = await r.json();
    
    if (d.status === "no_character") {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('class-screen').classList.remove('hidden');
        document.getElementById('char-name').value = d.username;
    } else if (d.status === "success") {
        playerChar = d.character; 
        SKILLS_DB = d.skills_db || {};
        
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('class-screen').classList.add('hidden');
        document.getElementById('battle-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');

        updateUI();
        renderMap();
        renderInventoryAndCraft();
        renderAchievements();
        generateShop('weapon');
    }
}

function updateUI() {
    document.getElementById('ui-name').innerText = playerChar.name;
    document.getElementById('ui-lvl').innerText = playerChar.level;
    document.getElementById('ui-gold').innerText = playerChar.gold;
    document.getElementById('ui-diamonds').innerText = playerChar.diamonds || 0;
    document.getElementById('ui-hp').innerText = `${playerChar.hp} / ${playerChar.max_hp}`;
    document.getElementById('ui-hp-bar').style.width = (playerChar.hp / playerChar.max_hp * 100) + '%';
    document.getElementById('ui-avatar').style.backgroundImage = `url('${AVATARS[playerChar.class_name] || AVATARS['Воїн']}')`;
    document.getElementById('survival-record').innerText = playerChar.survival_wave || 1;
}
function showTab(tN) {
    document.querySelectorAll('.tab-panel').forEach(t => t.classList.add('hidden'));
    document.getElementById('tab-' + tN).classList.remove('hidden');
}

function filterShopUI(type) {
    document.querySelectorAll('.shop-card').forEach(card => {
        card.style.display = (type === 'all' || card.dataset.type === type) ? 'flex' : 'none';
    });
}

function generateShop(category) {
    const container = document.getElementById('shop-items-container');
    if(category === 'eggs') {
        container.innerHTML = `<div class="rng-item shop-card" style="border-left: 4px solid #1eff00; width: 300px;" data-type="eggs"><div><strong>🥚 Звичайне Яйце</strong><br>1000 🪙</div><button onclick="buyEgg('basic')" class="btn-small bg-gold">Купити</button></div>`;
        return;
    }

    const rarityData = { "Common": { c: "#a0a0a0", m: 1.0, p: 100 }, "Uncommon": { c: "#1eff00", m: 1.8, p: 400 }, "Rare": { c: "#0070dd", m: 3.5, p: 1200 }, "Epic": { c: "#a335ee", m: 6.0, p: 4500 } };
    let h = ''; 
    let lvl = playerChar.level || 1;
    const bases = category === 'weapon' ? ["Меч", "Посох", "Кинджал"] : ["Нагрудник", "Мантія", "Броня"];

    Object.keys(rarityData).forEach(r => {
        let d = rarityData[r]; 
        let name = `${r} ${bases[Math.floor(Math.random()*3)]}`;
        let stat = Math.floor((lvl * 15) * d.m);
        h += `<div class="rng-item shop-card" style="border-left: 4px solid ${d.c}; width: 280px;" data-type="${category}"><div><strong style="color:${d.c};">${name}</strong><br>+${stat} ${category==='weapon'?'АТК':'ЗАХ'}</div><button onclick="buyShopItem('${name}', '${category}', '${r}', ${stat}, ${d.p})" class="btn-small bg-gold">Купити (${d.p})</button></div>`;
    });
    container.innerHTML = h;
}

async function buyShopItem(name, type, rarity, stat, price) {
    const equipNow = confirm(`Купити і одягнути "${name}"?`);
    const r = await fetch('/api/buy_shop_item', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` }, 
        body: JSON.stringify({ name, type, rarity, stat, price, equip_now: equipNow }) 
    });
    if(r.ok) { showPopup("УСПІХ", "Предмет ваш!", "loot", "🛒"); loadPlayerData(); }
}

async function claimAch(id) {
    const r = await fetch('/api/claim_achievement', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` }, 
        body: JSON.stringify({ id }) 
    });
    const d = await r.json();
    if(r.ok) { showPopup("БРАВО!", `+${d.reward} 💎`, "loot", "💎"); loadPlayerData(); }
}

function renderAchievements() {
    let h = '';
    ACH_DB.forEach(a => {
        const isDone = (playerChar.claimed_achievements || []).includes(a.id);
        h += `<div class="rng-item" style="justify-content:space-between; display:flex; align-items:center;"><div><strong>${a.name}</strong><br><small>${a.desc}</small></div><button class="btn-small ${isDone ? '' : 'bg-gold'}" onclick="claimAch('${a.id}')" ${isDone ? 'disabled' : ''}>${isDone ? 'ВЗЯТО' : 'ЗАБРАТИ'}</button></div>`;
    });
    document.getElementById('achievements-list').innerHTML = h;
}

function renderInventoryAndCraft() {
    let inv = playerChar.inventory || [];
    let eqW = inv.find(i => i.id === playerChar.weapon); 
    let eqA = inv.find(i => i.id === playerChar.armor);
    
    document.getElementById('inv-weapon').innerHTML = eqW ? `<span style="color:${eqW.color};">${eqW.name} (+${eqW.stat})</span>` : 'Порожньо';
    document.getElementById('inv-armor').innerHTML = eqA ? `<span style="color:${eqA.color};">${eqA.name} (+${eqA.stat})</span>` : 'Порожньо';

    playerChar.totalAtk = (playerChar.attack || 20) + (eqW ? eqW.stat : 0);
    playerChar.totalDef = (playerChar.defense || 10) + (eqA ? eqA.stat : 0);
    
    document.getElementById('stat-atk').innerText = playerChar.totalAtk;
    document.getElementById('stat-def').innerText = playerChar.totalDef;
    
    document.getElementById('inv-backpack').innerHTML = inv.map(i => `<div class="rng-item" style="border-left:2px solid ${i.color}; width:150px;"><small>${i.name}</small><br><button onclick="equipItem('${i.id}', '${i.type}')" class="btn-small">Одягти</button></div>`).join('');
}

async function equipItem(id, type) {
    await fetch('/api/equip', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` }, 
        body: JSON.stringify({ id, type }) 
    });
    loadPlayerData();
}

function renderMap() {
    let h = ''; const c = playerChar.map_node || 1;
    for(let i=1; i<=50; i++) {
        const isBoss = i % 5 === 0;
        h += `<div class="map-node ${i <= c ? 'beaten' : 'locked'} ${isBoss?'boss-node':''}" onclick="startBattle(${i}, ${isBoss})">${isBoss?'💀':i}</div>`;
    }
    document.getElementById('map-container').innerHTML = h;
}

function startBattle(i, b) { 
    playingNode = i; isBossNode = b; isSurvivalMode = false; triggerBattle(i, b); 
}

function startSurvival() { 
    isSurvivalMode = true; survivalWave = 1; triggerBattle(1, false); 
}

function triggerBattle(n, b) {
    let scale = isSurvivalMode ? survivalWave : n;
    currentEnemy = { 
        name: b ? "БОС" : "Тінь", 
        hp: 100 + (scale*50), 
        maxHp: 100 + (scale*50), 
        atk: 10 + (scale*5) 
    };
    
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('battle-screen').classList.remove('hidden');
    document.getElementById('b-e-name').innerText = currentEnemy.name;
    document.getElementById('battle-skills').innerHTML = `<button class="skill-btn" onclick="useSkill()">АТАКА</button>`;
    
    playerChar.hp = playerChar.max_hp; 
    updateBars();
}

function useSkill() {
    currentEnemy.hp -= playerChar.totalAtk; 
    updateBars();
    
    if(currentEnemy.hp <= 0) return finishBattle(true);
    
    setTimeout(() => {
        playerChar.hp -= Math.max(1, currentEnemy.atk - playerChar.totalDef); 
        updateBars();
        if(playerChar.hp <= 0) finishBattle(false);
    }, 500);
}

function updateBars() {
    document.getElementById('b-p-hp-bar').style.width = (playerChar.hp / playerChar.max_hp * 100) + '%';
    document.getElementById('b-e-hp').style.width = (currentEnemy.hp / currentEnemy.maxHp * 100) + '%';
}

async function finishBattle(w) {
    if(isSurvivalMode && w) {
        await fetch('/api/win_survival', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` }, 
            body: JSON.stringify({ wave: survivalWave }) 
        });
        survivalWave++; 
        triggerBattle(survivalWave, false); 
        return;
    }
    
    if(!w) { 
        showPopup("ПОРАЗКА", "Тьма перемогла", "loss", "☠️"); 
        setTimeout(() => location.reload(), 2000); 
        return; 
    }
    
    await fetch('/api/win_battle', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` }, 
        body: JSON.stringify({ node: playingNode }) 
    });
    
    showPopup("ПЕРЕМОГА!", "Рівень пройдено", "win", "🏆"); 
    setTimeout(() => loadPlayerData(), 1500);
}

function nextStoryLine() {
    document.getElementById('story-overlay').classList.add('hidden');
    triggerBattle(playingNode, isBossNode);
}

window.onload = loadPlayerData;
