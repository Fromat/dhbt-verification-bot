import os
from flask import Flask, request
import requests

app = Flask(__name__)

BOT_TOKEN = os.getenv("BOT_TOKEN")
CHANNEL_ID = "@DHBTKanal"  # Buraya kendi kanal kullanıcı adını yaz, başına @ koy

@app.route('/')
def home():
    return "✅ DHBT Kontrol Botu Çalışıyor"

@app.route('/check', methods=['GET'])
def check_membership():
    user_id = request.args.get('user_id')
    if not user_id:
        return {"success": False, "error": "user_id eksik"}, 400

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/getChatMember"
    params = {"chat_id": CHANNEL_ID, "user_id": user_id}
    res = requests.get(url, params=params).json()

    status = res.get("result", {}).get("status", "")
    if status in ["member", "administrator", "creator"]:
        return {"success": True, "verified": True}
    else:
        return {"success": True, "verified": False}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
