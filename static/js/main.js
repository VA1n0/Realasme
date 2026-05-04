// --- ОСНОВНІ ЗМІННІ ---
let playerChar = null; 
let currentEnemy = null; 
let playingNode = 1; 
let isBossNode = false; 
let isSurvivalMode = false; 
let survivalWave = 1; 
let skillCooldowns = {}; 
let SKILLS_DB = {};
let battleTimer = null;

// --- КОНСТАНТИ ВІЗУАЛУ ТА ЛОРУ ---
const PET_IMAGES = {
    "Яйце": "🥚", "Малий Демон": "🦇", "Демон-Вбивця": "🐺", "Вищий Демон": "👹", "Лорд Безодні": "👿",
    "Дракончик": "🦎", "Юний Дракон": "🐉", "Вогняний Дракон": "🔥", "Стародавній Дракон": "🐲",
    "Камінь": "🪨", "Малий Голем": "🗿", "Залізний Голем": "⚙️", "Сталевий Голем": "🛡️", "Титан": "🤖",
    "Ектоплазма": "💧", "Дух": "👻", "Полтергейст": "🌪️", "Жах": "😱", "Жнець Душ": "💀"
};

const AVATARS = {
    'Некромант': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500', 
    'Воїн': 'https://images.unsplash.com/photo-1605640840482-96947f6ff037?w=500', 
    'Маг': 'https://images.unsplash.com/photo-1549488344-c78b4bdc7e14?w=500', 
    'Асасин': 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=500'
};

const STORY_DB = {
    5: { s: "Король Слизу", t: "Моя кислота розчинить твої амбіції!" },
    10: { s: "Забутий Лицар", t: "Ніхто не пройде мій міст!" },
    25: { s: "Генерал Пекла", t: "Клан Півночі впав, ти — наступний!" },
    50: { s: "АБСОЛЮТ ТІНІ", t: "ТЕПЕР Я ПОГЛИНУ ТЕБЕ, І ЦЕЙ СВІТ ЗГАСНЕ!" }
};

const ELIAS_LORE = [
    "Твій Гримуар здатний на більше. Об'єднуй речі в Кузні.",
    "Клан 'Орлів' впав, але їхня воля живе у тобі.",
    "Деякі моби використовують хитрощі. Тримай фокус!"
];

const PET_PASSIVES_DB = {
    "crit": { name: "+10% Крит", color: "#ff3333" },
    "vampire": { name: "+10% Вамп", color: "#1eff00" },
    "poison": { name: "+10% Отрута", color: "#00ff00" },
    "thorns": { name: "+10% Шипи", color: "#ff00ff" }
};

// --- ФУНКЦІЇ ДОПОМОГИ ---
function showPopup(t, tx, ty = "win", ic = "🏆") {
    const o = document.getElementById('custom-popup');
    const b = document.getElementById('popup-box');
    document.getElementById('popup-title').innerText = t;
    document.getElementById('popup-text').innerHTML = tx;
    document.getElementById('popup-icon').innerText = ic;
    b.className = `custom-popup-box popup-${ty}`;
    o.classList.add('show');
}

function closePopup() { document.getElementById('custom-popup').classList.remove('show'); }

function toggleAuth(fId) {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('reg-form').classList.add('hidden');
    document.getElementById(fId).classList.remove('hidden');
}

// --- АВТОРИЗАЦІЯ ---
async function authCall(ep, uF, eF, pF) {
    const p = { email: document.getElementById(eF).value, password: document.getElementById(pF).value };
    if(uF) p.username = document.getElementById(uF).value;
    const r = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) });
    const d = await r.json();
    if(r.ok) { localStorage.setItem('rpg_token', d.token); loadPlayerData(); } 
    else showPopup("ПОМИЛКА", d.message, "loss", "❌");
}

function registerUser(e) { e.preventDefault(); authCall('/api/register', 'r-user', 'r-email', 'r-pass'); }
function loginUser(e) { e.preventDefault(); authCall('/api/login', null, 'l-email', 'l-pass'); }

