import express from "express";
import fetch from "node-fetch";

const app = express();

const TOKEN = process.env.BOT_TOKEN; // Telegram bot token
const CHAT_ID = process.env.CHAT_ID; // Kanal ID'si

app.get("/", (req, res) => {
  res.send("DHBT Verification Bot is running ✅");
});

// Kullanıcıyı doğrulama endpoint'i
app.get("/verify", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.json({ success: false, error: "userId required" });

  try {
    const resp = await fetch(
      `https://api.telegram.org/bot${TOKEN}/getChatMember?chat_id=${CHAT_ID}&user_id=${userId}`
    );
    const data = await resp.json();

    if (data.ok && data.result.status !== "left") {
      res.json({ success: true, message: "Kullanıcı kanalda ✅" });
    } else {
      res.json({ success: false, message: "Kullanıcı kanalda değil ❌" });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
});

app.listen(10000, () => console.log("Server started on port 10000"));
