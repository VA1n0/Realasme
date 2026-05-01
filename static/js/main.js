let playerChar = null; let currentEnemy = null; let playingNode = 1; let isBossNode = false; let isSurvivalMode = false; let survivalWave = 1; 
let skillCooldowns = {}; let pendingBattle = null; let currentStoryNode = 1; let isBossStory = false; let battleTimer = null; let SKILLS_DB = {};

const PET_IMAGES = {
    "Яйце": "🥚", "Малий Демон": "🦇", "Демон-Вбивця": "🐺", "Вищий Демон": "👹", "Лорд Безодні": "👿",
    "Дракончик": "🦎", "Юний Дракон": "🐉", "Вогняний Дракон": "🔥", "Стародавній Дракон": "🐲",
    "Камінь": "🪨", "Малий Голем": "🗿", "Залізний Голем": "⚙️", "Сталевий Голем": "🛡️", "Титан": "🤖",
    "Ектоплазма": "💧", "Дух": "👻", "Полтергейст": "🌪️", "Жах": "😱", "Жнець Душ": "💀",
    "Попіл": "💨", "Іскра": "✨", "Вогняний Птах": "🕊️", "Фенікс": "🦅", "Безсмертний": "☀️",
    "Сліпе маля": "🐁", "Кажан": "🦇", "Кровопивця": "🩸", "Вампір": "🧛", "Носферату": "🧛‍♂️",
    "Цуценя": "🐶", "Вовк": "🐺", "Лютововк": "🐾", "Перевертень": "🐺", "Альфа": "👑",
    "Насіння": "🌱", "Саджанець": "🌿", "Ент": "🌳", "Древній Ент": "🌲", "Хранитель Лісу": "🌍"
};

