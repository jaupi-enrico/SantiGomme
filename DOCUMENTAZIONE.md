# LA SANTI Gomme srl - Documentazione Tecnica

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-ISC-lightgrey)

## Indice

1. [Panoramica del Progetto](#panoramica-del-progetto)
2. [Struttura del Progetto](#struttura-del-progetto)
3. [Requisiti di Sistema](#requisiti-di-sistema)
4. [Installazione](#installazione)
5. [Configurazione](#configurazione)
6. [Architettura](#architettura)
7. [Funzionalità](#funzionalità)
8. [Sicurezza](#sicurezza)
9. [API Reference](#api-reference)
10. [Compliance GDPR](#compliance-gdpr)
11. [Deployment](#deployment)
12. [Manutenzione](#manutenzione)
13. [Troubleshooting](#troubleshooting)

---

## Panoramica del Progetto

### Descrizione
Sito web professionale per **LA SANTI Gomme srl**, gommista situato a Travagliato (BS), Italia. Il sito presenta i servizi offerti, informazioni di contatto e un sistema di form contatti con invio email.

### Informazioni Azienda
| Campo | Valore |
|-------|--------|
| Ragione Sociale | LA SANTI Gomme srl |
| Indirizzo | Via della Scienza, 6 - 25039 Travagliato (BS) |
| Telefono | 0306864669 |
| Email | info@lasantigomme.it |
| Sito Web | https://www.lasantigomme.it |

### Servizi Offerti
- **Cambio Gomme Stagionale** - Montaggio/smontaggio pneumatici estivi e invernali
- **Riparazione Pneumatici** - Interventi su forature e danni
- **Equilibratura e Convergenza** - Assetto ruote per guida sicura
- **Deposito Gomme** - Custodia pneumatici fuori stagione

### Marchi Trattati
- Pirelli
- Michelin
- Bridgestone
- Continental

---

## Struttura del Progetto

```
SantiGomme/
├── server.js              # Server Express principale
├── package.json           # Configurazione npm e dipendenze
├── .env                   # Variabili d'ambiente (non versionato)
├── .env.example           # Template variabili d'ambiente
├── README.md              # Documentazione rapida
├── DOCUMENTAZIONE.md      # Questa documentazione
├── LICENSE                # Licenza del progetto
└── public/                # File statici serviti
    ├── index.html         # Pagina principale (SPA)
    ├── privacy.html       # Privacy Policy
    ├── cookie.html        # Cookie Policy
    ├── termini.html       # Termini e Condizioni
    └── img/
        ├── icon/          # Favicon e icone PWA
        │   ├── favicon.ico
        │   ├── favicon-16x16.png
        │   ├── favicon-32x32.png
        │   ├── apple-touch-icon.png
        │   ├── android-chrome-192x192.png
        │   ├── android-chrome-512x512.png
        │   └── site.webmanifest
        ├── loghi/         # Loghi marchi pneumatici
        │   ├── logoPirelli.png
        │   ├── logoMichelin.png
        │   ├── logoBridgestone.png
        │   └── logoContinental.png
        └── servizi/       # Icone servizi (SVG)
            ├── gomma.svg
            ├── riparazione.svg
            ├── volante.svg
            └── deposito.svg
```

---

## Requisiti di Sistema

### Software
| Requisito | Versione Minima |
|-----------|-----------------|
| Node.js | 18.0.0+ |
| npm | 9.0.0+ |

### Dipendenze Principali
| Package | Versione | Descrizione |
|---------|----------|-------------|
| express | ^5.2.1 | Framework web |
| resend | ^6.9.2 | Servizio invio email |
| helmet | ^8.0.0 | Headers sicurezza HTTP |
| express-rate-limit | ^7.5.0 | Rate limiting |
| express-validator | ^7.2.0 | Validazione input |
| xss | ^1.0.15 | Sanitizzazione XSS |
| hpp | ^0.2.3 | Protezione HTTP Parameter Pollution |
| dotenv | ^17.3.1 | Gestione variabili ambiente |

---

## Installazione

### 1. Clonare il repository
```bash
git clone https://github.com/tuouser/SantiGomme.git
cd SantiGomme
```

### 2. Installare le dipendenze
```bash
npm install
```

### 3. Configurare le variabili d'ambiente
```bash
# Copiare il template
cp .env.example .env

# Modificare .env con i propri valori
```

### 4. Avviare il server
```bash
# Produzione
npm start

# Sviluppo (con auto-reload)
npm run dev
```

---

## Configurazione

### Variabili d'Ambiente (.env)

```env
# Porta del server (default: 3000)
PORT=3000

# Ambiente: development | production
NODE_ENV=production

# API Key di Resend (https://resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx

# Email destinatario per i messaggi del form
EMAIL_USER=info@lasantigomme.it
```

### Ottenere API Key Resend
1. Registrarsi su [Resend](https://resend.com)
2. Creare un nuovo progetto
3. Generare una API Key
4. (Produzione) Verificare il dominio email

---

## Architettura

### Stack Tecnologico
- **Backend**: Node.js + Express 5
- **Frontend**: HTML5 + CSS3 + Bootstrap 5
- **Email**: Resend API
- **Hosting**: Compatibile con qualsiasi hosting Node.js

### Flusso delle Richieste
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│   Express    │────▶│   Resend    │
│  (Browser)  │◀────│   Server     │◀────│   (Email)   │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │   Static    │
                    │   Files     │
                    └─────────────┘
```

### Middleware Pipeline
```
Request
    │
    ▼
┌─────────────────────────────────────────┐
│ 1. Helmet (Security Headers)            │
├─────────────────────────────────────────┤
│ 2. HPP (HTTP Parameter Pollution)       │
├─────────────────────────────────────────┤
│ 3. Rate Limiter (100 req/15min)         │
├─────────────────────────────────────────┤
│ 4. Body Parser (JSON, limit: 10KB)      │
├─────────────────────────────────────────┤
│ 5. Static Files                         │
├─────────────────────────────────────────┤
│ 6. Routes                               │
├─────────────────────────────────────────┤
│ 7. Error Handler                        │
└─────────────────────────────────────────┘
    │
    ▼
Response
```

---

## Funzionalità

### Sezioni del Sito
1. **Hero** - Banner principale con CTA
2. **Servizi** - 4 card con servizi offerti
3. **Marchi** - Loghi marchi trattati
4. **Perché Sceglierci** - 3 punti di forza
5. **Recensioni** - 3 testimonial clienti
6. **Contatti** - Form + Mappa Google + Info

### Form di Contatto
| Campo | Tipo | Validazione |
|-------|------|-------------|
| Nome | text | 2-100 caratteri, solo lettere |
| Email | email | Formato email valido |
| Messaggio | textarea | 10-2000 caratteri |
| Privacy | checkbox | Obbligatorio |

### Dark Mode
- Toggle manuale nel navbar
- Preferenza salvata in localStorage
- Transizioni CSS fluide

### Cookie Consent
- Banner conforme GDPR
- Opzioni: Accetta tutti / Solo necessari
- Salvataggio preferenze in localStorage

---

## Sicurezza

### Misure Implementate

#### 1. HTTP Security Headers (Helmet)
```javascript
// Content Security Policy
{
  defaultSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
  scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
  fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
  imgSrc: ["'self'", "data:", "https:"],
  frameSrc: ["https://www.google.com"],
  connectSrc: ["'self'"]
}
```

#### 2. Rate Limiting
| Endpoint | Limite | Finestra |
|----------|--------|----------|
| Generale | 100 req | 15 min |
| /api/contatti | 5 req | 1 ora |

#### 3. Input Validation
- Validazione server-side con express-validator
- Sanitizzazione XSS
- Limiti lunghezza input
- Pattern matching per nome

#### 4. Altre Protezioni
- HPP (HTTP Parameter Pollution)
- Limiti body size (10KB)
- Logging strutturato (no dati sensibili)
- Error handling centralizzato

### Checklist Sicurezza
- [x] HTTPS (da configurare su hosting)
- [x] Security Headers
- [x] Rate Limiting
- [x] Input Validation
- [x] XSS Prevention
- [x] Error Handling sicuro
- [x] Logging senza dati sensibili
- [x] Environment variables per secrets

---

## API Reference

### POST /api/contatti

Invia un messaggio tramite il form di contatto.

**Rate Limit**: 5 richieste/ora per IP

#### Request
```http
POST /api/contatti HTTP/1.1
Content-Type: application/json

{
  "nome": "Mario Rossi",
  "email": "mario.rossi@esempio.it",
  "messaggio": "Vorrei prenotare un cambio gomme..."
}
```

#### Response (Successo)
```json
{
  "success": true,
  "message": "Messaggio inviato correttamente!"
}
```

#### Response (Errore Validazione)
```json
{
  "success": false,
  "message": "Il nome è obbligatorio.",
  "errors": [
    {
      "type": "field",
      "value": "",
      "msg": "Il nome è obbligatorio.",
      "path": "nome",
      "location": "body"
    }
  ]
}
```

#### Response (Rate Limit)
```json
{
  "success": false,
  "message": "Hai inviato troppi messaggi. Riprova tra un'ora."
}
```

### GET /api/health

Health check endpoint per monitoring.

#### Response
```json
{
  "status": "ok",
  "timestamp": "2026-02-27T10:30:00.000Z"
}
```

---

## Compliance GDPR

### Documenti Legali Obbligatori
| Documento | File | Stato |
|-----------|------|-------|
| Privacy Policy | privacy.html | ✅ Implementato |
| Cookie Policy | cookie.html | ✅ Implementato |
| Termini e Condizioni | termini.html | ✅ Implementato |

### Cookie Consent
- Banner mostrato al primo accesso
- Due opzioni: Accetta tutti / Solo necessari
- Preferenze salvate (no cookie terze parti per consenso)
- Possibilità di revocare il consenso

### Dati Raccolti
| Dato | Finalità | Base Giuridica | Conservazione |
|------|----------|----------------|---------------|
| Nome | Risposta contatto | Consenso | 24 mesi |
| Email | Risposta contatto | Consenso | 24 mesi |
| Messaggio | Risposta contatto | Consenso | 24 mesi |
| IP | Sicurezza/Log | Legittimo interesse | Server logs |

### Diritti dell'Utente
- Accesso ai dati
- Rettifica
- Cancellazione
- Limitazione
- Portabilità
- Opposizione
- Revoca consenso

### Note Importanti
> ⚠️ **Sostituire i dati fittizi** nel footer e nelle pagine legali:
> - P.IVA: IT00000000000 → inserire P.IVA reale
> - REA: BS-000000 → inserire numero REA reale

---

## Deployment

### Opzioni di Hosting Consigliate

#### 1. Render.com (Consigliato)
```yaml
# render.yaml
services:
  - type: web
    name: santigomme
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: RESEND_API_KEY
        sync: false
      - key: EMAIL_USER
        sync: false
```

#### 2. Railway
```bash
railway init
railway add
railway variables set RESEND_API_KEY=xxx
railway variables set EMAIL_USER=xxx
railway up
```

#### 3. Vercel
```json
// vercel.json
{
  "version": 2,
  "builds": [
    { "src": "server.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "server.js" }
  ]
}
```

### Checklist Pre-Deploy
- [ ] Variabili d'ambiente configurate
- [ ] NODE_ENV=production
- [ ] Dominio verificato su Resend
- [ ] SSL/HTTPS attivo
- [ ] P.IVA e dati legali aggiornati
- [ ] Link social aggiornati (o rimossi)
- [ ] Test form contatti

---

## Manutenzione

### Aggiornamento Dipendenze
```bash
# Verifica aggiornamenti disponibili
npm outdated

# Aggiorna dipendenze (minor/patch)
npm update

# Aggiorna dipendenze (major) - con cautela
npx npm-check-updates -u
npm install
```

### Backup
- Versionare sempre su Git
- Il sito non ha database (stato minimo)
- Backup periodici del file .env

### Monitoring
- Utilizzare `/api/health` per uptime monitoring
- Configurare alerting su servizi come UptimeRobot

### Log
I log sono in formato JSON per facile parsing:
```json
{
  "timestamp": "2026-02-27T10:30:00.000Z",
  "type": "INFO",
  "message": "Email inviata con successo",
  "nome": "Mario",
  "email": "mar***"
}
```

---

## Troubleshooting

### "RESEND_API_KEY mancante"
- Verificare che il file `.env` esista
- Verificare che contenga `RESEND_API_KEY=...`
- Riavviare il server dopo modifiche al .env

### "Email non arrivano"
1. Verificare la API Key su Resend
2. Controllare i log del server
3. In produzione: verificare il dominio su Resend
4. Controllare la cartella spam

### "Errore 429 Too Many Requests"
- Rate limit raggiunto
- Attendere il tempo indicato (15min o 1h)
- In sviluppo: riavviare il server per reset

### "Form non funziona"
1. Aprire la console browser (F12)
2. Verificare errori nella tab Network
3. Controllare che JavaScript sia abilitato
4. Testare con browser diverso

### "Dark mode non si salva"
- Verificare che localStorage sia abilitato
- Svuotare cache browser
- Non usare navigazione in incognito

---

## Crediti

**Sviluppo**: LA SANTI Gomme srl  
**Framework**: Express.js  
**UI**: Bootstrap 5  
**Icone**: Bootstrap Icons, Custom SVG  
**Font**: Inter (Google Fonts)  
**Email**: Resend

---

## Changelog

### v2.0.0 (Febbraio 2026)
- ✨ Implementazione completa sicurezza (Helmet, Rate Limiting, XSS)
- ✨ Compliance GDPR (Cookie Banner, Privacy Policy)
- ✨ Validazione input avanzata
- ✨ Pagine legali (Privacy, Cookie, Termini)
- ✨ Form contatti migliorato con feedback
- ✨ Logging strutturato
- 📝 Documentazione completa

### v1.0.0 (Release Iniziale)
- 🎉 Lancio sito web
- ✨ Form contatti con Resend
- ✨ Dark mode
- ✨ Design responsive

---

## Supporto

Per assistenza tecnica o domande:
- **Email**: info@lasantigomme.it
- **Telefono**: 0306864669

---

<p align="center">
  <strong>LA SANTI Gomme srl</strong><br>
  Via della Scienza, 6 - 25039 Travagliato (BS)<br>
  © 2026 - Tutti i diritti riservati
</p>
