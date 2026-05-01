import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Завантажуємо ключі з файлу .env
load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise ValueError("Supabase URL або Key відсутні у файлі .env!")

# Створюємо клієнт для доступу до БД
supabase: Client = create_client(url, key)