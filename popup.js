const DEFAULT_SETTINGS = { enabledSites: [], machineTranslation: true };
const CONTENT_FILES = ["dictionary.js", "translator.js", "content.js"];

function getSiteKey(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol === "file:") return "file://";
    if (url.protocol === "http:" || url.protocol === "https:") return url.origin;
  } catch {
    // URL absente ou invalide
  }
  return null;
}

// Pour un onglet ouvert avant l'installation de l'extension, injecte les scripts.
async function ensureContentScript(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { action: "safinum_ping" });
    return true;
  } catch {
    try {
      await chrome.scripting.executeScript({ target: { tabId }, files: CONTENT_FILES });
      return true;
    } catch {
      return false;
    }
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const toggleBtn = document.getElementById("toggle-btn");
  const machineToggle = document.getElementById("machine-toggle");
  const siteEl = document.getElementById("site");
  const statusEl = document.getElementById("status");

  const settings = await chrome.storage.local.get(DEFAULT_SETTINGS);
  machineToggle.checked = settings.machineTranslation !== false;
  machineToggle.addEventListener("change", () => {
    chrome.storage.local.set({ machineTranslation: machineToggle.checked });
  });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const siteKey = getSiteKey(tab?.url);

  const setStatus = (text, state = "") => {
    statusEl.textContent = text;
    statusEl.className = `status ${state}`.trim();
  };

  if (!siteKey || tab?.id === undefined) {
    siteEl.textContent = "Page non prise en charge";
    setStatus("La traduction n'est pas disponible sur cette page.", "error");
    return;
  }

  siteEl.textContent = siteKey === "file://" ? "Fichiers locaux (file://)" : new URL(tab.url).host;
  let enabled = settings.enabledSites.includes(siteKey);

  const render = () => {
    toggleBtn.disabled = false;
    toggleBtn.textContent = enabled ? "Arrêter la traduction sur ce site" : "Traduire ce site";
    toggleBtn.classList.toggle("stop", enabled);
    if (enabled) setStatus("Traduction en haoussa active sur ce site.", "on");
    else setStatus("Traduction inactive : aucune donnée n'est lue ni envoyée.");
  };

  const showInjectionError = () => {
    setStatus(
      siteKey === "file://"
        ? "Accès refusé au fichier local : activez « Autoriser l'accès aux URL de fichier » dans les détails de l'extension."
        : "Impossible d'accéder à cette page. Rechargez-la puis réessayez.",
      "error"
    );
  };

  render();
  if (enabled && !(await ensureContentScript(tab.id))) showInjectionError();

  toggleBtn.addEventListener("click", async () => {
    toggleBtn.disabled = true;
    const current = await chrome.storage.local.get(DEFAULT_SETTINGS);
    const sites = new Set(current.enabledSites);
    enabled = !sites.has(siteKey);
    if (enabled) sites.add(siteKey);
    else sites.delete(siteKey);
    await chrome.storage.local.set({ enabledSites: [...sites] });

    render();
    if (enabled && !(await ensureContentScript(tab.id))) showInjectionError();
  });
});