const AVATARS = {'Некромант': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500', 'Воїн': 'https://images.unsplash.com/photo-1605640840482-96947f6ff037?w=500', 'Маг': 'https://images.unsplash.com/photo-1549488344-c78b4bdc7e14?w=500', 'Асасин': 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=500'};
const BOSS_IMG = 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?w=500';

const ACH_DB = [
    { id: "kills_10", name: "Перша кров", desc: "Вбити 10 ворогів", reqType: "kills", reqNum: 10, reward: 5 },
    { id: "kills_50", name: "Кат", desc: "Вбити 50 ворогів", reqType: "kills", reqNum: 50, reward: 15 },
    { id: "kills_200", name: "Жнець Душ", desc: "Вбити 200 ворогів", reqType: "kills", reqNum: 200, reward: 50 },
    { id: "boss_1", name: "Падіння Слизу", desc: "Вбити 1 Боса", reqType: "boss_kills", reqNum: 1, reward: 10 },
    { id: "boss_5", name: "Гроза Лордів", desc: "Вбити 5 Босів", reqType: "boss_kills", reqNum: 5, reward: 25 },
    { id: "boss_20", name: "Вбивця Богів", desc: "Вбити 20 Босів", reqType: "boss_kills", reqNum: 20, reward: 100 },
    { id: "map_10", name: "Мандрівник", desc: "Дійти до 10 етапу", reqType: "max_node", reqNum: 10, reward: 10 },
    { id: "map_30", name: "Ветеран Безодні", desc: "Дійти до 30 етапу", reqType: "max_node", reqNum: 30, reward: 50 },
    { id: "map_50", name: "Абсолют", desc: "Пройти гру (50 етап)", reqType: "max_node", reqNum: 50, reward: 500 }
];

// 🔥 РОЗШИРЕНИЙ ЛОР БОСІВ
const STORY_DB = {
    5: { s: "Король Слизу", t: "Ви всі такі однакові... Приходите сюди за славою, а залишаєтесь кістками в моєму череві. Моя кислота розчинить твої амбіції!" },
    10: { s: "Забутий Лицар", t: "Я клявся захищати це королівство до останньої краплі крові. Моє тіло згнило, але клятва живе! Ніхто не пройде мій міст!" },
    15: { s: "Матір Павуків", t: "Твоя кров така гаряча... Підійди ближче, герою. Ти станеш чудовим інкубатором для моїх діточок." },
    20: { s: "Тінь Минулого", t: "Я — всі ті, кого ти не зміг врятувати. Спробуй вбити власне сумління, якщо тобі вистачить духу!" },
    25: { s: "Генерал Пекла", t: "Мої очі бачать кожну твою слабкість. Ти потрапив у мою ілюзію ще до того, як оголив меч. Клан Півночі впав від моєї руки, ти — наступний!" },
    30: { s: "Кривава Графиня", t: "Твоя життєва сила живитиме мою молодість ще сотню років. Це буде солодко..." },
    35: { s: "Пожирач Снів", t: "Я бачив твої найглибші страхи уві сні. Зараз я змушу тебе пережити їх в реальності!" },
    40: { s: "Падший Архангел", t: "Тільки безодня приносить справжній спокій. Світло зрадило мене, і я дарую тобі вічну темряву." },
    45: { s: "Права рука Лорда", t: "Ти зайшов надто далеко, грішнику. За цією брамою кінець усього. Я не пропущу тебе." },
    50: { s: "АБСОЛЮТ ТІНІ", t: "ТИ СТВОРИВ МЕНЕ СВОЄЮ ЖОРСТОКІСТЮ. Я ВБРАВ КОЖНУ ДУШУ, ЯКУ ТИ ЗАГУБИВ. ТЕПЕР Я ПОГЛИНУ ТЕБЕ, І ЦЕЙ СВІТ ЗГАСНЕ НАЗАВЖДИ!" }
};

// 🔥 РОЗШИРЕНИЙ ЛОР ЕЛІАСА
const ELIAS_LORE = [
    "Ці землі колись були найродючішими в регіоні. Тепер Тьма спалила врожай, залишивши лише попіл та гниль.",
    "Я чув про могутній клан 'Орлів', що колись бився на Північному кордоні... Вони впали, але їхня воля живе у таких воїнах, як ти.",
    "Деякі моби використовують хитрощі, щоб заплутати розум. Не піддавайся їхнім ілюзіям, тримай фокус на цілі.",
    "Кажуть, Лорд Безодні був колись звичайною людиною... Поки не знайшов Проклятий Гримуар у руїнах старого замку.",
    "Кожен переможений ворог робить тебе сильнішим. Але чи не стаєш ти ближчим до них з кожним вбивством?",
    "Тут були лицарські аванпости Північного Королівства. Тепер це лише братські могили.",
    "Твій Гримуар здатний на більше. Об'єднуй речі в Кузні, щоб отримати справжні артефакти клану Півночі."
];

const PET_PASSIVES_DB = {
    "crit": { name: "+10% Крит. шанс", color: "#ff3333" },
    "vampire": { name: "+10% Вампіризм", color: "#1eff00" },
    "poison": { name: "+10% Отрута", color: "#00ff00" },
    "thorns": { name: "+10% Шипи", color: "#ff00ff" }
};

function getCleanSkills() { let r = playerChar.equipped_skills; if(!r) return ["attack"]; if(typeof r === 'string') return r.replace(/[{}"'[\]]/g, '').split(',').map(s => s.trim()).filter(s => SKILLS_DB[s]); if(Array.isArray(r)) return r.filter(s => SKILLS_DB[s]); return ["attack"]; }

function showPopup(t, tx, ty = "win", ic = "🏆") { const o = document.getElementById('custom-popup'); const b = document.getElementById('popup-box'); document.getElementById('popup-title').innerText = t; document.getElementById('popup-text').innerHTML = tx; document.getElementById('popup-icon').innerText = ic; b.className = `custom-popup-box popup-${ty}`; document.getElementById('popup-title').style.color = ty==='win'?'var(--gold)':ty==='loss'?'var(--blood)':'var(--epic)'; o.classList.add('show'); }
function closePopup() { document.getElementById('custom-popup').classList.remove('show'); }
function toggleAuth(fId) { document.getElementById('login-form').classList.add('hidden'); document.getElementById('reg-form').classList.add('hidden'); document.getElementById(fId).classList.remove('hidden'); }

async function authCall(ep, uF, eF, pF) { const p = { email: document.getElementById(eF).value, password: document.getElementById(pF).value }; if(uF) p.username = document.getElementById(uF).value; const r = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) }); const d = await r.json(); if(r.ok) { localStorage.setItem('rpg_token', d.token); loadPlayerData(); } else showPopup("ПОМИЛКА", d.message, "loss", "❌"); }
async function registerUser(e) { e.preventDefault(); authCall('/api/register', 'r-user', 'r-email', 'r-pass'); }
async function loginUser(e) { e.preventDefault(); authCall('/api/login', null, 'l-email', 'l-pass'); }
async function selectClass(cN) { const r = await fetch('/api/create_character', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` }, body: JSON.stringify({ name: document.getElementById('char-name').value, class_name: cN }) }); if(r.ok) loadPlayerData(); }

async function loadPlayerData() {
    const t = localStorage.getItem('rpg_token'); if (!t) return;
    const r = await fetch('/api/me', { headers: { 'Authorization': `Bearer ${t}` } }); const d = await r.json();
    if (d.status === "no_character") { document.getElementById('auth-screen').classList.add('hidden'); document.getElementById('class-screen').classList.remove('hidden'); document.getElementById('char-name').value = d.username; } 
    else if (d.status === "success") {
        playerChar = d.character; SKILLS_DB = d.skills_db; 
        document.getElementById('auth-screen').classList.add('hidden'); document.getElementById('class-screen').classList.add('hidden'); document.getElementById('battle-screen').classList.add('hidden'); document.getElementById('game-screen').classList.remove('hidden');
        renderInventoryAndCraft(); 
        
        document.getElementById('ui-name').innerText = playerChar.name; 
        document.getElementById('ui-lvl').innerText = playerChar.level; 
        document.getElementById('ui-exp').innerText = `${playerChar.exp || 0} / ${playerChar.level * 100}`;
        
        document.getElementById('ui-gold').innerText = playerChar.gold; document.getElementById('ui-diamonds').innerText = playerChar.diamonds || 0; 
        document.getElementById('ui-hp').innerText = `${playerChar.hp} / ${playerChar.max_hp}`; document.getElementById('ui-hp-bar').style.width = Math.min(100, (playerChar.hp / playerChar.max_hp * 100)) + '%';
        document.getElementById('ui-avatar').style.backgroundImage = `url('${AVATARS[playerChar.class_name] || AVATARS['Воїн']}')`;
        document.getElementById('survival-record').innerText = playerChar.survival_wave || 1;
        renderMap(); renderGachaAndPets(); renderSkillsTree(); generateShop('weapon'); renderAchievements();
    }
}

function showTab(tN) { document.querySelectorAll('.tab-panel').forEach(t => t.classList.add('hidden')); document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active')); document.getElementById('tab-' + tN).classList.remove('hidden'); event.currentTarget.classList.add('active'); }

function renderMap() {
    let h = ''; const t = 50; const c = playerChar.map_node || 1; document.getElementById('map-progress').innerText = `${c} / ${t}`;
    for (let i = 1; i <= t; i++) { let l = i > c; let b = i % 5 === 0; h += `<div class="map-node ${l ? 'locked' : (i === c ? 'current' : 'beaten')} ${b ? 'boss-node' : ''}" style="width: 80px; height: 80px; font-size:2rem; flex-shrink:0;" onclick="${!l ? `startStorySequence(${i}, ${b})` : ''}"><div class="node-icon">${b ? '💀' : '⚔️'}</div><div class="node-label" style="font-size:0.8rem;">Етап ${i}</div></div>`; }
    document.getElementById('map-container').innerHTML = h;
}

function renderAchievements() {
    let h = ''; let prog = playerChar.achievements_progress || {}; let cl = playerChar.claimed_achievements || [];
    ACH_DB.forEach(a => {
        let cur = prog[a.reqType] || 0; let done = cur >= a.reqNum; let isCl = cl.includes(a.id);
        let btn = isCl ? `<button class="btn-small" style="background:#222; color:#555;" disabled>ОТРИМАНО</button>` : done ? `<button class="btn-small bg-gold" onclick="claimAch('${a.id}', ${a.reward})">ЗАБРАТИ ${a.reward} 💎</button>` : `<span style="color:#aaa;">${cur}/${a.reqNum}</span>`;
        h += `<div class="rng-item" style="border-left: 4px solid ${done && !isCl ? '#00ffff' : '#444'}; width: 100%; display:flex; justify-content:space-between; align-items:center;"><div><strong style="color:${done ? 'var(--gold)' : '#fff'}; font-size:1.2rem;">${a.name}</strong><br><span style="color:#aaa;">${a.desc}</span></div><div>${btn}</div></div>`;
    });
    document.getElementById('achievements-list').innerHTML = h;
}

function renderSkillsTree() {
    let h = ''; let eqS = getCleanSkills(); let unlS = playerChar.unlocked_skills || {};
    Object.keys(SKILLS_DB).forEach(k => {
        let s = SKILLS_DB[k]; let isEq = eqS.includes(k); let isUnl = unlS[k] !== undefined; let lvl = unlS[k] || 0; let canBuy = playerChar.level >= s.req_lvl;
        let actions = isUnl ? `<div style="display:flex; flex-direction:column; gap:5px;"><button class="btn-small ${isEq ? 'bg-red' : 'bg-gold'}" onclick="equipItem('${k}', 'skill')">${isEq ? 'ЗНЯТИ' : 'ЕКІПІРУВАТИ'}</button><button class="btn-small" style="background:#00ffff; color:#000;" onclick="buySkill('${k}')">↑ Рівень ${lvl+1} (${s.cost * (lvl + 1)} 🪙)</button></div>` : `<button class="btn-small ${canBuy ? 'bg-gold' : ''}" style="${!canBuy ? 'background:#333; color:#666; cursor:not-allowed;' : ''}" ${canBuy ? `onclick="buySkill('${k}')"` : ''}>${canBuy ? `КУПИТИ (${s.cost} 🪙)` : `РІВЕНЬ ${s.req_lvl}`}</button>`;
        h += `<div class="rng-item" style="border-left: 4px solid ${isEq ? '#ff00ff' : (isUnl ? '#1eff00' : '#444')}; opacity: ${isUnl ? '1' : '0.6'};"><div style="display:flex; align-items:center; gap:15px;"><div style="font-size:2.5rem;">${s.icon}</div><div><strong style="color:${isEq ? '#ff00ff' : (isUnl ? '#fff' : '#888')}; font-size:1.2rem;">${s.name} ${lvl > 0 ? `[Lv.${lvl}]` : ''}</strong><br><span style="color:#aaa; font-size:0.9rem;">Шкода x${(s.mult + (lvl*0.2)).toFixed(1)} | КД: ${s.cd}с<br>${s.desc}</span></div></div>${actions}</div>`;
    });
    document.getElementById('skill-tree-list').innerHTML = h;
}

function renderInventoryAndCraft() {
    let wAtk = 0; let aDef = 0; playerChar.crit_chance = 0.05; playerChar.vampire = 0; playerChar.poison = 0; playerChar.thorns = 0;
    playerChar.dodge = 0.05; 

    let inv = playerChar.inventory || []; 
    let eqW = inv.find(i => i.id === playerChar.weapon); let eqA = inv.find(i => i.id === playerChar.armor);
    if(eqW) { wAtk = eqW.stat; if(eqW.extra?.crit_chance) playerChar.crit_chance += eqW.extra.crit_chance; if(eqW.extra?.vampire) playerChar.vampire += eqW.extra.vampire; if(eqW.extra?.poison) playerChar.poison += eqW.extra.poison; }
    if(eqA) { aDef = eqA.stat; if(eqA.extra?.crit_chance) playerChar.crit_chance += eqA.extra.crit_chance; if(eqA.extra?.thorns) playerChar.thorns += eqA.extra.thorns; }
    
    let aPet = playerChar.pets ? playerChar.pets.find(p => p.id === playerChar.active_pet) : null; let pBuff = 1.0;
    if(aPet) { 
        if(aPet.buff === 'aoe_dmg') pBuff = 1.2 + ((aPet.stage || 1) * 0.05); 
        if(aPet.buff === 'vampire') playerChar.vampire += 0.1 + ((aPet.stage || 1) * 0.02); 
        if(aPet.buff === 'crit') playerChar.crit_chance += 0.1 + ((aPet.stage || 1) * 0.02);
        if(aPet.buff === 'dodge') playerChar.dodge += 0.1 + ((aPet.stage || 1) * 0.02);
        if(aPet.buff === 'tank_shield') aDef += Math.floor((playerChar.defense || 10) * (0.2 * (aPet.stage || 1)));

        if(aPet.passives) {
            if(aPet.passives.includes('crit')) playerChar.crit_chance += 0.10;
            if(aPet.passives.includes('vampire')) playerChar.vampire += 0.10;
            if(aPet.passives.includes('poison')) playerChar.poison += 0.10;
            if(aPet.passives.includes('thorns')) playerChar.thorns += 0.10;
        }
    }
    
    playerChar.totalAtk = Math.floor(((playerChar.attack || 20) + wAtk) * pBuff); 
    playerChar.totalDef = (playerChar.defense || 10) + aDef;

    let fixedPS = playerChar.totalAtk * 5 + playerChar.totalDef * 5 + playerChar.max_hp + (playerChar.level * 20);
    document.getElementById('ui-ps').innerText = fixedPS;

    document.getElementById('stat-atk').innerText = playerChar.totalAtk; document.getElementById('stat-def').innerText = playerChar.totalDef; 
    document.getElementById('stat-crit').innerText = Math.round(playerChar.crit_chance * 100) + '%';
    document.getElementById('stat-dodge').innerText = Math.round(playerChar.dodge * 100) + '%';
    document.getElementById('stat-vamp').innerText = Math.round(playerChar.vampire * 100) + '%';
    document.getElementById('stat-psn').innerText = Math.round(playerChar.poison * 100) + '%';
    document.getElementById('stat-thrn').innerText = Math.round(playerChar.thorns * 100) + '%';

    document.getElementById('inv-weapon').innerHTML = eqW ? `<span style="color:${eqW.color};">${eqW.name}<br><small>+${eqW.stat} АТК</small></span>` : '<span style="color:#555;">Порожньо</span>';
    document.getElementById('inv-armor').innerHTML = eqA ? `<span style="color:${eqA.color};">${eqA.name}<br><small>+${eqA.stat} ЗАХ</small></span>` : '<span style="color:#555;">Порожньо</span>';
    let mergeH = ''; ["Common", "Uncommon", "Rare", "Epic", "Legendary"].forEach(r => { mergeH += `<button class="btn-small" style="background:#222; color:#fff; border:1px solid #555;" onclick="mergeItems('${r}', 'weapon')">Злити 5 ${r} (Зброя)</button><button class="btn-small" style="background:#222; color:#fff; border:1px solid #555;" onclick="mergeItems('${r}', 'armor')">Злити 5 ${r} (Броня)</button>`; });
    document.getElementById('merge-buttons').innerHTML = mergeH;
    
    document.getElementById('inv-backpack').innerHTML = inv.length === 0 ? '<p style="color:#555;">Рюкзак порожній.</p>' : inv.map(i => {
        let isEq = i.id === playerChar.weapon || i.id === playerChar.armor;
        let ext = i.extra ? (i.extra.crit_chance ? `<span style="color:#ff3333;">Крит: +${Math.round(i.extra.crit_chance*100)}%</span> ` : '') + (i.extra.vampire ? `<span style="color:#1eff00;">Вамп: +${Math.round(i.extra.vampire*100)}%</span> ` : '') + (i.extra.poison ? `<span style="color:#00ff00;">Отрута: +${Math.round(i.extra.poison*100)}%</span> ` : '') + (i.extra.thorns ? `<span style="color:#ff00ff;">Шипи: +${Math.round(i.extra.thorns*100)}%</span>` : '') : '';
        return `<div class="rng-item" style="border-left: 4px solid ${i.color}; width: 320px;"><div><strong style="color:${i.color};">${i.name}</strong><br><span style="font-size:0.85rem; color:#aaa;">+${i.stat} | ${i.rarity}</span><br><div style="font-size:0.8rem; margin-top:3px;">${ext}</div></div><div style="display:flex; flex-direction:column; gap:5px;">${isEq ? `<span style="color:#aaa; font-size:0.8rem; text-align:center; border:1px solid #555; padding:5px;">[ОДЯГНЕНО]</span>` : `<button onclick="equipItem('${i.id}', '${i.type}')" class="btn-small bg-gold">Одягти</button><button onclick="sellRngItem('${i.id}')" class="btn-small bg-red">Продати</button>`}<button onclick="upgradeItem('${i.id}')" class="btn-small" style="background:#00ffff; color:#000;">Зачарувати (+1k 🪙)</button></div></div>`;
    }).join('');
}

function generateShop(category) {
    if(category === 'eggs') {
        let h = `
        <div class="rng-item" style="border-left: 4px solid #a0a0a0; width: 300px;"><div><strong style="color:#a0a0a0; font-size:1.2rem;">🥚 Звичайне Яйце</strong><br><span style="color:#aaa; font-size:0.8rem;">Шанс на Uncommon</span></div><button onclick="buyEgg('basic')" class="btn-small bg-gold">Купити (1000 🪙)</button></div>
        <div class="rng-item" style="border-left: 4px solid #a335ee; width: 300px;"><div><strong style="color:#a335ee; font-size:1.2rem;">🔮 Епічне Яйце</strong><br><span style="color:#aaa; font-size:0.8rem;">Шанс на Epic / Legendary</span></div><button onclick="buyEgg('epic')" class="btn-small bg-gold">Купити (5000 🪙)</button></div>
        <div class="rng-item" style="border-left: 4px solid #ff00ff; width: 300px;"><div><strong style="color:#ff00ff; font-size:1.2rem;">✨ Міфічне Яйце</strong><br><span style="color:#aaa; font-size:0.8rem;">Гарантований Leg або Mythic</span></div><button onclick="buyEgg('mythic')" class="btn-small bg-gold">Купити (25000 🪙)</button></div>
        `;
        document.getElementById('shop-items-container').innerHTML = h;
        return;
    }

    const SHOP_NAMES = { weapon: ["Меч Новачка", "Кривавий Кинджал", "Посох Мага", "Сокира Варвара", "Лук Ельфів", "Ефірний Клинок", "Коса Жреця", "Молот Титанів", "Спис Долі", "Гримуар Хаосу", "Меч Гладіатора", "Кігті Тіні"], armor: ["Лляна Сорочка", "Шкіряна Броня", "Кольчуга Лицаря", "Сталевий Нагрудник", "Мантія Тіней", "Екзоскелет Безодні", "Плащ Асасина", "Щит Паладіна", "Ряса Монаха", "Кістяний Обладунок"] };
    let h = ''; let lvl = playerChar.level || 1;
    let tiers = [...Array(12).fill({r: 'Common', c: '#a0a0a0', p: [100, 200]}), ...Array(10).fill({r: 'Uncommon', c: '#1eff00', p: [350, 500]}), ...Array(8).fill({r: 'Rare', c: '#0070dd', p: [1000, 1500]}), ...Array(4).fill({r: 'Epic', c: '#a335ee', p: [3000, 4500]}), ...Array(1).fill({r: 'Legendary', c: '#ff8000', p: [9000, 12000]}), ...Array(1).fill({r: 'Mythic', c: '#ff00ff', p: [25000, 30000]} )];
    tiers.sort(() => Math.random() - 0.5);
    tiers.forEach(t => {
        let name = SHOP_NAMES[category][Math.floor(Math.random() * SHOP_NAMES[category].length)];
        let stat = Math.floor(lvl * 15 * (t.r === 'Common'? 1 : t.r === 'Uncommon'? 1.2 : t.r === 'Rare'? 1.5 : t.r === 'Epic'? 2.2 : t.r === 'Legendary'? 3.5 : 5.0) + Math.random()*25 + 10);
        let price = Math.floor(Math.random() * (t.p[1] - t.p[0]) + t.p[0]); let icon = category === 'weapon' ? '⚔️' : '🛡️';
        h += `<div class="rng-item" style="border-left: 4px solid ${t.c}; width: 300px;"><div><strong style="color:${t.c};">${icon} ${name}</strong><br><span style="font-size:0.85rem; color:#aaa;">+${stat} ${category==='weapon'?'АТК':'ЗАХ'} | ${t.r}</span></div><button onclick="buyShopItem('${icon} ${name}', '${category}', '${t.r}', ${stat}, ${price})" class="btn-small bg-gold">Купити (${price} 🪙)</button></div>`;
    });
    document.getElementById('shop-items-container').innerHTML = h;
}

function renderGachaAndPets() {
    document.getElementById('gacha-chests').innerText = playerChar.chests || 0; let p = playerChar.pets || [];
    document.getElementById('pet-list').innerHTML = p.length === 0 ? '<p style="color:#555;">Немає супутників.</p>' : p.map(pt => {
        let stg = pt.stage || 1;
        let p_html = (pt.passives||[]).map(psv => `<span style="background:${PET_PASSIVES_DB[psv].color}; color:#000; padding:2px 5px; border-radius:3px; font-size:0.7rem; font-weight:bold;">${PET_PASSIVES_DB[psv].name}</span>`).join(' ');
        let maxP = stg >= 20 ? 2 : (stg >= 10 ? 1 : 0);
        let canLearn = (pt.passives||[]).length < maxP;
        
        return `<div class="shop-card" style="${playerChar.active_pet === pt.id ? 'border-color: #1eff00;' : `border-color: ${pt.color || '#555'};`} position:relative;">
            <div style="position:absolute; top:-10px; right:10px; background:${pt.color||'#aaa'}; color:#000; padding:2px 5px; border-radius:5px; font-size:0.7rem; font-weight:bold;">${pt.rarity || 'Common'}</div>
            <h3 style="color:${pt.color || 'var(--gold)'}; margin:5px 0;">${PET_IMAGES[pt.name] || '🥚'} ${pt.name}</h3>
            <p style="color:#aaa; font-size:0.85rem; margin-bottom:5px;">Рівень: ${stg} | EXP: ${pt.exp || 0}/${stg*100}</p>
            <div style="margin-bottom:10px;">${p_html}</div>
            ${canLearn ? `<button class="btn-small" style="background:#00ffff; color:#000; width:100%; margin-bottom:5px;" onclick="openPetSkillModal('${pt.id}')">🧬 Вивчити Навичку!</button>` : ''}
            <div style="display:flex; gap:5px; margin-top:5px; width:100%;">
                <button class="btn-small bg-gold" style="flex:1;" onclick="equipItem('${pt.id}', 'pet')">${playerChar.active_pet === pt.id ? 'АКТИВНИЙ' : 'ВИКЛИК'}</button>
                <button class="btn-small" style="background:#ff8000; color:#fff;" onclick="feedPet('${pt.id}')">🍖 (200🪙)</button>
            </div>
        </div>`;
    }).join('');
}

let activePetForSkill = null;
function openPetSkillModal(petId) {
    activePetForSkill = petId;
    let h = '';
    Object.keys(PET_PASSIVES_DB).forEach(k => {
        h += `<button class="btn-small" style="background:${PET_PASSIVES_DB[k].color}; color:#000; font-weight:bold; font-size:1.1rem; padding:10px;" onclick="learnPetPassive('${k}')">${PET_PASSIVES_DB[k].name}</button>`;
    });
    document.getElementById('pet-skill-options').innerHTML = h;
    document.getElementById('pet-skill-modal').classList.remove('hidden');
}
function closePetSkillModal() { document.getElementById('pet-skill-modal').classList.add('hidden'); activePetForSkill = null; }

async function learnPetPassive(passiveId) {
    const r = await fetch('/api/learn_pet_passive', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` }, body: JSON.stringify({ pet_id: activePetForSkill, passive: passiveId }) }); 
    const d = await r.json(); 
    if(r.ok) { closePetSkillModal(); showPopup("НАВИЧКУ ЗАСВОЄНО", d.message, "loot", "🧬"); loadPlayerData(); } 
    else { closePetSkillModal(); showPopup("Помилка", d.message, "loss", "❌"); }
}

