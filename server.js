require('dotenv').config(); // carica .env

const express = require('express');
const nodemailer = require('nodemailer');
const app = express();

app.use(express.json());
app.use(express.static('public'));

app.post('/api/contatti', async (req, res) => {
  const {nome, email, messaggio} = req.body;
  try {
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      }
    });

    await transporter.sendMail({
      from: email,
      to: process.env.EMAIL_USER,
      subject: `Nuovo messaggio da ${nome}`,
      text: messaggio
    });

    res.status(200).json({success:true});
  } catch(err){
    console.error(err);
    res.status(500).json({success:false});
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server attivo su http://localhost:${port}`));