import os, random
from datetime import datetime, timezone
from flask import Flask, jsonify, request, render_template
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from database import supabase

load_dotenv()
BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
app = Flask(__name__, template_folder=os.path.join(BASE_DIR, 'frontend', 'templates'), static_folder=os.path.join(BASE_DIR, 'frontend', 'static'))
app.config['JWT_SECRET_KEY'] = os.environ.get("JWT_SECRET_KEY", "super-secret-rpg-key")
jwt = JWTManager(app)

RARITIES = {"Common": {"chance": 0.60, "mult": 1.0, "color": "#a0a0a0", "next": "Uncommon"}, "Uncommon": {"chance": 0.25, "mult": 1.2, "color": "#1eff00", "next": "Rare"}, "Rare": {"chance": 0.10, "mult": 1.5, "color": "#0070dd", "next": "Epic"}, "Epic": {"chance": 0.035, "mult": 2.2, "color": "#a335ee", "next": "Legendary"}, "Legendary": {"chance": 0.01, "mult": 3.5, "color": "#ff8000", "next": "Mythic"}, "Mythic": {"chance": 0.005, "mult": 5.0, "color": "#ff00ff", "next": None}}
PREFIXES = ["Проклятий", "Священний", "Забутий", "Кривавий", "Ефірний", "Астральний", "Тіньовий", "Отрутний", "Шипований"]
SUFFIXES = ["Вогню", "Льоду", "Безодні", "Вампіризму", "Тіней", "Руйнування", "Смерті", "Змії", "Болю"]
BASES = {"weapon": ["Меч", "Посох", "Кинджал", "Лук", "Коса", "Гримуар", "Молот", "Спис"], "armor": ["Нагрудник", "Мантія", "Куртка", "Броня", "Екзоскелет", "Плащ", "Щит"]}

PETS_DB = {
    "Демон": {"stages": ["Яйце", "Малий Демон", "Демон-Вбивця", "Вищий Демон", "Лорд Безодні"], "buff": "vampire"}, 
    "Дракон": {"stages": ["Яйце", "Дракончик", "Юний Дракон", "Вогняний Дракон", "Стародавній Дракон"], "buff": "aoe_dmg"}, 
    "Голем": {"stages": ["Камінь", "Малий Голем", "Залізний Голем", "Сталевий Голем", "Титан"], "buff": "tank_shield"},
    "Привид": {"stages": ["Ектоплазма", "Дух", "Полтергейст", "Жах", "Жнець Душ"], "buff": "dodge"},
    "Фенікс": {"stages": ["Попіл", "Іскра", "Вогняний Птах", "Фенікс", "Безсмертний"], "buff": "aoe_dmg"},
    "Кажан": {"stages": ["Сліпе маля", "Кажан", "Кровопивця", "Вампір", "Носферату"], "buff": "vampire"},
    "Вовк": {"stages": ["Цуценя", "Вовк", "Лютововк", "Перевертень", "Альфа"], "buff": "crit"},
    "Ент": {"stages": ["Насіння", "Саджанець", "Ент", "Древній Ент", "Хранитель Лісу"], "buff": "tank_shield"}
}

SKILLS_DB = {
    "attack": {"name": "Базова атака", "icon": "⚔️", "type": "damage", "mult": 1.0, "cd": 1, "req_lvl": 1, "cost": 100, "desc": "Швидкий удар."},
    "heavy_slash": {"name": "Важкий Розчерк", "icon": "🪓", "type": "damage", "mult": 1.5, "cd": 2, "req_lvl": 2, "cost": 500, "desc": "Сильний удар по броні."},
    "shadow_strike": {"name": "Тіньовий Удар", "icon": "🗡️", "type": "damage", "mult": 2.0, "cd": 3, "req_lvl": 4, "cost": 1500, "desc": "Удар з тіні, велика шкода."},
    "blood_harvest": {"name": "Жнива Крові", "icon": "🩸", "type": "vampire", "mult": 1.5, "cd": 4, "req_lvl": 6, "cost": 3000, "desc": "Викачує здоров'я ворога."},
    "meteor": {"name": "Метеорит", "icon": "☄️", "type": "aoe", "mult": 3.0, "cd": 5, "req_lvl": 10, "cost": 8000, "desc": "Тотальна руйнація."},
    "soul_devour": {"name": "Поглинання Душі", "icon": "👻", "type": "vampire", "mult": 3.5, "cd": 6, "req_lvl": 15, "cost": 15000, "desc": "Відновлює багато ХП."},
    "abyssal_form": {"name": "Форма Безодні", "icon": "🌑", "type": "buff", "mult": 5.0, "cd": 8, "req_lvl": 20, "cost": 30000, "desc": "Ультимативна здатність."}
}