async function selectClass(cN) {
    const r = await fetch('/api/create_character', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` }, 
        body: JSON.stringify({ name: document.getElementById('char-name').value, class_name: cN }) 
    });
    if(r.ok) loadPlayerData();
}

// --- ЗАВАНТАЖЕННЯ ДАНИХ ---
async function loadPlayerData() {
    const t = localStorage.getItem('rpg_token'); if (!t) return;
    const r = await fetch('/api/me', { headers: { 'Authorization': `Bearer ${t}` } });
    const d = await r.json();
    if (d.status === "no_character") {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('class-screen').classList.remove('hidden');
        document.getElementById('char-name').value = d.username;
    } else if (d.status === "success") {
        playerChar = d.character; SKILLS_DB = d.skills_db;
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('class-screen').classList.add('hidden');
        document.getElementById('battle-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        
        updateUI();
        renderMap();
        renderInventoryAndCraft();
        renderGachaAndPets();
        renderSkillsTree();
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
    document.getElementById('ui-exp').innerText = `${playerChar.exp} / ${playerChar.level * 100}`;
    document.getElementById('survival-record').innerText = playerChar.survival_wave || 1;
    document.getElementById('ui-avatar').style.backgroundImage = `url('${AVATARS[playerChar.class_name]}')`;
}

// --- КРАМНИЦЯ ТА БАЛАНС ---
function generateShop(category) {
    const container = document.getElementById('shop-items-container');
    if(category === 'eggs') {
        container.innerHTML = `
            <div class="rng-item" style="border-left: 4px solid #a0a0a0; width: 300px;"><div><strong>🥚 Звичайне Яйце</strong><br>1,000 🪙</div><button onclick="buyEgg('basic')" class="btn-small bg-gold">Купити</button></div>
            <div class="rng-item" style="border-left: 4px solid #a335ee; width: 300px;"><div><strong>🔮 Епічне Яйце</strong><br>5,000 🪙</div><button onclick="buyEgg('epic')" class="btn-small bg-gold">Купити</button></div>
        `;
        return;
    }

    // БАЛАНС СТАТІВ: Ціна відповідає якості
    const rarityData = {
        "Common": { c: "#a0a0a0", m: 1.0, p: 100 },
        "Uncommon": { c: "#1eff00", m: 1.8, p: 400 },
        "Rare": { c: "#0070dd", m: 3.2, p: 1200 },
        "Epic": { c: "#a335ee", m: 5.5, p: 4500 }
    };

    let h = '';
    const bases = category === 'weapon' ? ["Меч", "Посох", "Лук"] : ["Броня", "Плащ", "Щит"];
    
    Object.keys(rarityData).forEach(r => {
        let d = rarityData[r];
        let name = `${r} ${bases[Math.floor(Math.random()*3)]}`;
        let stat = Math.floor((playerChar.level * 15) * d.m); // Фіксований баланс
        h += `
        <div class="rng-item shop-card" style="border-left: 4px solid ${d.c}; width: 280px;" data-type="${category}">
            <div><strong style="color:${d.c};">${name}</strong><br>+${stat} Стат | ${r}</div>
            <button onclick="buyWithEquip('${name}', '${category}', '${r}', ${stat}, ${d.p})" class="btn-small bg-gold">Купити (${d.p})</button>
        </div>`;
    });
    container.innerHTML = h;
}

// Функція покупки з питанням про екіпірування
async function buyWithEquip(name, type, rarity, stat, price) {
    const equipNow = confirm(`Бажаєте одягнути "${name}" відразу?`);
    const r = await fetch('/api/buy_shop_item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` },
        body: JSON.stringify({ name, type, rarity, stat, price, equip_now: equipNow })
    });
    const d = await r.json();
    if(r.ok) { showPopup("УСПІШНО", "Предмет придбано!", "loot", "🛒"); loadPlayerData(); }
    else showPopup("ПОМИЛКА", d.message, "loss", "❌");
}

// --- ВИЖИВАННЯ ТА ДОСЯГНЕННЯ ---
async function startSurvival() {
    isSurvivalMode = true; survivalWave = 1;
    triggerBattle(1, false);
}

async function claimAch(id) {
    const r = await fetch('/api/claim_achievement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` },
        body: JSON.stringify({ id })
    });
    const d = await r.json();
    if(r.ok) { showPopup("НАГОРОДА!", `Ви отримали ${d.reward} 💎`, "loot", "💎"); loadPlayerData(); }
    else showPopup("ЩЕ НЕ ЧАС", d.message, "loss", "⏳");
}

function renderAchievements() {
    const list = document.getElementById('achievements-list');
    const ACH_DATA = [
        { id: "kills_50", name: "Мисливець", desc: "Вбити 50 ворогів", req: 50 },
        { id: "boss_5", name: "Вбивця босів", desc: "Перемогти 5 босів", req: 5 }
    ];
    let h = '';
    ACH_DATA.forEach(a => {
        const claimed = (playerChar.claimed_achievements || []).includes(a.id);
        h += `
        <div class="rng-item" style="justify-content:space-between; display:flex; align-items:center;">
            <div><strong>${a.name}</strong><br><small>${a.desc}</small></div>
            <button class="btn-small ${claimed ? '' : 'bg-gold'}" onclick="claimAch('${a.id}')" ${claimed ? 'disabled' : ''}>
                ${claimed ? 'ВЗЯТО' : 'ЗАБРАТИ'}
            </button>
        </div>`;
    });
    list.innerHTML = h;
}

// --- БОЙОВА СИСТЕМА ---
function triggerBattle(n, b) {
    let scale = isSurvivalMode ? survivalWave : n;
    let hp = Math.floor(100 + (scale * 50) * (b ? 3 : 1));
    currentEnemy = { name: b ? "БОС" : "Тінь", hp: hp, maxHp: hp, atk: 10 + (scale * 5), isBoss: b };
    setupArena();
}

function setupArena() {
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('battle-screen').classList.remove('hidden');
    document.getElementById('b-e-name').innerText = currentEnemy.name;
    document.getElementById('b-log').innerHTML = '';
    playerChar.hp = playerChar.max_hp;
    renderBattleSkills();
}

