const phoneNumber = "32466487936";

const firebaseConfig = {
  apiKey: "AIzaSyCAGFSLoEsR7cVJrxzKBY0N8YNUFiW8Rr0",
  authDomain: "lv-tranport.firebaseapp.com",
  databaseURL: "https://lv-tranport-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "lv-tranport",
  storageBucket: "lv-tranport.firebasestorage.app",
  messagingSenderId: "393610391278",
  appId: "1:393610391278:web:d56b1d17ae54a9df3ccdff",
  measurementId: "G-3LN0J58NM7"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();
const db = firebase.database();

const bookingForm = document.getElementById("bookingForm");

if (bookingForm) {
  bookingForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const datum = document.getElementById("datum").value;
    const tijd = document.getElementById("tijd").value;
    const naam = document.getElementById("naam").value;
    const telefoon = document.getElementById("telefoon").value;
    const van = document.getElementById("van").value;
    const naar = document.getElementById("naar").value;
    const typeRit = document.getElementById("typeRit").value;

    const message =
`Hallo LV Transport, ik wil graag een rit reserveren.

Datum: ${datum}
Tijd: ${tijd}
Naam: ${naam}
Telefoon: ${telefoon}
Van: ${van}
Naar: ${naar}
Type rit: ${typeRit}

Kunt u mijn rit bevestigen?`;

    openWhatsApp(message);
  });
}

function openWhatsApp(message) {
  window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, "_blank");
}

function quickWhatsApp(service) {
  const message =
`Hallo LV Transport, ik wil graag informatie of reserveren voor:

Dienst: ${service}

Kunt u mij helpen?`;

  openWhatsApp(message);
}

function quickDestination(destination, price) {
  const message =
`Hallo LV Transport, ik wil graag deze rit reserveren:

Bestemming: ${destination}
Prijsindicatie: ${price}

Kunt u mijn rit bevestigen?`;

  openWhatsApp(message);
}

window.quickWhatsApp = quickWhatsApp;
window.quickDestination = quickDestination;

let map = null;
let taxiMarker = null;
let taxiListener = null;

function createMap(lat, lng) {
  const mapBox = document.getElementById("mapBox");
  if (!mapBox) return;

  mapBox.innerHTML = `<div id="realMap" style="width:100%;height:100%;border-radius:18px;"></div>`;

  const position = { lat, lng };

  map = new google.maps.Map(document.getElementById("realMap"), {
    center: position,
    zoom: 15,
    disableDefaultUI: true,
    styles: [
      { elementType: "geometry", stylers: [{ color: "#111111" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#ffd27a" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#000000" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#2b2b2b" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#050505" }] }
    ]
  });

  taxiMarker = new google.maps.Marker({
    position,
    map,
    title: "LV Transport Taxi",
    label: "🚕"
  });
}

function startTracking() {
  const codeInput = document.getElementById("bookingCode");
  const mapBox = document.getElementById("mapBox");

  if (!codeInput || !mapBox) return;

  const code = codeInput.value.trim().toUpperCase();

  if (!code) {
    alert("Vul eerst uw reserveringscode in.");
    return;
  }

  mapBox.innerHTML = `
    <div class="map-message">
      <strong style="color:#ffd27a;">Live tracking starten...</strong><br>
      Reserveringscode: ${code}<br>
      Wachten op chauffeur locatie.
    </div>
  `;

  if (taxiListener) {
    taxiListener.off();
  }

  taxiListener = db.ref("taxis/" + code);

  taxiListener.on("value", function(snapshot) {
    const data = snapshot.val();

    if (!data || !data.lat || !data.lng) {
      mapBox.innerHTML = `
        <div class="map-message">
          <strong style="color:#ffd27a;">Geen live locatie gevonden</strong><br>
          Reserveringscode: ${code}<br>
          Open driver.html en druk op Start Tracking.
        </div>
      `;
      return;
    }

    const lat = Number(data.lat);
    const lng = Number(data.lng);

    if (!window.google || !google.maps) {
      mapBox.innerHTML = `
        <div class="map-message">
          <strong style="color:#ffd27a;">Locatie ontvangen</strong><br>
          ${lat.toFixed(5)}, ${lng.toFixed(5)}<br>
          Google Maps is nog niet geladen.
        </div>
      `;
      return;
    }

    if (!map || !taxiMarker) {
      createMap(lat, lng);
    } else {
      const position = { lat, lng };
      taxiMarker.setPosition(position);
      map.panTo(position);
    }
  });
}

window.startTracking = startTracking;

const adminLoginBtn = document.getElementById("adminLoginBtn");

if (adminLoginBtn) {
  adminLoginBtn.addEventListener("click", function() {
    if (auth.currentUser) {
      auth.signOut();
      return;
    }

    auth.signInWithPopup(provider).catch(function(error) {
      alert("Admin login fout: " + error.message);
    });
  });
}

auth.onAuthStateChanged(function(user) {
  if (user) {
    activateAdminMode(user);
  } else {
    deactivateAdminMode();
  }
});

function activateAdminMode(user) {
  document.body.classList.add("admin-mode-active");

  if (adminLoginBtn) {
    adminLoginBtn.textContent = "Admin actief";
  }

  document
    .querySelectorAll(".price-card div, .price-card h3, .service-card h3, .service-card p, .priority-text p, .tracking-card p, .footer p")
    .forEach(function(el) {
      el.contentEditable = true;
      el.classList.add("admin-editable");
    });
}

function deactivateAdminMode() {
  document.body.classList.remove("admin-mode-active");

  if (adminLoginBtn) {
    adminLoginBtn.textContent = "Admin";
  }

  document.querySelectorAll(".admin-editable").forEach(function(el) {
    el.contentEditable = false;
    el.classList.remove("admin-editable");
  });
}

document.querySelectorAll('a[href^="#"]').forEach(function(link) {
  link.addEventListener("click", function(e) {
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

const reveals = document.querySelectorAll(".reveal");

function revealOnScroll() {
  reveals.forEach(function(el) {
    const top = el.getBoundingClientRect().top;
    if (top < window.innerHeight - 80) {
      el.classList.add("active");
    }
  });
}

window.addEventListener("scroll", revealOnScroll);
window.addEventListener("load", revealOnScroll);
function initMap() {
  const map = new google.maps.Map(document.getElementById("googleMap"), {
    center: { lat: 51.2194, lng: 4.4025 },
    zoom: 13
  });
}// CHATBOT LV TRANSPORT PRO
document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.getElementById("chat-toggle");
  const close = document.getElementById("chat-close");
  const box = document.getElementById("chat-box");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const messages = document.getElementById("chat-messages");
  const actionButtons = document.querySelectorAll(".chat-actions button");

  if (!toggle || !close || !box || !form || !input || !messages) return;

  toggle.addEventListener("click", function () {
    box.style.display = "block";
    toggle.style.display = "none";
  });

  close.addEventListener("click", function () {
    box.style.display = "none";
    toggle.style.display = "flex";
  });

  actionButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      input.value = button.getAttribute("data-msg");
      form.requestSubmit();
    });
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";

    const loading = addMessage("Escribiendo...", "bot");

    try {
      const response = await fetch("/.netlify/functions/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: text })
      });

      const data = await response.json();

      loading.textContent =
        data.reply || "Lo siento, no pude responder ahora.";
    } catch (error) {
      loading.textContent =
        "Error conectando con LV Transport. Inténtalo otra vez.";
    }

    messages.scrollTop = messages.scrollHeight;
  });

  function addMessage(text, type) {
    const div = document.createElement("div");
    div.className = "chat-message " + type;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }
});