def generate_rng_item(level, item_type="weapon", force_rarity=None):
    roll = random.random(); rarity = force_rarity or "Common"
    if not force_rarity:
        for r, data in RARITIES.items():
            if roll < data["chance"]: rarity = r; break
            else: roll -= data["chance"]
    icon = random.choice(["🗡️", "🪓", "⚔️", "🔥", "🪄"]) if item_type == "weapon" else random.choice(["🛡️", "👘", "🪖", "🧥"])
    name = f"{icon} {random.choice(PREFIXES)} {random.choice(BASES[item_type])} {random.choice(SUFFIXES)}"
    
    extra = {}
    if rarity in ["Uncommon", "Rare", "Epic", "Legendary", "Mythic"]:
        if random.random() > 0.4: extra["crit_chance"] = round(random.uniform(0.05, 0.25), 2)
        if "Вампіризму" in name or "Кривавий" in name: extra["vampire"] = round(random.uniform(0.05, 0.30), 2)
        if "Отрутний" in name or "Змії" in name: extra["poison"] = round(random.uniform(0.02, 0.10), 2)
        if item_type == "armor" and ("Шипований" in name or "Болю" in name): extra["thorns"] = round(random.uniform(0.1, 0.4), 2)

    return {"id": f"item_{random.randint(10000,999999)}", "name": name, "type": item_type, "rarity": rarity, "stat": int(level * 10 * RARITIES[rarity]["mult"] + random.randint(-10, 10)), "color": RARITIES[rarity]["color"], "extra": extra, "upgrade_level": 0}

def get_egg_rarity(tier):
    roll = random.random()
    if tier == 'basic': return "Uncommon" if roll < 0.2 else "Common"
    elif tier == 'epic': return "Legendary" if roll < 0.1 else "Epic" if roll < 0.6 else "Rare"
    elif tier == 'mythic': return "Mythic" if roll < 0.3 else "Legendary"
    return "Common"

@app.route('/')
def index(): return render_template('index.html')

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    try:
        supabase.table('users').insert({"username": data.get('username'), "email": data.get('email'), "password_hash": generate_password_hash(data.get('password'))}).execute()
        return jsonify({"status": "success", "token": create_access_token(identity=data.get('email'))}), 201
    except: return jsonify({"status": "error", "message": "Помилка! Нік/Пошта зайняті."}), 400

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    try:
        user = supabase.table('users').select('*').eq('email', data.get('email')).execute().data[0]
        if check_password_hash(user['password_hash'], data.get('password')): return jsonify({"status": "success", "token": create_access_token(identity=data.get('email')), "username": user['username']}), 200
        return jsonify({"status": "error", "message": "Невірний пароль!"}), 401
    except: return jsonify({"status": "error", "message": "Гравця не знайдено!"}), 404

@app.route('/api/create_character', methods=['POST'])
@jwt_required()
def create_character():
    try:
        user_id = supabase.table('users').select('id').eq('email', get_jwt_identity()).execute().data[0]['id']
        supabase.table('characters').insert({"user_id": user_id, "name": request.json.get('name'), "class_name": request.json.get('class_name'), "hp": 200, "max_hp": 200, "level": 1, "exp": 0, "attack": 20, "defense": 10, "gold": 500, "diamonds": 0, "equipped_skills": ["attack"], "unlocked_skills": {"attack": 1}, "chests": 1, "map_node": 1, "survival_wave": 1, "inventory": [], "pets": [], "achievements_progress": {}, "claimed_achievements": []}).execute()
        return jsonify({"status": "success"}), 201
    except: return jsonify({"status": "error"}), 500

@app.route('/api/me', methods=['GET'])
@jwt_required()
def get_me():
    try:
        user = supabase.table('users').select('id, username').eq('email', get_jwt_identity()).execute().data[0]
        char_data = supabase.table('characters').select('*').eq('user_id', user['id']).execute().data
        if not char_data: return jsonify({"status": "no_character", "username": user['username']}), 200
        return jsonify({"status": "success", "character": char_data[0], "skills_db": SKILLS_DB}), 200
    except Exception as e: return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/buy_shop_item', methods=['POST'])
