// Script injecté dans la page : applique les traductions du moteur au DOM,
// sans jamais modifier le code source du service financier.
//
// Inactif par défaut : rien n'est lu, modifié ou envoyé tant que
// l'utilisateur n'a pas activé la traduction pour ce site depuis le popup.
(() => {
  "use strict";
  if (globalThis.__safinumHausaContentLoaded) return;
  globalThis.__safinumHausaContentLoaded = true;

  const LEXIQUE = globalThis.SAFINUM_HAUSA;
  const Translator = globalThis.SafinumTranslator;
  if (!LEXIQUE || !Translator || !document.documentElement) {
    console.warn("[Safinum] Lexique ou moteur de traduction introuvable.");
    return;
  }

  const SITE_KEY = location.protocol === "file:" ? "file://" : location.origin;
  const DEFAULT_SETTINGS = { enabledSites: [], machineTranslation: true };
  const TRANSLATABLE_ATTRIBUTES = ["placeholder", "title", "aria-label"];
  const NO_TRANSLATE_SELECTOR = "[translate='no'], .notranslate";
  // Zones jamais traduites : code, saisie utilisateur, et marquage standard translate="no".
  const SKIP_SELECTOR =
    "script, style, noscript, template, textarea, code, pre, svg, math, " +
    `[contenteditable]:not([contenteditable='false']), ${NO_TRANSLATE_SELECTOR}`;
  const MARKER_ATTRIBUTE = "data-safinum";
  const SEVERITY = { ok: 1, partial: 2, mt: 3, "mt-critical": 4, kept: 5 };

  const textRecords = new Map(); // nœud texte -> { original, translated, kind }
  const attributeRecords = new Map(); // élément -> Map(attribut -> { original, translated })
  const markedElements = new Set();

  let engine = null;
  let active = false;
  let machineEnabled = true;
  let generation = 0;
  let cleanupTimer = null;
  let ui = null;

  // ---------------------------------------------------------------------------
  // Traduction automatique (via le service worker, texte déjà masqué)
  // ---------------------------------------------------------------------------
  function requestMachineTranslation(maskedText) {
    if (!machineEnabled) return Promise.resolve(null);
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ action: "translate_text", text: maskedText }, (response) => {
          if (chrome.runtime.lastError || !response || response.error) {
            resolve(null);
            return;
          }
          resolve(typeof response.translatedText === "string" ? response.translatedText : null);
        });
      } catch {
        resolve(null); // extension rechargée : contexte invalidé
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Application au DOM
  // ---------------------------------------------------------------------------
  function isSkipped(element) {
    return !element || Boolean(element.closest(SKIP_SELECTOR));
  }

  function refreshMarker(element) {
    if (!element) return;
    let worst = null;
    for (const child of element.childNodes) {
      const record = child.nodeType === Node.TEXT_NODE ? textRecords.get(child) : null;
      if (record && (!worst || SEVERITY[record.kind] > SEVERITY[worst])) worst = record.kind;
    }
    if (worst) {
      if (element.getAttribute(MARKER_ATTRIBUTE) !== worst) element.setAttribute(MARKER_ATTRIBUTE, worst);
      markedElements.add(element);
    } else if (element.hasAttribute(MARKER_ATTRIBUTE)) {
      element.removeAttribute(MARKER_ATTRIBUTE);
      markedElements.delete(element);
    }
  }

  async function translateTextNode(node) {
    if (!active || !engine) return;
    const original = node.nodeValue;
    if (!original || !original.trim()) return;

    const record = textRecords.get(node);
    if (record && record.translated === original) return; // notre propre modification

    const parent = node.parentElement;
    if (isSkipped(parent)) return;

    const currentGeneration = generation;
    const result = await engine.translate(original, { allowMachine: true });
    if (!active || currentGeneration !== generation || !node.isConnected || node.nodeValue !== original) {
      return;
    }

    if (!result) {
      if (record) {
        textRecords.delete(node);
        refreshMarker(parent);
      }
      return;
    }

    textRecords.set(node, { original, translated: result.text, kind: result.kind });
    if (result.text !== original) node.nodeValue = result.text;
    refreshMarker(parent);
  }

  async function translateAttribute(element, attribute) {
    if (!active || !engine || element.closest(NO_TRANSLATE_SELECTOR)) return;
    const original = element.getAttribute(attribute);
    if (original === null) return;

    let attributes = attributeRecords.get(element);
    const previous = attributes?.get(attribute);
    if (previous && previous.translated === original) return;

    // Attributs : uniquement des traductions validées (pas d'infobulle possible).
    const currentGeneration = generation;
    const result = await engine.translate(original, { allowMachine: false });
    if (
      !active ||
      currentGeneration !== generation ||
      !result ||
      result.kind !== "ok" ||
      !element.isConnected ||
      element.getAttribute(attribute) !== original
    ) {
      return;
    }

    if (!attributes) {
      attributes = new Map();
      attributeRecords.set(element, attributes);
    }
    attributes.set(attribute, { original, translated: result.text });
    element.setAttribute(attribute, result.text);
  }

  function translateAttributes(element) {
    for (const attribute of TRANSLATABLE_ATTRIBUTES) {
      if (element.hasAttribute(attribute)) void translateAttribute(element, attribute);
    }
  }

  function walk(root) {
    if (root.nodeType === Node.TEXT_NODE) {
      void translateTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    if (root.matches("textarea")) translateAttributes(root); // placeholder seulement
    if (isSkipped(root)) return;

    translateAttributes(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (node.nodeType === Node.ELEMENT_NODE && node.matches(SKIP_SELECTOR)) {
          if (node.matches("textarea")) translateAttributes(node);
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.ELEMENT_NODE) translateAttributes(node);
      else void translateTextNode(node);
    }
  }

  function restorePage() {
    for (const [node, record] of textRecords) {
      if (node.isConnected && node.nodeValue === record.translated) node.nodeValue = record.original;
    }
    textRecords.clear();

    for (const [element, attributes] of attributeRecords) {
      if (!element.isConnected) continue;
      for (const [attribute, record] of attributes) {
        if (element.getAttribute(attribute) === record.translated) {
          element.setAttribute(attribute, record.original);
        }
      }
    }
    attributeRecords.clear();

    for (const element of markedElements) element.removeAttribute(MARKER_ATTRIBUTE);
    markedElements.clear();
  }

  function scheduleCleanup() {
    if (cleanupTimer) return;
    cleanupTimer = setTimeout(() => {
      cleanupTimer = null;
      for (const node of textRecords.keys()) if (!node.isConnected) textRecords.delete(node);
      for (const element of attributeRecords.keys()) if (!element.isConnected) attributeRecords.delete(element);
      for (const element of markedElements) if (!element.isConnected) markedElements.delete(element);
    }, 2000);
  }

  // Contenu inédit : tout texte ajouté ou modifié après le chargement est traité.
  const observer = new MutationObserver((mutations) => {
    if (!active) return;
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach(walk);
      } else if (mutation.type === "characterData") {
        void translateTextNode(mutation.target);
      } else if (mutation.type === "attributes") {
        void translateAttribute(mutation.target, mutation.attributeName);
      }
    }
    scheduleCleanup();
  });

  // ---------------------------------------------------------------------------
  // Marquage visuel + infobulle « texte original »
  // ---------------------------------------------------------------------------
  function createUi() {
    const style = document.createElement("style");
    style.id = "safinum-hausa-style";
    style.textContent = `
      [${MARKER_ATTRIBUTE}="partial"], [${MARKER_ATTRIBUTE}="mt"] {
        text-decoration: underline dotted #d97706 !important;
        text-underline-offset: 3px !important;
      }
      [${MARKER_ATTRIBUTE}="mt-critical"], [${MARKER_ATTRIBUTE}="kept"] {
        outline: 2px dashed #dc2626 !important;
        outline-offset: 2px !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);

    const host = document.createElement("div");
    host.id = "safinum-hausa-ui";
    host.setAttribute("translate", "no");
    host.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;";
    const shadow = host.attachShadow({ mode: "closed" });
    shadow.innerHTML = `
      <style>
        .tip { position: fixed; max-width: 320px; padding: 8px 10px; border-radius: 6px;
          background: #0f172a; color: #f8fafc; font: 12px/1.45 system-ui, sans-serif;
          box-shadow: 0 6px 20px rgba(0,0,0,.3); pointer-events: none; }
        .tip[hidden] { display: none; }
        .orig-label { color: #93c5fd; font-weight: 600; }
      </style>
      <div class="tip" role="tooltip" hidden>
        <span class="orig-label"></span> <span class="orig-text"></span>
      </div>`;
    document.documentElement.appendChild(host);

    const tip = shadow.querySelector(".tip");
    const origLabelEl = shadow.querySelector(".orig-label");
    const origTextEl = shadow.querySelector(".orig-text");
    const originalLabel = LEXIQUE.interface?.original || "Original (FR) :";
    let current = null;

    const originalTextOf = (element) => {
      let text = "";
      for (const child of element.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          text += textRecords.get(child)?.original ?? child.nodeValue;
        } else if (child.nodeType === Node.ELEMENT_NODE && !child.matches("script, style")) {
          text += originalTextOf(child);
        }
      }
      return text;
    };

    const place = (x, y) => {
      const width = tip.offsetWidth;
      const height = tip.offsetHeight;
      const left = Math.max(8, Math.min(x + 12, window.innerWidth - width - 8));
      const top = y + 18 + height > window.innerHeight ? Math.max(8, y - height - 12) : y + 18;
      tip.style.left = `${left}px`;
      tip.style.top = `${top}px`;
    };

    const hide = () => {
      current = null;
      tip.hidden = true;
    };

    const show = (element, x, y) => {
      let original = originalTextOf(element).replace(/\s+/gu, " ").trim();
      if (original.length > 300) original = `${original.slice(0, 300)}…`;

      current = element;
      origLabelEl.textContent = originalLabel;
      origTextEl.textContent = original;
      tip.hidden = false;
      place(x, y);
    };

    const markedFrom = (target) =>
      target instanceof Element ? target.closest(`[${MARKER_ATTRIBUTE}]`) : null;

    const onMouseOver = (event) => {
      const element = markedFrom(event.target);
      if (!element) hide();
      else if (element !== current) show(element, event.clientX, event.clientY);
    };
    const onMouseMove = (event) => {
      if (current) place(event.clientX, event.clientY);
    };
    const onFocusIn = (event) => {
      const element = markedFrom(event.target);
      if (!element) {
        hide();
        return;
      }
      const rect = element.getBoundingClientRect();
      show(element, rect.left, rect.bottom);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") hide();
    };

    document.addEventListener("mouseover", onMouseOver, true);
    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", hide, true);

    return {
      remove() {
        document.removeEventListener("mouseover", onMouseOver, true);
        document.removeEventListener("mousemove", onMouseMove, true);
        document.removeEventListener("focusin", onFocusIn, true);
        document.removeEventListener("keydown", onKeyDown, true);
        window.removeEventListener("scroll", hide, true);
        host.remove();
        style.remove();
      }
    };
  }

  // ---------------------------------------------------------------------------
  // Cycle de vie
  // ---------------------------------------------------------------------------
  function start() {
    if (active || !document.body) return;
    active = true;
    engine = Translator.createEngine(LEXIQUE, { machineTranslate: requestMachineTranslation });
    ui = createUi();
    walk(document.body);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRIBUTES,
      characterData: true,
      childList: true,
      subtree: true
    });
  }

  function stop() {
    if (!active) return;
    active = false;
    generation += 1;
    observer.disconnect();
    restorePage();
    ui?.remove();
    ui = null;
    engine = null;
  }

  function applySettings(settings) {
    const shouldRun = Array.isArray(settings.enabledSites) && settings.enabledSites.includes(SITE_KEY);
    const nextMachine = settings.machineTranslation !== false;
    const machineChanged = nextMachine !== machineEnabled;
    machineEnabled = nextMachine;

    if (!shouldRun) stop();
    else if (active && machineChanged) {
      stop();
      start();
    } else start();
  }

  function loadSettings() {
    chrome.storage.local.get(DEFAULT_SETTINGS, (settings) => {
      if (chrome.runtime.lastError) {
        console.warn("[Safinum] Préférences illisibles :", chrome.runtime.lastError.message);
        return;
      }
      applySettings(settings);
    });
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && (changes.enabledSites || changes.machineTranslation)) loadSettings();
  });

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request?.action === "safinum_ping") {
      sendResponse({ active });
    }
  });

  loadSettings();
})();
