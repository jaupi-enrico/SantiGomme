require("dotenv").config();

const express = require("express");
const { Resend } = require("resend");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

const resend = new Resend(process.env.RESEND_API_KEY);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Route API contatti
app.post("/api/contatti", async (req, res) => {
  const { nome, email, messaggio } = req.body;

  // Validazione base
  if (!nome || !email || !messaggio) {
    return res.status(400).json({
      success: false,
      message: "Tutti i campi sono obbligatori."
    });
  }

  try {
    await resend.emails.send({
      from: "LA SANTI Gomme <onboarding@resend.dev>", 
      to: process.env.EMAIL_USER,
      subject: `Nuovo messaggio da ${nome}`,
      reply_to: email,
      text: `
Nome: ${nome}
Email: ${email}

Messaggio:
${messaggio}
      `
    });

    console.log(`Email inviata da ${nome} <${email}>`);

    return res.status(200).json({
      success: true
    });

  } catch (err) {
    console.error("Errore invio email:", err);

    return res.status(500).json({
      success: false,
      message: "Errore nell'invio dell'email."
    });
  }
});

// Fallback route (serve index.html)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Avvio server
app.listen(port, () => {
  console.log(`Server attivo sulla porta ${port}`);
});