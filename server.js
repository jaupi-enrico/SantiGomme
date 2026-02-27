require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/contatti', async (req, res) => {
  const { nome, email, messaggio } = req.body;
  if (!nome || !email || !messaggio) return res.status(400).json({ success: false });

  try {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,       
        secure: true,  
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"${nome}" <${email}>`,
      to: process.env.EMAIL_USER,
      subject: `Nuovo messaggio da ${nome}`,
      text: messaggio
    });

    console.log(`Email inviata da ${nome} <${email}>`);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Errore invio email:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(port, () => console.log(`Server attivo sulla porta ${port}`));