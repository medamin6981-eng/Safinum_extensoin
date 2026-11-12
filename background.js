chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action !== "translate_text") return;
  const text = typeof request.text === "string" ? request.text.trim() : "";
  if (
    !text ||
    text.length > 500 ||
    text.split(/\s+/u).length < 3 ||
    /[\p{N}]|\b(?:FCFA|RIB|IBAN|BIC)\b|https?:\/\/|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/iu.test(text)
  ) {
    sendResponse({ error: "Invalid translation text" });
    return;
  }

  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", "fr|ha");

  fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`MyMemory returned HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      const translated = data?.responseData?.translatedText;
      if (
        data?.responseStatus !== 200 ||
        typeof translated !== "string" ||
        !translated.trim() ||
        translated.includes("MYMEMORY WARNING")
      ) {
        sendResponse({ translatedText: null });
        return;
      }
      sendResponse({ translatedText: translated });
    })
    .catch((error) => {
      console.warn("Erreur de connexion à l'API MyMemory:", error);
      sendResponse({ error: "MyMemory translation request failed" });
    });

  return true;
});