async function buyEgg(tier) { const r = await fetch('/api/buy_egg', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` }, body: JSON.stringify({ tier }) }); const d = await r.json(); if(r.ok) { showPopup("НОВИЙ СУПУТНИК!", `Ви придбали яйце. Зайдіть у вкладку 'Гача та Пети'!`, "loot", "🥚"); loadPlayerData(); } else showPopup("Помилка", d.message, "loss", "❌"); }
async function buyShopItem(name, type, rarity, stat, price) { const r = await fetch('/api/buy_shop_item', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` }, body: JSON.stringify({ name, type, rarity, stat, price }) }); const d = await r.json(); if(r.ok) { showPopup("ПОКУПКА УСПІШНА", d.message, "loot", "🛒"); loadPlayerData(); } else showPopup("Помилка", d.message, "loss", "❌"); }
async function sellRngItem(id) { 
    const r = await fetch('/api/sell_rng', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` }, body: JSON.stringify({ id }) }); 
    const d = await r.json();
    if(r.ok) { showPopup("ПРОДАНО", d.message, "loot", "🪙"); loadPlayerData(); } 
    else { showPopup("Помилка", d.message, "loss", "❌"); }
}
async function buySkill(id) { const r = await fetch('/api/buy_skill', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` }, body: JSON.stringify({ id }) }); const d = await r.json(); if(r.ok) { showPopup("ГРИМУАР ОНОВЛЕНО", d.message, "loot", "📖"); loadPlayerData(); } else showPopup("Помилка", d.message, "loss", "❌"); }
async function feedPet(id) { const r = await fetch('/api/feed_pet', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` }, body: JSON.stringify({ id }) }); const d = await r.json(); if(r.ok) { showPopup("ПЕТ ЗАДОВОЛЕНИЙ", d.message, "loot", "🍖"); loadPlayerData(); } else showPopup("Помилка", d.message, "loss", "❌"); }
async function equipItem(id, type) { const r = await fetch('/api/equip', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` }, body: JSON.stringify({ id, type }) }); const d = await r.json(); if(!r.ok) showPopup("Помилка", d.message, "loss", "❌"); loadPlayerData(); }
async function upgradeItem(id) { const r = await fetch('/api/upgrade', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` }, body: JSON.stringify({ id }) }); const d = await r.json(); if(r.ok) { showPopup("ЗАЧАРУВАННЯ УСПІШНЕ", d.message, "loot", "✨"); loadPlayerData(); } else showPopup("Помилка", d.message, "loss", "❌"); }
async function mergeItems(rarity, type) { const r = await fetch('/api/merge', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` }, body: JSON.stringify({ rarity, type }) }); const d = await r.json(); if(r.ok) { showPopup("ЗЛИТТЯ УСПІШНЕ", `Створено: ${d.item.name}`, "loot", "⚒️"); loadPlayerData(); } else showPopup("Помилка", d.message, "loss", "❌"); }
async function claimAch(id, reward) { const r = await fetch('/api/claim_achievement', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` }, body: JSON.stringify({ id, reward }) }); if(r.ok) loadPlayerData(); }
async function openChest() { const r = await fetch('/api/open_chest', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` } }); const d = await r.json(); if(r.ok) { showPopup("СКРИНЮ ВІДКРИТО!", `Ви отримали:<br><br><strong style="font-size:1.5rem; color:${d.item.color};">${d.item.name}</strong><br><br>Рідкість: <span style="color:${d.item.color}; border:1px solid ${d.item.color}; padding:2px 5px;">${d.item.rarity}</span>`, "loot", "🎁"); loadPlayerData(); } }