@jwt_required()
def buy_shop_item():
    try:
        data = request.json
        user_id = supabase.table('users').select('id').eq('email', get_jwt_identity()).execute().data[0]['id']
        char = supabase.table('characters').select('*').eq('user_id', user_id).execute().data[0]
        if char['gold'] < data['price']: return jsonify({"status": "error", "message": "Недостатньо золота!"}), 400
        new_item = {"id": f"item_{random.randint(100000,999999)}", "name": data['name'], "type": data['type'], "rarity": data['rarity'], "stat": data['stat'], "color": RARITIES.get(data['rarity'], {}).get("color", "#fff"), "extra": data.get('extra', {}), "upgrade_level": 0}
        inv = char.get('inventory', []); inv.append(new_item)
        supabase.table('characters').update({"gold": char['gold'] - data['price'], "inventory": inv}).eq('id', char['id']).execute()
        return jsonify({"status": "success", "message": f"Придбано: {new_item['name']}!"}), 200
    except Exception as e: return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/sell_rng', methods=['POST'])
@jwt_required()
def sell_rng():
    try:
        user_id = supabase.table('users').select('id').eq('email', get_jwt_identity()).execute().data[0]['id']
        char = supabase.table('characters').select('*').eq('user_id', user_id).execute().data[0]; inv = char.get('inventory', [])
        if request.json['id'] in [char.get('weapon'), char.get('armor')]: return jsonify({"status": "error", "message": "Зніміть предмет перед продажем!"}), 400
        item = next((i for i in inv if i.get('id') == request.json['id']), None)
        if not item: return jsonify({"status": "error", "message": "Не знайдено!"}), 400
        inv.remove(item); prices = {"Common": 25, "Uncommon": 75, "Rare": 200, "Epic": 600, "Legendary": 1500, "Mythic": 5000}; earned = prices.get(item.get('rarity'), 10)
        supabase.table('characters').update({"gold": char['gold'] + earned, "inventory": inv}).eq('id', char['id']).execute()
        return jsonify({"status": "success", "message": f"Отримано {earned} 🪙!"}), 200
    except Exception as e: return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/buy_skill', methods=['POST'])
@jwt_required()
def buy_skill():
    try:
        user_id = supabase.table('users').select('id').eq('email', get_jwt_identity()).execute().data[0]['id']
        char = supabase.table('characters').select('*').eq('user_id', user_id).execute().data[0]; skill_id = request.json.get('id'); s_db = SKILLS_DB.get(skill_id)
        if not s_db: return jsonify({"status": "error", "message": "Навичку не знайдено!"}), 400
        unlocked = char.get('unlocked_skills', {})
        if skill_id in unlocked:
            cost = s_db['cost'] * (unlocked[skill_id] + 1)
            if char['gold'] < cost: return jsonify({"status": "error", "message": f"Потрібно {cost} 🪙"}), 400
            unlocked[skill_id] += 1
            supabase.table('characters').update({"gold": char['gold'] - cost, "unlocked_skills": unlocked}).eq('id', char['id']).execute()
            return jsonify({"status": "success", "message": f"Навичку прокачано до {unlocked[skill_id]} рівня!"}), 200
        else:
            if char['level'] < s_db['req_lvl']: return jsonify({"status": "error", "message": f"Потрібен {s_db['req_lvl']} рівень!"}), 400
            if char['gold'] < s_db['cost']: return jsonify({"status": "error", "message": f"Потрібно {s_db['cost']} 🪙"}), 400
            unlocked[skill_id] = 1
            supabase.table('characters').update({"gold": char['gold'] - s_db['cost'], "unlocked_skills": unlocked}).eq('id', char['id']).execute()
            return jsonify({"status": "success", "message": "Навичку відкрито!"}), 200
    except Exception as e: return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/equip', methods=['POST'])
@jwt_required()
def equip_item():
    data = request.json
    try:
        user_id = supabase.table('users').select('id').eq('email', get_jwt_identity()).execute().data[0]['id']
        char = supabase.table('characters').select('*').eq('user_id', user_id).execute().data[0]; update_data = {}; msg = "Екіпіровано!"
        if data['type'] in ['weapon', 'armor']: update_data[data['type']] = data['id']
        elif data['type'] == 'pet': update_data['active_pet'] = data['id']; msg = "Супутника викликано!"
        elif data['type'] == 'skill':
            skills = char.get('equipped_skills', [])
            if isinstance(skills, str): skills = [s.strip(' "{}\'[\]') for s in skills.split(',')] if skills not in ['{}', ''] else []
            skills = [s for s in skills if s in SKILLS_DB]
            if data['id'] in skills: skills.remove(data['id']); msg = "Навичку знято!"
            else:
                if len(skills) >= 4: return jsonify({"status": "error", "message": "Максимум 4 навички!"}), 400
                skills.append(data['id']); msg = "Навичку додано в Гримуар!"
            update_data['equipped_skills'] = skills
        supabase.table('characters').update(update_data).eq('id', char['id']).execute()
        return jsonify({"status": "success", "message": msg}), 200
    except Exception as e: return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/buy_egg', methods=['POST'])
