/**
 * ===========================================
 * LA SANTI Gomme srl - Server Express
 * ===========================================
 * Server web con hardening sicurezza e validazioni robuste
 * Versione: 2.0.0
 */

require("dotenv").config();

const express = require("express");
const { Resend } = require("resend");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { body, matchedData, validationResult } = require("express-validator");
const xss = require("xss");
const hpp = require("hpp");

const app = express();
const port = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";
const appName = "LA SANTI Gomme srl";
const appRoot = path.join(__dirname, "public");

const requiredEnvKeys = ["RESEND_API_KEY", "EMAIL_USER"];
const missingEnvKeys = requiredEnvKeys.filter((key) => !process.env[key]);

if (missingEnvKeys.length > 0) {
  console.error(`Variabili ambiente mancanti: ${missingEnvKeys.join(", ")}`);
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

function logEvent(level, message, data = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  };
  console.log(JSON.stringify(payload));
}

function sanitizeText(value) {
  if (typeof value !== "string") return "";
  return xss(value).replace(/[\u0000-\u001F\u007F]/g, "").trim();
}

function maskEmail(value) {
  if (!value || typeof value !== "string") return "***";
  const [localPart, domain] = value.split("@");
  if (!localPart || !domain) return "***";
  return `${localPart.slice(0, 2)}***@${domain}`;
}

function getValidationErrors(req) {
  return validationResult(req).array({ onlyFirstError: true });
}

app.disable("x-powered-by");
app.set("trust proxy", isProduction ? 1 : false);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://vercel.live"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://fonts.googleapis.com",
          "https://vercel.live"
        ],
        fontSrc: [
          "'self'",
          "https://cdn.jsdelivr.net",
          "https://fonts.gstatic.com",
          "https://vercel.live",
          "https://assets.vercel.com"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://www.gstatic.com",
          "https://vercel.live",
          "https://vercel.com",
          "https://santi-gomme-omega.vercel.app"
        ],
        connectSrc: [
          "'self'",
          "https://vercel.live",
          "https://cdn.jsdelivr.net",
          "wss://ws-us3.pusher.com"
        ],
        frameSrc: [
          "https://www.google.com",
          "https://maps.google.com",
          "https://vercel.live"
        ],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

app.use(hpp());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

const generalLimiter = rateLimit({
  windowMs: 3 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  message: { success: false, message: "Troppe richieste, riprova più tardi." },
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Hai inviato troppi messaggi. Riprova tra un'ora." },
});

app.use(generalLimiter);

app.use(
  express.static(appRoot, {
    maxAge: isProduction ? "1d" : 0,
    etag: true,
    lastModified: true,
  })
);

const contactValidators = [
  body("nome")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Il nome è obbligatorio.")
    .isLength({ min: 2, max: 100 })
    .withMessage("Il nome deve essere tra 2 e 100 caratteri.")
    .matches(/^[a-zA-ZàèéìòùÀÈÉÌÒÙ\s'-]+$/)
    .withMessage("Il nome contiene caratteri non validi."),
  body("email")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("L'email è obbligatoria.")
    .isEmail()
    .withMessage("Inserisci un indirizzo email valido.")
    .normalizeEmail(),
  body("messaggio")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Il messaggio è obbligatorio.")
    .isLength({ min: 1, max: 2000 })
    .withMessage("Il messaggio deve essere tra 1 e 2000 caratteri."),
  body("telefono")
    .optional()
    .isString()
    .trim()
    .custom((value) => {
      const numeroSoloDigit = value.replace(/\D/g, "");
      if (numeroSoloDigit.length < 10) {
        throw new Error("Il numero di telefono deve contenere almeno 10 cifre.");
      }
      return true;
    })
];

app.post("/api/contatti", contactLimiter, contactValidators, async (req, res, next) => {
  try {
    const errors = getValidationErrors(req);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0].msg,
        errors,
      });
    }

    const data = matchedData(req, { locations: ["body"] });
    const nome = sanitizeText(data.nome);
    const email = sanitizeText(data.email);
    const messaggio = sanitizeText(data.messaggio);
    const telefono = data.telefono ? sanitizeText(data.telefono) : null;
    
    // Genera link WhatsApp se il telefono è presente
    let whatsappLink = "";
    if (telefono) {
      // Rimuovi tutti i caratteri non numerici eccetto il +
      const telefonoClean = telefono.replace(/[^\d+]/g, "");
      // Rimuovi il + iniziale per il link WhatsApp (wa.me non lo accetta)
      const numeroWhatsApp = telefonoClean.replace(/^\+/, "");
      whatsappLink = `https://wa.me/${numeroWhatsApp}`;
    }

    await resend.emails.send({
      from: `${appName} <onboarding@resend.dev>`,
      to: process.env.EMAIL_USER,
      subject: `[Sito Web] Nuovo messaggio da ${nome}`,
      replyTo: email,
      text: [
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "NUOVO MESSAGGIO DAL SITO WEB",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "",
        `Nome: ${nome}`,
        `Email: ${email}`,
        whatsappLink ? `WhatsApp: ${whatsappLink}` : "",
        `Data: ${new Date().toLocaleString("it-IT", { timeZone: "Europe/Rome" })}`,
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "MESSAGGIO:",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "",
        messaggio,
      ].filter(line => line !== "").join("\n"),
    });

    logEvent("INFO", "Email inviata con successo", {
      nome,
      email: maskEmail(email),
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Messaggio inviato correttamente!",
    });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    environment: isProduction ? "production" : "development",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});


app.get("/", (req, res) => {
  res.sendFile(path.join(appRoot, "index.html"));
});

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint API non trovato."
  });
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(appRoot, "404.html"));
});

app.use((error, req, res, next) => {
  logEvent("ERROR", "Errore server", {
    message: error.message,
    stack: isProduction ? undefined : error.stack,
    path: req.originalUrl,
    method: req.method,
  });

  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({
    success: false,
    message: "Si è verificato un errore interno. Riprova più tardi.",
  });
});

const server = app.listen(port, () => {
  logEvent("INFO", "Server avviato", {
    port,
    environment: isProduction ? "production" : "development",
  });
  console.log(`Server attivo su http://localhost:${port}`);
});

function shutdown(signal) {
  logEvent("INFO", `Ricevuto ${signal}, chiusura server...`);

  server.close(() => {
    logEvent("INFO", "Server chiuso correttamente");
    process.exit(0);
  });

  setTimeout(() => {
    logEvent("ERROR", "Shutdown forzato");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);