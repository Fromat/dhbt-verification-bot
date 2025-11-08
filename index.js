import express from "express";
const app = express();

app.get("/", (req, res) => {
  res.send("Telegram bot çalışıyor!");
});

app.get("/verify", async (req, res) => {
  const { userId, chatId } = req.query;
  // Telegram API kontrolü
  const response = await fetch(
    `https://api.telegram.org/bot${process.env.BOT_TOKEN}/getChatMember?chat_id=${chatId}&user_id=${userId}`
  );
  const data = await response.json();
  res.json(data);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server ${port} portunda çalışıyor`));