function startStorySequence(n, b) { 
    isSurvivalMode = false; playingNode = n; isBossNode = b; document.getElementById('story-overlay').classList.remove('hidden'); 
    if(b && STORY_DB[n]) { 
        document.getElementById('story-name').innerText = STORY_DB[n].s; 
        document.getElementById('story-text').innerText = STORY_DB[n].t; 
        document.getElementById('story-name').style.color = "var(--blood)"; 
        document.getElementById('story-avatar').style.backgroundImage = `url('${BOSS_IMG}')`; 
    } else { 
        document.getElementById('story-name').innerText = "Провідник Еліас"; 
        document.getElementById('story-text').innerText = ELIAS_LORE[(n-1) % ELIAS_LORE.length]; 
        document.getElementById('story-name').style.color = "var(--gold)"; 
        document.getElementById('story-avatar').style.backgroundImage = `url('https://images.unsplash.com/photo-1541604193435-22287d32c2c2?w=500')`; 
    }
}
function nextStoryLine() { document.getElementById('story-overlay').classList.add('hidden'); triggerBattle(playingNode, isBossNode); }

function startSurvival() {
    isSurvivalMode = true;
    survivalWave = 1;
    triggerBattle(survivalWave, false);
}

function triggerBattle(n, b) { 
    let scale = isSurvivalMode ? survivalWave : n;
    let eHp = Math.floor(120 + (scale * 55) * (b ? 3.5 : 1)); 
    let eAtk = Math.floor(15 + (scale * 4.0) * (b ? 1.5 : 1)); 

    currentEnemy = { 
        name: isSurvivalMode ? `Тінь Хвилі ${survivalWave}` : (b ? (STORY_DB[n] ? STORY_DB[n].s : "ЛОРД БЕЗОДНІ") : "ПОРОДЖЕННЯ ТІНІ"), 
        hp: eHp, maxHp: eHp, atk: eAtk, isBoss: b 
    }; 
    setupArena(); 
    logBattle(`⚔️ Бій ${isSurvivalMode ? 'на Виживання' : 'на Етапі ' + n} почався!`, "gold"); 
}

