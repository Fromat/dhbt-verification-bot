import express from "express";
import fetch from "node-fetch";

const app = express();

const TOKEN = process.env.BOT_TOKEN;
const DEFAULT_CHAT_ID = process.env.CHAT_ID;

app.get("/", (req, res) => {
  res.send("✅ Telegram Verify API çalışıyor!");
});

app.get("/verify", async (req, res) => {
  const { userId, chatId } = req.query;
  const targetChat = chatId || DEFAULT_CHAT_ID;

  if (!userId) return res.json({ success: false, error: "userId eksik" });

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TOKEN}/getChatMember?chat_id=${targetChat}&user_id=${userId}`
    );
    const data = await response.json();
    console.log("Telegram yanıtı:", data);

    if (data.ok && data.result.status !== "left") {
      res.json({ success: true, message: "✅ Kullanıcı kanalda" });
    } else {
      res.json({ success: false, message: "❌ Kullanıcı kanalda değil" });
    }
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.listen(10000, () => console.log("Server çalışıyor 10000 portunda"));