function renderBattleSkills() {
    const container = document.getElementById('battle-skills');
    const skills = playerChar.equipped_skills || ["attack"];
    container.innerHTML = skills.map(s => `
        <div class="skill-btn" onclick="useSkill('${s}')">${SKILLS_DB[s]?.icon || '⚔️'}<br><small>${s}</small></div>
    `).join('');
}

function useSkill(k) {
    if (!currentEnemy || currentEnemy.hp <= 0) return;
    let dmg = Math.floor(playerChar.attack * (SKILLS_DB[k]?.mult || 1));
    currentEnemy.hp -= dmg;
    updateBars();
    logBattle(`Ти влучив: -${dmg}`, "white");

    if (currentEnemy.hp <= 0) return finishBattle(true);

    setTimeout(() => {
        let eDmg = Math.max(1, currentEnemy.atk - playerChar.defense);
        playerChar.hp -= eDmg;
        updateBars();
        logBattle(`Ворог б'є: -${eDmg}`, "red");
        if (playerChar.hp <= 0) finishBattle(false);
    }, 800);
}

function updateBars() {
    document.getElementById('b-e-hp').style.width = (currentEnemy.hp / currentEnemy.maxHp * 100) + '%';
    document.getElementById('b-p-hp-bar').style.width = (playerChar.hp / playerChar.max_hp * 100) + '%';
}

async function finishBattle(w) {
    if (isSurvivalMode && w) {
        const r = await fetch('/api/win_survival', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` },
            body: JSON.stringify({ wave: survivalWave }) 
        });
        const d = await r.json();
        showPopup("ХВИЛЯ ПРОЙДЕНА!", `+${d.gold} 🪙`, "win");
        survivalWave++;
        setTimeout(() => { triggerBattle(survivalWave, false); }, 1500);
        return;
    }

    if (!w) { showPopup("ПОРАЗКА", "Тінь виявилась сильнішою...", "loss"); setTimeout(()=>location.reload(), 2000); }
    else {
        await fetch('/api/win_battle', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` },
            body: JSON.stringify({ node: playingNode }) 
        });
        showPopup("ПЕРЕМОГА!", "Лутаємо трупи...", "win");
        setTimeout(loadPlayerData, 1500);
    }
}

// --- ІНШІ СИСТЕМИ ---
function showTab(tN) {
    document.querySelectorAll('.tab-panel').forEach(t => t.classList.add('hidden'));
    document.getElementById('tab-' + tN).classList.remove('hidden');
}

function renderMap() {
    const c = playerChar.map_node || 1;
    let h = '';
    for (let i = 1; i <= 50; i++) {
        const isBoss = i % 5 === 0;
        h += `<div class="map-node ${i <= c ? 'beaten' : 'locked'} ${isBoss ? 'boss-node' : ''}" 
              onclick="${i <= c ? `startStorySequence(${i}, ${isBoss})` : ''}">${isBoss ? '💀' : i}</div>`;
    }
    document.getElementById('map-container').innerHTML = h;
}

function startStorySequence(n, b) {
    playingNode = n; isBossNode = b;
    document.getElementById('story-overlay').classList.remove('hidden');
    document.getElementById('story-name').innerText = b ? "БОС" : "Еліас";
    document.getElementById('story-text').innerText = b ? "Я ТЕБЕ З'ЇМ!" : "Йди вперед, не бійся.";
}

function nextStoryLine() {
    document.getElementById('story-overlay').classList.add('hidden');
    triggerBattle(playingNode, isBossNode);
}

function logBattle(m, c) {
    const log = document.getElementById('b-log');
    log.innerHTML = `<div style="color:${c}">${m}</div>` + log.innerHTML;
}

async function openChest() {
    const r = await fetch('/api/open_chest', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` } });
    if(r.ok) loadPlayerData();
}

async function equipItem(id, type) {
    await fetch('/api/equip', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` },
        body: JSON.stringify({ id, type })
    });
    loadPlayerData();
}

function renderInventoryAndCraft() {
    const inv = playerChar.inventory || [];
    document.getElementById('inv-backpack').innerHTML = inv.map(i => `
        <div class="rng-item" style="border-left: 2px solid ${i.color}; width: 150px;">
            <small>${i.name}</small><br>
            <button onclick="equipItem('${i.id}', '${i.type}')" class="btn-small">Вдягнути</button>
        </div>
    `).join('');
    document.getElementById('stat-atk').innerText = playerChar.attack;
    document.getElementById('stat-def').innerText = playerChar.defense;
}

function renderGachaAndPets() {
    const p = playerChar.pets || [];
    document.getElementById('pet-list').innerHTML = p.map(pt => `
        <div class="shop-card"><strong>${pt.name}</strong><br>Stage: ${pt.stage}</div>
    `).join('');
    document.getElementById('gacha-chests').innerText = playerChar.chests || 0;
}

function renderSkillsTree() { /* Спрощено для економії місця */ }

window.onload = loadPlayerData;