function setupArena() {
    document.getElementById('game-screen').classList.add('hidden'); document.getElementById('battle-screen').classList.remove('hidden');
    document.getElementById('b-e-name').innerText = currentEnemy.name; document.getElementById('b-e-hp').style.width = '100%';
    
    // ВІЗУАЛІЗАЦІЯ ХП ГРАВЦЯ В БОЮ
    document.getElementById('b-p-hp-bar').style.width = '100%';

    document.getElementById('b-p-card').style.backgroundImage = `url('${AVATARS[playerChar.class_name] || AVATARS['Воїн']}')`; document.getElementById('enemy-card').style.backgroundImage = currentEnemy.isBoss ? `url('${BOSS_IMG}')` : "url('https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500')";
    document.getElementById('b-log').innerHTML = ''; playerChar.hp = playerChar.max_hp; 
    
    let aPet = playerChar.pets ? playerChar.pets.find(p => p.id === playerChar.active_pet) : null;
    let petEl = document.getElementById('b-p-pet');
    if(aPet) {
        petEl.innerText = PET_IMAGES[aPet.name] || '🥚';
        petEl.style.display = 'block';
    } else {
        petEl.style.display = 'none';
    }

    let eqS = getCleanSkills(); skillCooldowns = {}; eqS.forEach(k => skillCooldowns[k] = 0); renderBattleSkills();
    if(battleTimer) clearInterval(battleTimer);
    
    battleTimer = setInterval(() => { 
        let changed = false; 
        Object.keys(skillCooldowns).forEach(k => { if(skillCooldowns[k] > 0) { skillCooldowns[k]--; changed = true; } }); 
        
        if(playerChar.poison > 0 && currentEnemy.hp > 0) {
            let psnDmg = Math.floor(playerChar.totalAtk * playerChar.poison);
            currentEnemy.hp -= psnDmg; spawnDamageText('enemy-card', psnDmg, "psn");
            document.getElementById('b-e-hp').style.width = Math.max(0, (currentEnemy.hp / currentEnemy.maxHp)*100) + '%';
            if(currentEnemy.hp <= 0) { clearInterval(battleTimer); finishBattle(true); return; }
        }
        if(changed) renderBattleSkills(); 
    }, 1000);
}

