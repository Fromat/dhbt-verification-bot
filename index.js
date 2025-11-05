import express from "express";
import fetch from "node-fetch";

const app = express();

const TOKEN = process.env.BOT_TOKEN; // Telegram bot token
const CHAT_ID = process.env.CHAT_ID; // Kanal ID'si

app.use(express.json());

// ✅ 1. Sunucu kontrol
app.get("/", (req, res) => {
  res.send("DHBT Verification Bot is running ✅");
});

// ✅ 2. Elle test için kanal üyelik doğrulama (senin eski kodun)
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

// ✅ 3. Unity ile eşleştirme için basit veri tabanı (RAM'de tutulur)
const verifiedUsers = {};

// ✅ 4. Telegram'dan gelen mesajları dinle
app.post(`/webhook/${TOKEN}`, async (req, res) => {
  const message = req.body.message;
  if (!message || !message.text) return res.sendStatus(200);

  const chatId = message.chat.id;
  const text = message.text;

  // Kullanıcı /start <uniqueAppId> ile geldiyse
  if (text.startsWith("/start")) {
    const parts = text.split(" ");
    const uniqueAppId = parts[1]; // örn: /start 8b1a9953c4611296a827abf8c47804d7

    if (!uniqueAppId) {
      await fetch(
        `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${chatId}&text=Lütfen uygulama üzerinden doğrulama bağlantısına tıklayın.`
      );
      return res.sendStatus(200);
    }

    // Kanal üyeliğini kontrol et
    try {
      const check = await fetch(
        `https://api.telegram.org/bot${TOKEN}/getChatMember?chat_id=${CHAT_ID}&user_id=${chatId}`
      );
      const data = await check.json();

      if (data.ok && data.result.status !== "left") {
        verifiedUsers[uniqueAppId] = true;
        await fetch(
          `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${chatId}&text=✅ Kanal üyeliğin doğrulandı! Uygulamaya geri dönebilirsin.`
        );
      } else {
        await fetch(
          `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${chatId}&text=❌ Lütfen önce kanala katıl ve sonra tekrar dene.`
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  res.sendStatus(200);
});

// ✅ 5. Botun kayıt ettiği doğrulama sonuçlarını tutmak için endpoint
app.get("/save", (req, res) => {
  const { uniqueId, verified } = req.query;
  if (!uniqueId) return res.json({ success: false });

  verifiedUsers[uniqueId] = verified === "true";
  res.json({ success: true });
});

// ✅ 6. Unity’nin kontrol edeceği endpoint
app.get("/check", (req, res) => {
  const { uniqueId } = req.query;
  const isVerified = verifiedUsers[uniqueId] || false;
  res.json({ verified: isVerified });
});

app.listen(10000, () => console.log("Server started on port 10000"));
