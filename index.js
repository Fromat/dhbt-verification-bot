import express from "express";
import fetch from "node-fetch";

const app = express();

const TOKEN = process.env.BOT_TOKEN; // Telegram bot token
const DEFAULT_CHAT_ID = process.env.CHAT_ID; // Eski varsayılan kanal
const CHANNELS = process.env.CHANNEL_IDS
  ? process.env.CHANNEL_IDS.split(",")
  : [DEFAULT_CHAT_ID]; // Çoklu kanal desteği

app.use(express.json());

// ✅ 1. Sunucu kontrol
app.get("/", (req, res) => {
  res.send("DHBT Multi Verification Bot is running ✅");
});

// ✅ Telegram'dan gelen mesajları loglamak için webhook endpoint'i
app.post("/webhook", (req, res) => {
  console.log(JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

// ✅ 2. Elle test için kanal üyelik doğrulama
app.get("/verify", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.json({ success: false, error: "userId required" });

  try {
    const results = await Promise.all(
      CHANNELS.map(async (chatId) => {
        const resp = await fetch(
          `https://api.telegram.org/bot${TOKEN}/getChatMember?chat_id=${chatId}&user_id=${userId}`
        );
        const data = await resp.json();
        return data.ok && data.result.status !== "left";
      })
    );

    const allJoined = results.every((r) => r);
    res.json({
      success: allJoined,
      message: allJoined
        ? "✅ Kullanıcı tüm kanallarda"
        : "❌ Kullanıcı bazı kanallarda yok",
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
});

// ✅ 3. Unity ile eşleştirme için basit veri tabanı (RAM'de tutulur)
const verifiedUsers = {};

// ✅ 4. Telegram webhook /start yakalama
app.post(`/webhook/${TOKEN}`, async (req, res) => {
  const message = req.body.message;
  if (!message || !message.text) return res.sendStatus(200);

  const chatId = message.chat.id;
  const text = message.text;

  if (text.startsWith("/start")) {
    const parts = text.split(" ");
    const uniqueAppId = parts[1];

    if (!uniqueAppId) {
      await fetch(
        `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${chatId}&text=Lütfen uygulama üzerinden doğrulama bağlantısına tıklayın.`
      );
      return res.sendStatus(200);
    }

    try {
      // 🔄 Tüm kanalları sırayla kontrol et
      const results = await Promise.all(
        CHANNELS.map(async (cId) => {
          const check = await fetch(
            `https://api.telegram.org/bot${TOKEN}/getChatMember?chat_id=${cId}&user_id=${chatId}`
          );
          const data = await check.json();
          return data.ok && data.result.status !== "left";
        })
      );

      const allJoined = results.every((r) => r);

      if (allJoined) {
        verifiedUsers[uniqueAppId] = true;
        await fetch(
          `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${chatId}&text=✅ Tüm kanallarda üyeliğin doğrulandı! Uygulamaya geri dönebilirsin.`
        );
      } else {
        await fetch(
          `https://api.telegram.org/bot${TOKEN}/sendMessage?chat_id=${chatId}&text=❌ Lütfen tüm gerekli kanallara katıl ve tekrar dene.`
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

app.listen(10000, () => console.log("✅ Server started on port 10000"));
