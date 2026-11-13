// Service worker : seul composant qui contacte un service externe (MyMemory).
// Il ne reçoit que des textes déjà masqués par translator.js : les montants,
// numéros, e-mails, URL et noms propres y sont remplacés par {A}, {B}...
const MYMEMORY_URL = "https://api.mymemory.translated.net/get";
const LANG_PAIR = "fr|ha";
const TIMEOUT_MS = 6000;
const MAX_CONCURRENT = 3;
const CACHE_KEY = "mtCache";
const CACHE_MAX_ENTRIES = 1000;
const TOKEN_RE = /\{[A-Z]{1,2}\}/g;

// Garde-fou : refuse tout texte qui contiendrait encore une donnée sensible.
function isAcceptableText(text) {
  if (typeof text !== "string") return false;
  const trimmed = text.trim();
  const bare = trimmed.replace(TOKEN_RE, " ");
  return (
    trimmed.length > 0 &&
    trimmed.length <= 500 &&
    /\p{L}{2,}/u.test(bare) &&
    !/\p{N}/u.test(bare) &&
    !/https?:\/\/|@/iu.test(bare)
  );
}

function decodeEntities(text) {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
  return text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/giu, (match, entity) => {
    const key = entity.toLowerCase();
    if (key in named) return named[key];
    const code = key.startsWith("#x") ? parseInt(key.slice(2), 16) : parseInt(key.slice(1), 10);
    return Number.isFinite(code) ? String.fromCodePoint(code) : match;
  });
}

const normalize = (text) => text.replace(/\s+/gu, " ").trim().toLocaleLowerCase("fr");

// Cache persistant : une phrase déjà traduite ne repart jamais sur le réseau.
let cachePromise = null;
function loadCache() {
  cachePromise ??= chrome.storage.local
    .get({ [CACHE_KEY]: {} })
    .then((stored) => stored[CACHE_KEY] || {})
    .catch(() => ({}));
  return cachePromise;
}

async function saveToCache(source, translation) {
  const cache = await loadCache();
  cache[source] = translation;
  const keys = Object.keys(cache);
  for (let i = 0; i < keys.length - CACHE_MAX_ENTRIES; i += 1) delete cache[keys[i]];
  await chrome.storage.local.set({ [CACHE_KEY]: cache }).catch(() => {});
}

// File d'attente : limite les requêtes simultanées (quota gratuit MyMemory).
let running = 0;
const waiting = [];
const inFlight = new Map();

function schedule(task) {
  return new Promise((resolve, reject) => {
    waiting.push({ task, resolve, reject });
    pump();
  });
}

function pump() {
  while (running < MAX_CONCURRENT && waiting.length > 0) {
    const { task, resolve, reject } = waiting.shift();
    running += 1;
    task()
      .then(resolve, reject)
      .finally(() => {
        running -= 1;
        pump();
      });
  }
}

async function fetchTranslation(text) {
  const url = new URL(MYMEMORY_URL);
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", LANG_PAIR);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal, credentials: "omit" });
    if (!response.ok) throw new Error(`MyMemory HTTP ${response.status}`);
    const data = await response.json();

    const raw = data?.responseData?.translatedText;
    if (Number(data?.responseStatus) !== 200 || data?.quotaFinished || typeof raw !== "string") return null;

    const translated = decodeEntities(raw).trim();
    if (
      !translated ||
      /MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID LANGUAGE PAIR/iu.test(translated) ||
      normalize(translated) === normalize(text) // texte renvoyé non traduit
    ) {
      return null;
    }
    return translated;
  } finally {
    clearTimeout(timer);
  }
}

async function translate(text) {
  const cache = await loadCache();
  if (typeof cache[text] === "string") return cache[text];
  if (inFlight.has(text)) return inFlight.get(text);

  const request = schedule(() => fetchTranslation(text))
    .then(async (translated) => {
      if (translated) await saveToCache(text, translated);
      return translated;
    })
    .finally(() => inFlight.delete(text));

  inFlight.set(text, request);
  return request;
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request?.action !== "translate_text") return undefined;

  const text = typeof request.text === "string" ? request.text.trim() : "";
  if (!isAcceptableText(text)) {
    sendResponse({ error: "Texte refusé (vide, trop long ou contenant une donnée sensible)" });
    return undefined;
  }

  translate(text)
    .then((translatedText) => sendResponse({ translatedText: translatedText || null }))
    .catch((error) => {
      console.warn("[Safinum] Échec de la traduction automatique :", error);
      sendResponse({ error: "Traduction automatique indisponible" });
    });
  return true; // réponse asynchrone
});