@jwt_required()
def buy_egg():
    try:
        user_id = supabase.table('users').select('id').eq('email', get_jwt_identity()).execute().data[0]['id']
        char = supabase.table('characters').select('*').eq('user_id', user_id).execute().data[0]
        egg_tier = request.json.get('tier'); prices = {'basic': 1000, 'epic': 5000, 'mythic': 25000}
        cost = prices.get(egg_tier, 1000)
        
        if char['gold'] < cost: return jsonify({"status": "error", "message": f"Потрібно {cost} 🪙"}), 400
        
        rarity = get_egg_rarity(egg_tier)
        pet_type = random.choice(list(PETS_DB.keys()))
        new_pet = {
            "id": f"pet_{random.randint(10000,99999)}", "type": pet_type, "name": f"Яйце ({pet_type})",
            "rarity": rarity, "color": RARITIES[rarity]["color"], "stage": 1, "exp": 0, "buff": PETS_DB[pet_type]["buff"], "passives": []
        }
        
        pets = char.get('pets', []); pets.append(new_pet)
        supabase.table('characters').update({"gold": char['gold'] - cost, "pets": pets}).eq('id', char['id']).execute()
        return jsonify({"status": "success", "pet": new_pet}), 200
    except Exception as e: return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/learn_pet_passive', methods=['POST'])
@jwt_required()
def learn_pet_passive():
    try:
        user_id = supabase.table('users').select('id').eq('email', get_jwt_identity()).execute().data[0]['id']
        char = supabase.table('characters').select('*').eq('user_id', user_id).execute().data[0]
        pet_id = request.json.get('pet_id'); passive = request.json.get('passive')
        pets = char.get('pets', []); pet_idx = next((i for i, p in enumerate(pets) if p['id'] == pet_id), None)
        
        if pet_idx is None: return jsonify({"status": "error", "message": "Пета не знайдено!"}), 400
        
        pet = pets[pet_idx]
        max_passives = 2 if pet.get('stage', 1) >= 20 else 1 if pet.get('stage', 1) >= 10 else 0
        current_passives = pet.get('passives', [])
        
        if len(current_passives) >= max_passives: return jsonify({"status": "error", "message": "Досягнуто ліміт навичок!"}), 400
        if passive in current_passives: return jsonify({"status": "error", "message": "Навичка вже вивчена!"}), 400
        
        current_passives.append(passive)
        pets[pet_idx]['passives'] = current_passives
        supabase.table('characters').update({"pets": pets}).eq('id', char['id']).execute()
        return jsonify({"status": "success", "message": "Пасивну навичку вивчено!"}), 200
    except Exception as e: return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/feed_pet', methods=['POST'])
@jwt_required()
def feed_pet():
    try:
        user_id = supabase.table('users').select('id').eq('email', get_jwt_identity()).execute().data[0]['id']
        char = supabase.table('characters').select('*').eq('user_id', user_id).execute().data[0]
        pet_id = request.json.get('id'); pets = char.get('pets', [])
        pet_idx = next((i for i, p in enumerate(pets) if p['id'] == pet_id), None)
        if pet_idx is None: return jsonify({"status": "error", "message": "Пета не знайдено!"}), 400
        if char['gold'] < 200: return jsonify({"status": "error", "message": "Годування коштує 200 🪙"}), 400
        
        pets[pet_idx]['exp'] = pets[pet_idx].get('exp', 0) + random.randint(40, 80)
        stg = pets[pet_idx].get('stage', 1); lvl_req = stg * 100; msg = "Пет поїв і отримав EXP!"
        
        if pets[pet_idx]['exp'] >= lvl_req:
            stg += 1; pets[pet_idx]['stage'] = stg; pets[pet_idx]['exp'] = 0; stages = PETS_DB[pets[pet_idx]['type']]['stages']
            if stg >= 20 and len(stages) > 4: pets[pet_idx]['name'] = stages[4]
            elif stg >= 15 and len(stages) > 3: pets[pet_idx]['name'] = stages[3]
            elif stg >= 10 and len(stages) > 2: pets[pet_idx]['name'] = stages[2]
            elif stg >= 5 and len(stages) > 1: pets[pet_idx]['name'] = stages[1]
            else: pets[pet_idx]['name'] = stages[0]
            msg = f"🌟 Ваш пет підвищив рівень до {stg}!"

        supabase.table('characters').update({"gold": char['gold'] - 200, "pets": pets}).eq('id', char['id']).execute()
        return jsonify({"status": "success", "message": msg}), 200
    except Exception as e: return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/open_chest', methods=['POST'])
