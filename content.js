let isTranslationEnabled = true;
const originalTextNodes = new Map();
const originalAttributes = new Map();
const translatableAttributes = ["placeholder", "title", "aria-label"];
const translationEntries = Object.entries(HAUSA_DICTIONARY)
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

function translateTextNode(node) {
if (!isTranslationEnabled) return;
const original = node.nodeValue;
const translated = translateValue(original);
if (translated === original) return;
originalTextNodes.set(node, { original, translated });
node.nodeValue = translated;
}

function translateAttribute(element, attribute) {
const original = element.getAttribute(attribute);
if (original === null) return;

let attributes = originalAttributes.get(element);
const previous = attributes && attributes.get(attribute);
if (previous && original === previous.translated) return;

const translated = translateValue(original);
if (translated === original) return;

if (!attributes) {
attributes = new Map();
originalAttributes.set(element, attributes);
}
attributes.set(attribute, { original, translated });
element.setAttribute(attribute, translated);
}

function translateElement(element) {
for (const attribute of translatableAttributes) {
translateAttribute(element, attribute);
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
translateTextNode(currentNode);
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
else if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
}
} else if (mutation.type === "characterData") {
translateTextNode(mutation.target);
} else if (mutation.type === "attributes") {
translateAttribute(mutation.target, mutation.attributeName);
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