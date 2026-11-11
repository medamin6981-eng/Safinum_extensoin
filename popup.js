document.addEventListener("DOMContentLoaded", () => {
const btn = document.getElementById("toggle-btn");
const status = document.getElementById("status-text");
let activeTabId;
let translationEnabled = false;
let pageAvailable = true;

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
if (!tabs[0] || tabs[0].id === undefined) {
pageAvailable = false;
updateUI();
return;
}

activeTabId = tabs[0].id;
chrome.tabs.sendMessage(activeTabId, { action: "get_translation_state" }, (response) => {
if (chrome.runtime.lastError) {
translationEnabled = false;
} else {
translationEnabled = response.enabled === true;
}
updateUI();
});
});

btn.addEventListener("click", () => {
if (activeTabId === undefined || !pageAvailable) return;

btn.disabled = true;
const nextState = !translationEnabled;
chrome.tabs.sendMessage(activeTabId, { action: "toggle_translation", enabled: nextState }, (response) => {
if (chrome.runtime.lastError) {
if (!nextState) {
pageAvailable = false;
updateUI();
return;
}

chrome.scripting.executeScript(
{ target: { tabId: activeTabId }, files: ["dictionary.js", "content.js"] },
() => {
if (chrome.runtime.lastError) {
pageAvailable = false;
translationEnabled = false;
} else {
translationEnabled = true;
}
updateUI();
}
);
return;
}

translationEnabled = response.enabled === true;
updateUI();
});
});

function updateUI(enabled) {
btn.disabled = !pageAvailable;
status.innerText = !pageAvailable
? "Indisponible sur cette page"
: translationEnabled
? "Traduction active sur cet onglet (HA)"
: "Traduction inactive sur cet onglet";
btn.innerText = translationEnabled ? "Désactiver" : "Traduire cette page";
btn.style.background = translationEnabled ? "#dc2626" : "#0284c7";
}
});