@jwt_required()
def open_chest():
    try:
        user_id = supabase.table('users').select('id').eq('email', get_jwt_identity()).execute().data[0]['id']
        char = supabase.table('characters').select('*').eq('user_id', user_id).execute().data[0]
        if char.get('chests', 0) <= 0:
            if char.get('gold', 0) < 500: return jsonify({"status": "error", "message": "Немає скринь або золота!"}), 400
            char['gold'] -= 500
        else: char['chests'] -= 1
        new_item = generate_rng_item(char['level'], random.choice(["weapon", "armor"])); inv = char.get('inventory', []); inv.append(new_item)
        supabase.table('characters').update({"chests": char['chests'], "gold": char['gold'], "inventory": inv}).eq('id', char['id']).execute()
        return jsonify({"status": "success", "item": new_item}), 200
    except Exception as e: return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/claim_achievement', methods=['POST'])
@jwt_required()
def claim_achievement():
    try:
        user_id = supabase.table('users').select('id').eq('email', get_jwt_identity()).execute().data[0]['id']
        char = supabase.table('characters').select('*').eq('user_id', user_id).execute().data[0]
        ach_id = request.json.get('id'); reward = request.json.get('reward')
        claimed = char.get('claimed_achievements', [])
        if ach_id in claimed: return jsonify({"status": "error", "message": "Вже забрано!"}), 400
        claimed.append(ach_id)
        supabase.table('characters').update({"diamonds": char.get('diamonds', 0) + reward, "claimed_achievements": claimed}).eq('id', char['id']).execute()
        return jsonify({"status": "success", "message": f"Отримано {reward} 💎!"}), 200
    except Exception as e: return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/win_battle', methods=['POST'])
@jwt_required()
def win_battle():
    node = int(request.json.get('node', 1)); is_boss = node % 5 == 0
    try:
        user_id = supabase.table('users').select('id').eq('email', get_jwt_identity()).execute().data[0]['id']
        char = supabase.table('characters').select('*').eq('user_id', user_id).execute().data[0]
        
        exp_gain = 100 if is_boss else 40
        new_exp = char.get('exp', 0) + exp_gain
        new_lvl = char.get('level', 1)
        new_max_hp = char.get('max_hp', 200)
        
        if new_exp >= new_lvl * 100:
            new_lvl += 1
            new_exp = new_exp - ((new_lvl - 1) * 100)
            new_max_hp += 20
            
        # ПІДНЯВ ЗОЛОТО
        if is_boss:
            gold_reward = random.randint(500, 1000) + (node * 100)
        else:
            gold_reward = random.randint(200, 500) + (node * 20)
            
        diamonds_gained = 0
        if is_boss and random.random() < 0.5: diamonds_gained = random.randint(5, 15)
        elif random.random() < 0.1: diamonds_gained = random.randint(1, 3)

        inv = char.get('inventory', []); dropped_items = []
        if random.random() < (1.0 if is_boss else 0.3): 
            new_item = generate_rng_item(new_lvl, random.choice(["weapon", "armor"]))
            inv.append(new_item); dropped_items.append(new_item)
        
        current_node = char.get('map_node', 1); current_node = current_node + 1 if node == current_node and current_node < 50 else current_node
        
        prog = char.get('achievements_progress', {}); prog['kills'] = prog.get('kills', 0) + 1
        if is_boss: prog['boss_kills'] = prog.get('boss_kills', 0) + 1
        prog['max_node'] = max(prog.get('max_node', 1), current_node)

        supabase.table('characters').update({
            "gold": char['gold'] + gold_reward, 
            "diamonds": char.get('diamonds', 0) + diamonds_gained, 
            "level": new_lvl, 
            "exp": new_exp,
            "max_hp": new_max_hp,
            "hp": new_max_hp, 
            "inventory": inv, 
            "map_node": current_node, 
            "achievements_progress": prog
        }).eq('id', char['id']).execute()
        
        return jsonify({"status": "success", "gold": gold_reward, "diamonds": diamonds_gained, "loot": dropped_items}), 200
    except Exception as e: return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/win_survival', methods=['POST'])
