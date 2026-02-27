/**
 * ===========================================
 * LA SANTI Gomme srl - Server Express
 * ===========================================
 * Server web sicuro con best practices di sicurezza
 * Versione: 2.0.0
 */

require("dotenv").config();

const express = require("express");
const { Resend } = require("resend");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const xss = require("xss");
const hpp = require("hpp");

const app = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

// ============================================
// VALIDAZIONE CONFIGURAZIONE
// ============================================
const apiKey = process.env.RESEND_API_KEY;
const emailUser = process.env.EMAIL_USER;

if (!apiKey) {
  console.error("❌ RESEND_API_KEY mancante!");
  process.exit(1);
}

if (!emailUser) {
  console.error("❌ EMAIL_USER mancante!");
  process.exit(1);
}

const resend = new Resend(apiKey);

// ============================================
// MIDDLEWARE DI SICUREZZA
// ============================================

// Helmet - Headers di sicurezza HTTP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      frameSrc: ["https://www.google.com"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// HPP - Protezione HTTP Parameter Pollution
app.use(hpp());

// Rate Limiting generale
const limiterGenerale = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // max 100 richieste per IP
  message: {
    success: false,
    message: "Troppe richieste, riprova più tardi."
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiterGenerale);

// Rate Limiting specifico per API contatti (anti-spam)
const limiterContatti = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 5, // max 5 messaggi per IP all'ora
  message: {
    success: false,
    message: "Hai inviato troppi messaggi. Riprova tra un'ora."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware per parsing con limiti
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// File statici con cache headers
app.use(express.static(path.join(__dirname, "public"), {
  maxAge: isProduction ? "1d" : 0,
  etag: true,
  lastModified: true,
}));

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Sanitizza input per prevenire XSS
 */
function sanitizeInput(input) {
  if (typeof input !== "string") return "";
  return xss(input.trim());
}

/**
 * Valida formato email
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Log strutturato
 */
function logEvent(type, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, type, message, ...data };
  console.log(JSON.stringify(logEntry));
}

// ============================================
// ROUTES API
// ============================================

// Validatori per il form contatti
const validatoriContatti = [
  body("nome")
    .trim()
    .notEmpty().withMessage("Il nome è obbligatorio.")
    .isLength({ min: 2, max: 100 }).withMessage("Il nome deve essere tra 2 e 100 caratteri.")
    .matches(/^[a-zA-ZàèéìòùÀÈÉÌÒÙ\s'-]+$/).withMessage("Il nome contiene caratteri non validi."),
  body("email")
    .trim()
    .normalizeEmail()
    .notEmpty().withMessage("L'email è obbligatoria.")
    .isEmail().withMessage("Inserisci un indirizzo email valido."),
  body("messaggio")
    .trim()
    .notEmpty().withMessage("Il messaggio è obbligatorio.")
    .isLength({ min: 10, max: 2000 }).withMessage("Il messaggio deve essere tra 10 e 2000 caratteri."),
];

// Route API contatti con rate limiting specifico
app.post("/api/contatti", limiterContatti, validatoriContatti, async (req, res) => {
  // Verifica errori di validazione
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array()
    });
  }

  // Sanitizza input
  const nome = sanitizeInput(req.body.nome);
  const email = sanitizeInput(req.body.email);
  const messaggio = sanitizeInput(req.body.messaggio);

  // Double-check validazione email
  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Indirizzo email non valido."
    });
  }

  try {
    await resend.emails.send({
      from: "LA SANTI Gomme <onboarding@resend.dev>",
      to: emailUser,
      subject: `[Sito Web] Nuovo messaggio da ${nome}`,
      reply_to: email,
      text: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NUOVO MESSAGGIO DAL SITO WEB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nome: ${nome}
Email: ${email}
Data: ${new Date().toLocaleString("it-IT", { timeZone: "Europe/Rome" })}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MESSAGGIO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${messaggio}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `
    });

    logEvent("INFO", "Email inviata con successo", { nome, email: email.substring(0, 3) + "***" });

    return res.status(200).json({
      success: true,
      message: "Messaggio inviato correttamente!"
    });

  } catch (err) {
    logEvent("ERROR", "Errore invio email", { error: err.message });

    return res.status(500).json({
      success: false,
      message: "Errore nell'invio dell'email. Riprova più tardi."
    });
  }
});

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 - Pagina non trovata (per API)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: "Endpoint non trovato."
    });
  }
  next();
});

// Fallback route - 404 per pagine non trovate
app.use((req, res) => {
  // Se la richiesta non è per un file statico e non è un'API, mostro 404
  res.status(404).sendFile(path.join(__dirname, "public", "index.html"));
});

// Global error handler
app.use((err, req, res, next) => {
  logEvent("ERROR", "Errore server", { error: err.message, stack: isProduction ? undefined : err.stack });
  
  res.status(500).json({
    success: false,
    message: "Si è verificato un errore interno. Riprova più tardi."
  });
});

// ============================================
// AVVIO SERVER
// ============================================
app.listen(port, () => {
  logEvent("INFO", `Server avviato`, { port, environment: isProduction ? "production" : "development" });
  console.log(` Server attivo sulla porta ${port}`);
  console.log(` Ambiente: ${isProduction ? "PRODUZIONE" : "SVILUPPO"}`);
});