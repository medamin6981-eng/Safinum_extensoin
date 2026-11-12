let isTranslationEnabled = true;
const originalTextNodes = new Map();
const originalAttributes = new Map();
const translationCache = new Map();
const pendingTranslations = new Map();
const translatableAttributes = ["placeholder", "title", "aria-label"];
const dictionaryEntries = Object.entries(HAUSA_DICTIONARY);
const exactTranslations = new Map(
  dictionaryEntries.map(([source, translation]) => [source.trim().toLocaleLowerCase("fr"), translation])
);
const translationEntries = dictionaryEntries
  .sort(([left], [right]) => right.length - left.length)
  .map(([source, translation]) => ({
    pattern: new RegExp(
      `(^|[^\\p{L}\\p{N}])${source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|[^\\p{L}\\p{N}])`,
      "giu"
    ),
    translation
  }));

function translateValue(value) {
  if (isFinancialValue(value)) return value;

  let translated = value;
  for (const entry of translationEntries) {
    translated = translated.replace(entry.pattern, (_match, prefix) => prefix + entry.translation);
  }
  return translated;
}

function canUseTranslationApi(text, contextElement) {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/u);
  if (
    !trimmed ||
    trimmed.length > 500 ||
    /[\p{N}]|\b(?:FCFA|RIB|IBAN|BIC)\b|https?:\/\/|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/iu.test(trimmed) ||
    words.length < 3
  ) {
    return false;
  }
  if (contextElement?.closest("input, textarea, select, [contenteditable], script, style")) {
    return false;
  }
  return true;
}

function requestMyMemoryTranslation(text) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: "translate_text", text }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (response?.error) {
        reject(new Error(response.error));
        return;
      }
      resolve(response?.translatedText || null);
    });
  });
}

function fetchMyMemoryTranslation(text) {
  if (translationCache.has(text)) return Promise.resolve(translationCache.get(text));
  if (pendingTranslations.has(text)) return pendingTranslations.get(text);

  const request = requestMyMemoryTranslation(text)
    .then((translated) => {
      if (translated !== null) translationCache.set(text, translated);
      return translated;
    })
    .catch((error) => {
      console.warn("Erreur de connexion à l'API MyMemory:", error);
      return null;
    })
    .finally(() => pendingTranslations.delete(text));

  pendingTranslations.set(text, request);
  return request;
}

async function translateValueHybrid(value, contextElement) {
  const dictionaryTranslation = translateValue(value);
  const trimmed = value.trim();
  const exactTranslation = exactTranslations.get(trimmed.toLocaleLowerCase("fr"));
  if (exactTranslation !== undefined) {
    const leadingWhitespace = value.match(/^\s*/u)[0];
    const trailingWhitespace = value.match(/\s*$/u)[0];
    return `${leadingWhitespace}${exactTranslation}${trailingWhitespace}`;
  }

  if (!canUseTranslationApi(value, contextElement)) return dictionaryTranslation;

  const translation = await fetchMyMemoryTranslation(trimmed);
  if (!translation) return dictionaryTranslation;

  const leadingWhitespace = value.match(/^\s*/u)[0];
  const trailingWhitespace = value.match(/\s*$/u)[0];
  return `${leadingWhitespace}${translation}${trailingWhitespace}`;
}

async function translateTextNode(node) {
  if (!isTranslationEnabled) return;
  const original = node.nodeValue;
  if (original === null) return;

  const previous = originalTextNodes.get(node);
  if (previous?.translated === original) return;

  const translated = await translateValueHybrid(original, node.parentElement);
  if (
    !isTranslationEnabled ||
    !node.isConnected ||
    node.nodeValue !== original ||
    translated === original
  ) {
    return;
  }

  originalTextNodes.set(node, { original, translated });
  node.nodeValue = translated;
}

async function translateAttribute(element, attribute) {
  const original = element.getAttribute(attribute);
  if (original === null) return;

  let attributes = originalAttributes.get(element);
  const previous = attributes && attributes.get(attribute);
  if (previous && original === previous.translated) return;

  const translated = await translateValueHybrid(original, element);
  if (
    !isTranslationEnabled ||
    !element.isConnected ||
    element.getAttribute(attribute) !== original ||
    translated === original
  ) {
    return;
  }

  if (!attributes) {
    attributes = new Map();
    originalAttributes.set(element, attributes);
  }
  attributes.set(attribute, { original, translated });
  element.setAttribute(attribute, translated);
}

function translateElement(element) {
  for (const attribute of translatableAttributes) {
    void translateAttribute(element, attribute);
  }
}

function walkDOM(rootNode) {
  if (rootNode.nodeType === Node.ELEMENT_NODE) translateElement(rootNode);
  const walker = document.createTreeWalker(
    rootNode,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
  );
  let currentNode;
  while ((currentNode = walker.nextNode())) {
    if (currentNode.nodeType === Node.ELEMENT_NODE) {
      translateElement(currentNode);
    } else {
      void translateTextNode(currentNode);
    }
  }
}

function restoreOriginalText() {
  for (const [node, values] of originalTextNodes) {
    if (node.isConnected && node.nodeValue === values.translated) {
      node.nodeValue = values.original;
    }
  }
  originalTextNodes.clear();

  for (const [element, attributes] of originalAttributes) {
    if (!element.isConnected) continue;
    for (const [attribute, values] of attributes) {
      if (element.getAttribute(attribute) === values.translated) {
        element.setAttribute(attribute, values.original);
      }
    }
  }
  originalAttributes.clear();
}

function cleanupDetachedTextNodes() {
  for (const [node] of originalTextNodes) {
    if (!node.isConnected) originalTextNodes.delete(node);
  }
  for (const [element] of originalAttributes) {
    if (!element.isConnected) originalAttributes.delete(element);
  }
}

walkDOM(document.body);

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (!isTranslationEnabled) break;

    if (mutation.type === "childList") {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) walkDOM(node);
        else if (node.nodeType === Node.TEXT_NODE) void translateTextNode(node);
      }
    } else if (mutation.type === "characterData") {
      void translateTextNode(mutation.target);
    } else if (mutation.type === "attributes") {
      void translateAttribute(mutation.target, mutation.attributeName);
    }
  }
  cleanupDetachedTextNodes();
});
observer.observe(document.body, {
  attributes: true,
  attributeFilter: translatableAttributes,
  characterData: true,
  childList: true,
  subtree: true
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "get_translation_state") {
    sendResponse({ enabled: isTranslationEnabled });
    return;
  }

  if (request.action === "toggle_translation") {
    isTranslationEnabled = request.enabled === true;
    if (isTranslationEnabled) {
      walkDOM(document.body);
    } else {
      restoreOriginalText();
    }
    sendResponse({ enabled: isTranslationEnabled });
  }
});