@jwt_required()
def win_survival():
    wave = int(request.json.get('wave', 1))
    try:
        user_id = supabase.table('users').select('id').eq('email', get_jwt_identity()).execute().data[0]['id']
        char = supabase.table('characters').select('*').eq('user_id', user_id).execute().data[0]
        
        new_exp = char.get('exp', 0) + 25
        new_lvl = char.get('level', 1)
        new_max_hp = char.get('max_hp', 200)
        
        if new_exp >= new_lvl * 100:
            new_lvl += 1
            new_exp = new_exp - ((new_lvl - 1) * 100)
            new_max_hp += 20
            
        gold_reward = random.randint(100, 250) + (wave * 25)
        current_record = char.get('survival_wave', 1)
        if wave > current_record: current_record = wave
        
        supabase.table('characters').update({
            "gold": char['gold'] + gold_reward, 
            "survival_wave": current_record, 
            "level": new_lvl,
            "exp": new_exp,
            "max_hp": new_max_hp,
            "hp": new_max_hp
        }).eq('id', char['id']).execute()
        
        return jsonify({"status": "success", "gold": gold_reward, "record": current_record}), 200
    except Exception as e: return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/merge', methods=['POST'])
@jwt_required()
def merge_items():
    data = request.json
    try:
        user_id = supabase.table('users').select('id').eq('email', get_jwt_identity()).execute().data[0]['id']
        char = supabase.table('characters').select('*').eq('user_id', user_id).execute().data[0]; inv = char.get('inventory', [])
        target_rarity = data.get('rarity'); target_type = data.get('type')
        matching_items = [i for i in inv if i.get('rarity') == target_rarity and i.get('type') == target_type and i.get('id') not in [char.get('weapon'), char.get('armor')]]
        if len(matching_items) < 5: return jsonify({"status": "error", "message": "Потрібно 5 однакових предметів!"}), 400
        next_rarity = RARITIES[target_rarity]["next"]
        if not next_rarity: return jsonify({"status": "error", "message": "Це максимальна рідкість!"}), 400
        for i in range(5): inv.remove(matching_items[i])
        new_item = generate_rng_item(char['level'], target_type, forced_rarity=next_rarity); new_item['name'] = f"✨ Злитий {new_item['name']}"; inv.append(new_item)
        supabase.table('characters').update({"inventory": inv}).eq('id', char['id']).execute()
        return jsonify({"status": "success", "item": new_item}), 200
    except Exception as e: return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/upgrade', methods=['POST'])
@jwt_required()
def upgrade_item():
    data = request.json
    try:
        user_id = supabase.table('users').select('id').eq('email', get_jwt_identity()).execute().data[0]['id']
        char = supabase.table('characters').select('*').eq('user_id', user_id).execute().data[0]; inv = char.get('inventory', []); item_id = data.get('id')
        item_idx = next((i for i, item in enumerate(inv) if item['id'] == item_id), None)
        if item_idx is None: return jsonify({"status": "error", "message": "Предмет не знайдено!"}), 400
        if char['gold'] < 1000: return jsonify({"status": "error", "message": "Потрібно 1000 🪙 для зачарування!"}), 400
        inv[item_idx]['upgrade_level'] = inv[item_idx].get('upgrade_level', 0) + 1; inv[item_idx]['stat'] = int(inv[item_idx]['stat'] * 1.15)
        if f"+{inv[item_idx]['upgrade_level']-1}" in inv[item_idx]['name']: inv[item_idx]['name'] = inv[item_idx]['name'].replace(f"+{inv[item_idx]['upgrade_level']-1}", f"+{inv[item_idx]['upgrade_level']}")
        else: inv[item_idx]['name'] = f"{inv[item_idx]['name']} +1"
        supabase.table('characters').update({"inventory": inv, "gold": char['gold'] - 1000}).eq('id', char['id']).execute()
        return jsonify({"status": "success", "message": f"Зачаровано до +{inv[item_idx]['upgrade_level']}!"}), 200
    except Exception as e: return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__': app.run(debug=True, port=5000)