function renderBattleSkills() {
    let h = ''; let eqS = getCleanSkills(); let unlS = playerChar.unlocked_skills || {};
    eqS.forEach(k => {
        const s = SKILLS_DB[k]; if(!s) return; const cd = skillCooldowns[k] || 0; let lvl = unlS[k] || 1;
        h += `<div class="skill-btn ${cd <= 0 ? '' : 'on-cd'}" onclick="useSkill('${k}', ${lvl})"><div class="skill-icon">${s.icon}</div><div class="skill-name">${s.name}</div>${cd > 0 ? `<div class="cd-overlay">${cd}s</div>` : ''}</div>`;
    });
    document.getElementById('battle-skills').innerHTML = h;
}

async function useSkill(k, lvl) {
    if (skillCooldowns[k] > 0 || !currentEnemy || currentEnemy.hp <= 0) return;
    const s = SKILLS_DB[k]; animateElement('b-p-card', 'attack-bounce');
    
    if(document.getElementById('b-p-pet').style.display !== 'none') {
        animateElement('b-p-pet', 'attack-bounce');
    }

    let isCrit = Math.random() < playerChar.crit_chance;
    let dynamicMult = s.mult + (lvl * 0.2); 
    let dmg = Math.floor(playerChar.totalAtk * dynamicMult * (isCrit ? 2.0 : 1.0));
    
    currentEnemy.hp -= dmg; spawnDamageText('enemy-card', dmg, isCrit ? "crit" : "normal"); if(isCrit) screenShake();
    
    if(playerChar.vampire > 0 || s.type === "vampire") { 
        let heal = Math.floor(dmg * (playerChar.vampire + (s.type === "vampire" ? 0.3 : 0))); 
        playerChar.hp = Math.min(playerChar.max_hp, playerChar.hp + heal); 
        spawnDamageText('b-p-card', `+${heal}`, "heal"); 
        
        // ОНОВЛЮЄМО ОБИДВІ ПОЛОСКИ ХП (ВЕРХНЮ ТА В БОЮ)
        document.getElementById('ui-hp-bar').style.width = Math.max(0, (playerChar.hp / playerChar.max_hp)*100) + '%'; 
        document.getElementById('b-p-hp-bar').style.width = Math.max(0, (playerChar.hp / playerChar.max_hp)*100) + '%';
    }
    document.getElementById('b-e-hp').style.width = Math.max(0, (currentEnemy.hp / currentEnemy.maxHp)*100) + '%'; logBattle(`[${s.name}]: завдано ${dmg} урону`, isCrit ? "crit" : "white");
    
    if(s.cd > 0) { skillCooldowns[k] = s.cd; renderBattleSkills(); }
    if (currentEnemy.hp <= 0) { clearInterval(battleTimer); finishBattle(true); return; }

    setTimeout(() => {
        if(currentEnemy.hp <= 0) return;
        
        let isDodge = Math.random() < playerChar.dodge;
        if(isDodge) { 
            logBattle(`💨 Ухилення!`, "cyan"); 
            spawnDamageText('b-p-card', "MISS", "miss"); 
        } 
        else { 
            let eDmg = Math.max(1, currentEnemy.atk - Math.floor(playerChar.totalDef * 1.5)); 
            playerChar.hp -= eDmg; animateElement('enemy-card', 'attack-bounce-reverse'); spawnDamageText('b-p-card', eDmg, "enemy"); 
            
            // ОНОВЛЮЄМО ОБИДВІ ПОЛОСКИ ХП ПРИ ОТРИМАННІ ШКОДИ
            document.getElementById('ui-hp-bar').style.width = Math.max(0, (playerChar.hp / playerChar.max_hp)*100) + '%'; 
            document.getElementById('b-p-hp-bar').style.width = Math.max(0, (playerChar.hp / playerChar.max_hp)*100) + '%';

            screenShake(5); logBattle(`Ворог б'є: -${eDmg} HP`, "red"); 
            
            if(playerChar.thorns > 0) {
                let thrnDmg = Math.floor(eDmg * playerChar.thorns);
                currentEnemy.hp -= thrnDmg; spawnDamageText('enemy-card', thrnDmg, "thrn"); logBattle(`Шипи: ворог отримує ${thrnDmg}`, "purple");
                document.getElementById('b-e-hp').style.width = Math.max(0, (currentEnemy.hp / currentEnemy.maxHp)*100) + '%';
            }
        }
        if (playerChar.hp <= 0) { clearInterval(battleTimer); finishBattle(false); }
        if (currentEnemy.hp <= 0) { clearInterval(battleTimer); finishBattle(true); return; }
    }, 1000);
}

