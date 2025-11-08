import express from "express";
import fetch from "node-fetch";

const app = express();

const TOKEN = process.env.BOT_TOKEN; // Telegram bot token
const DEFAULT_CHAT_ID = process.env.CHAT_ID; // Tek kanal ID'si (ör: -1001234567890)

app.use(express.json());

// ✅ Sunucu test
app.get("/", (req, res) => {
  res.send("DHBT Verification Bot is running ✅");
});

// ✅ Telegram’dan gelen webhook verisi (isteğe bağlı log)
app.post("/webhook", (req, res) => {
  console.log("📩 Telegram update:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

// replace your existing /verify handler with this debug version
app.get("/verify", async (req, res) => {
  const { userId, chatId } = req.query;
  if (!userId) return res.status(400).json({ success: false, error: "userId required" });

  const targetChat = chatId || DEFAULT_CHAT_ID;
  try {
    const resp = await fetch(
      `https://api.telegram.org/bot${TOKEN}/getChatMember?chat_id=${encodeURIComponent(targetChat)}&user_id=${encodeURIComponent(userId)}`
    );
    const data = await resp.json();

    // log both in server logs and return to client for debugging
    console.log("DEBUG getChatMember response:", JSON.stringify(data, null, 2));
    return res.status(200).json({ debug: true, chatId: targetChat, userId, telegramResponse: data });
  } catch (err) {
    console.error("DEBUG Telegram API error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});


// ✅ Unity'den gelen doğrulama isteği
// Örnek: /check?userId=123456789&chatId=-1001234567890
app.get("/check", async (req, res) => {
  const { userId, chatId } = req.query;
  if (!userId) return res.json({ success: false, error: "userId is required" });

  const CHAT_ID = chatId || DEFAULT_CHAT_ID;

  try {
    const resp = await fetch(
      `https://api.telegram.org/bot${TOKEN}/getChatMember?chat_id=${CHAT_ID}&user_id=${userId}`
    );
    const data = await resp.json();

    if (data.ok && data.result.status !== "left" && data.result.status !== "kicked") {
      res.json({ success: true, verified: true, message: "✅ Kullanıcı kanalda" });
    } else {
      res.json({ success: true, verified: false, message: "❌ Kullanıcı kanalda değil" });
    }
  } catch (err) {
    console.error("❌ Telegram API error:", err);
    res.json({ success: false, error: err.message });
  }
});

app.listen(10000, () => console.log("Server started on port 10000 ✅"));
