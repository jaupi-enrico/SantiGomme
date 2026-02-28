
const toggleBtn = document.getElementById("toggleTema");

// Controlla se l'utente aveva già scelto dark mode
if (localStorage.getItem("tema") === "dark") {
    document.body.classList.add("dark-mode");
    toggleBtn.textContent = "☀️";
}

toggleBtn.addEventListener("click", () => {
document.body.classList.toggle("dark-mode");

if (document.body.classList.contains("dark-mode")) {
    localStorage.setItem("tema", "dark");
    toggleBtn.textContent = "☀️";
} else {
    localStorage.setItem("tema", "light");
    toggleBtn.textContent = "🌙";
}
});

// Cookie Consent Management
(function() {
  const cookieBanner = document.getElementById('cookieBanner');
  const accettaBtn = document.getElementById('accettaCookie');
  const rifiutaBtn = document.getElementById('rifiutaCookie');
  const personalizzaBtn = document.getElementById('personalizzaCookie');
  
  // Check if consent was already given
  const consentGiven = localStorage.getItem('cookieConsent');
  
  if (!consentGiven) {
    // Show banner after a small delay
    setTimeout(() => {
      cookieBanner.style.display = 'block';
    }, 1000);
  }
  
  function setConsent(type) {
    localStorage.setItem('cookieConsent', type);
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    cookieBanner.style.display = 'none';
    
    // Here you would enable/disable analytics based on consent
    if (type === 'all') {
      // Enable all cookies/analytics
      console.log('All cookies accepted');
    } else if (type === 'necessary') {
      // Only necessary cookies
      console.log('Only necessary cookies');
    }
  }
  
  accettaBtn.addEventListener('click', () => setConsent('all'));
  rifiutaBtn.addEventListener('click', () => setConsent('necessary'));
  personalizzaBtn.addEventListener('click', () => {
    // In a real implementation, this would open a cookie preferences modal
    alert('Funzionalità di personalizzazione cookie in sviluppo.\nPer ora puoi scegliere tra "Accetta tutti" o "Solo necessari".');
  });
})();

const form = document.getElementById("formContatti");
const risposta = document.getElementById("rispostaForm");
const messaggio = document.getElementById("messaggio");
const charCount = document.getElementById("charCount");
const submitBtn = document.getElementById("submitBtn");
const submitText = document.getElementById("submitText");
const submitSpinner = document.getElementById("submitSpinner");

// Character counter for message
messaggio.addEventListener("input", () => {
charCount.textContent = messaggio.value.length;
if (messaggio.value.length > 2000) {
    charCount.classList.add("text-danger");
} else {
    charCount.classList.remove("text-danger");
}
});

// Form validation visual feedback
form.querySelectorAll("input, textarea").forEach(field => {
field.addEventListener("blur", () => {
    if (field.checkValidity()) {
    field.classList.remove("is-invalid");
    field.classList.add("is-valid");
    } else {
    field.classList.remove("is-valid");
    field.classList.add("is-invalid");
    }
});
});

form.addEventListener("submit", async (e) => {
e.preventDefault();

// Reset messaggio precedente
risposta.className = "";
risposta.textContent = "";

// HTML5 validation
if (!form.checkValidity()) {
    form.classList.add("was-validated");
    return;
}

// Privacy check
if (!document.getElementById("privacy").checked) {
    risposta.className = "alert alert-warning mt-3";
    risposta.textContent = "Devi accettare la privacy policy per inviare il messaggio.";
    return;
}

// Disable button and show spinner
submitBtn.disabled = true;
submitText.textContent = "Invio in corso...";
submitSpinner.style.display = "inline-block";

const dati = new FormData(form);
const obj = {
    nome: dati.get("nome"),
    email: dati.get("email"),
    messaggio: dati.get("messaggio")
};

try {
    const res = await fetch("/api/contatti", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    credentials: "same-origin",
    body: JSON.stringify(obj)
    });

    const data = await res.json();

    if (res.ok && data.success) {
    risposta.className = "alert alert-success mt-3";
    risposta.textContent = "Messaggio inviato correttamente! Ti risponderemo al più presto.";
    form.reset();
    form.classList.remove("was-validated");
    form.querySelectorAll(".is-valid, .is-invalid").forEach(el => {
        el.classList.remove("is-valid", "is-invalid");
    });
    charCount.textContent = "0";
    } else {
    risposta.className = "alert alert-danger mt-3";
    risposta.textContent = data.message || "Errore nell'invio del messaggio.";
    }

} catch (err) {
    risposta.className = "alert alert-danger mt-3";
    risposta.textContent = "Errore di connessione al server. Riprova più tardi.";
    console.error(err);
} finally {
    // Re-enable button
    submitBtn.disabled = false;
    submitText.textContent = "Invia messaggio";
    submitSpinner.style.display = "none";
}
});


// 2. Smooth Scroll per i link interni
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
    window.scrollTo({
        top: target.offsetTop - 70, // Sottrae l'altezza della navbar sticky
        behavior: 'smooth'
    });
    }
});
});

// 2. Smooth Scroll per i link interni
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
        window.scrollTo({
            top: target.offsetTop - 70, // Sottrae l'altezza della navbar sticky
            behavior: 'smooth'
        });
        }
    });
});