async function finishBattle(w) {
    if (isSurvivalMode) {
        if (!w) {
            showPopup("ВИ ЗАГИНУЛИ", `Тьма поглинула вас на хвилі ${survivalWave}.`, "loss", "☠️");
            setTimeout(() => { location.reload(); }, 2000);
            return;
        }
        const r = await fetch('/api/win_survival', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` }, body: JSON.stringify({ wave: survivalWave }) });
        const d = await r.json();
        if (r.ok) {
            showPopup("ХВИЛЯ ПРОЙДЕНА!", `Отримано: +${d.gold} 🪙\nНовий рекорд: ${d.record}`, "win", "🛡️");
            survivalWave++;
            setTimeout(() => { closePopup(); triggerBattle(survivalWave, survivalWave % 5 === 0); }, 2000);
        }
        return;
    }

    if (!w) { showPopup("ВИ ЗАГИНУЛИ", "Тьма поглинула вас.", "loss", "☠️"); setTimeout(()=>location.reload(), 2000); return; }
    const r = await fetch('/api/win_battle', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('rpg_token')}` }, body: JSON.stringify({ node: playingNode }) });
    const d = await r.json(); if (r.ok) { showPopup("ПЕРЕМОГА!", `Отримано: +${d.gold} 🪙\n${d.diamonds > 0 ? `+${d.diamonds} 💎<br>` : ''}${d.loot && d.loot.length > 0 ? 'Випав лут!' : ''}`, "win", "🏆"); setTimeout(() => { loadPlayerData(); }, 2000); }
}

function spawnDamageText(id, txt, type) { const t = document.getElementById(id); const f = document.createElement('div'); f.className = `floating-text ${type}`; f.innerText = txt; 
    if(type === 'psn') { f.style.color = '#00ff00'; f.style.textShadow = '0 0 5px #00ff00'; }
    if(type === 'thrn') { f.style.color = '#ff00ff'; f.style.textShadow = '0 0 5px #ff00ff'; }
    t.appendChild(f); setTimeout(() => f.remove(), 800); 
}
function screenShake(i = 10) { const a = document.getElementById('battle-screen'); a.style.transform = `translate(${Math.random()*i - i/2}px, ${Math.random()*i - i/2}px)`; setTimeout(() => a.style.transform = 'translate(0,0)', 50); }
function animateElement(id, cls) { const e = document.getElementById(id); e.classList.add(cls); setTimeout(() => e.classList.remove(cls), 300); }
function logBattle(m, c) { const l = document.getElementById('b-log'); const d = document.createElement('div'); d.className = `battle-log-entry log-${c}`; d.innerHTML = m; l.prepend(d); }
window.onload = () => { if (localStorage.getItem('rpg_token')) loadPlayerData(); };