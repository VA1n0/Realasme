import os, random
from flask import Flask, jsonify, request, render_template
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from database import supabase

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, 
            template_folder=os.path.join(BASE_DIR, 'templates'), 
            static_folder=os.path.join(BASE_DIR, 'static'))

app.config['JWT_SECRET_KEY'] = os.environ.get("JWT_SECRET_KEY", "super-secret-rpg-key")
jwt = JWTManager(app)

# --- ОНОВЛЕНИЙ БАЛАНС РІДКОСТІ ---
# mult: множник сили, price: базова ціна
RARITIES = {
    "Common":    {"chance": 0.50, "mult": 1.0, "price": 100,   "color": "#a0a0a0", "next": "Uncommon"},
    "Uncommon":  {"chance": 0.25, "mult": 1.8, "price": 400,   "color": "#1eff00", "next": "Rare"},
    "Rare":      {"chance": 0.15, "mult": 3.2, "price": 1200,  "color": "#0070dd", "next": "Epic"},
    "Epic":      {"chance": 0.07, "mult": 5.5, "price": 4500,  "color": "#a335ee", "next": "Legendary"},
    "Legendary": {"chance": 0.02, "mult": 9.5, "price": 15000, "color": "#ff8000", "next": "Mythic"},
    "Mythic":    {"chance": 0.01, "mult": 16.0, "price": 50000, "color": "#ff00ff", "next": None}
}

PREFIXES = ["Проклятий", "Священний", "Забутий", "Кривавий", "Ефірний", "Астральний", "Тіньовий", "Отрутний", "Шипований"]
SUFFIXES = ["Вогню", "Льоду", "Безодні", "Вампіризму", "Тіней", "Руйнування", "Смерті", "Змії", "Болю"]
BASES = {
    "weapon": ["Меч", "Посох", "Кинджал", "Лук", "Коса", "Гримуар", "Молот", "Спис"],
    "armor": ["Нагрудник", "Мантія", "Куртка", "Броня", "Екзоскелет", "Плащ", "Щит"]
}

def generate_rng_item(level, item_type="weapon", force_rarity=None):
    roll = random.random()
    rarity = force_rarity or "Common"
    if not force_rarity:
        for r, data in RARITIES.items():
            if roll < data["chance"]: rarity = r; break
            else: roll -= data["chance"]
    
    # Виправлений розрахунок статів: стат = (рівень * база) * множник рідкості
    # Тепер рарка за 1200 завжди буде краща за анкамонку за 400
    base_stat = 15 if item_type == "weapon" else 10
    stat = int((level * base_stat) * RARITIES[rarity]["mult"] + random.randint(1, 10))
    
    icon = "🗡️" if item_type == "weapon" else "🛡️"
    name = f"{icon} {random.choice(PREFIXES)} {random.choice(BASES[item_type])} {random.choice(SUFFIXES)}"
    
    return {
        "id": f"item_{random.randint(10000,999999)}", 
        "name": name, "type": item_type, "rarity": rarity, 
        "stat": stat, "price": RARITIES[rarity]["price"],
        "color": RARITIES[rarity]["color"], "upgrade_level": 0
    }

# --- МАРШРУТИ ---

@app.route('/')
def index(): return render_template('index.html')

@app.route('/api/buy_shop_item', methods=['POST'])
@jwt_required()
def buy_shop_item():
    try:
        data = request.json # {name, type, rarity, stat, price, equip_now}
        user_id = supabase.table('users').select('id').eq('email', get_jwt_identity()).execute().data[0]['id']
        char = supabase.table('characters').select('*').eq('user_id', user_id).execute().data[0]
        
        if char['gold'] < data['price']:
            return jsonify({"status": "error", "message": "Недостатньо золота!"}), 400
        
        new_item = {
            "id": f"item_{random.randint(100000,999999)}", "name": data['name'], "type": data['type'], 
            "rarity": data['rarity'], "stat": data['stat'], "color": RARITIES[data['rarity']]['color'], "upgrade_level": 0
        }
        
        inv = char.get('inventory', [])
        inv.append(new_item)
        
        update_fields = {"gold": char['gold'] - data['price'], "inventory": inv}
        
        # ЛОГІКА "ОДЯГТИ ВІДРАЗУ"
        if data.get('equip_now'):
            update_fields[data['type']] = new_item['id']

        supabase.table('characters').update(update_fields).eq('id', char['id']).execute()
        return jsonify({"status": "success", "message": f"Придбано: {new_item['name']}!"}), 200
    except Exception as e: return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/win_survival', methods=['POST'])
@jwt_required()
def win_survival():
    wave = int(request.json.get('wave', 1))
    try:
        user_id = supabase.table('users').select('id').eq('email', get_jwt_identity()).execute().data[0]['id']
        char = supabase.table('characters').select('*').eq('user_id', user_id).execute().data[0]
        
        # Нагорода тепер росте нелінійно
        gold_reward = int(150 * (1.15 ** wave)) + (wave * 30)
        exp_gain = 30 + (wave * 5)
        
        # Шанс на дроп скрині кожні 5 хвиль
        new_chests = char.get('chests', 0)
        if wave % 5 == 0: new_chests += 1
        
        new_record = max(char.get('survival_wave', 1), wave)
        
        supabase.table('characters').update({
            "gold": char['gold'] + gold_reward,
            "exp": char['exp'] + exp_gain,
            "chests": new_chests,
            "survival_wave": new_record
        }).eq('id', char['id']).execute()
        
        return jsonify({"status": "success", "gold": gold_reward, "chests": new_chests > char.get('chests', 0)}), 200
    except Exception as e: return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/claim_achievement', methods=['POST'])
@jwt_required()
def claim_achievement():
    try:
        ach_id = request.json.get('id')
        user_id = supabase.table('users').select('id').eq('email', get_jwt_identity()).execute().data[0]['id']
        char = supabase.table('characters').select('*').eq('user_id', user_id).execute().data[0]
        
        claimed = char.get('claimed_achievements', [])
        if ach_id in claimed: return jsonify({"status": "error", "message": "Вже забрано!"}), 400
        
        # Логіка перевірки виконання (наприклад, kills_50)
        prog = char.get('achievements_progress', {})
        req_type, req_val = ach_id.split('_') # "kills", "50"
        
        if prog.get(req_type, 0) < int(req_val):
            return jsonify({"status": "error", "message": "Ще не виконано!"}), 400
            
        claimed.append(ach_id)
        reward = 50 # Базова нагорода
        supabase.table('characters').update({
            "diamonds": char.get('diamonds', 0) + reward,
            "claimed_achievements": claimed
        }).eq('id', char['id']).execute()
        
        return jsonify({"status": "success", "reward": reward}), 200
    except Exception as e: return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
