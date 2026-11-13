// Moteur de traduction Safinum (sans accès au DOM, testable isolément).
//
// Ordre de décision pour un texte :
//   1. montant / valeur sans lettres      -> jamais modifié
//   2. phrase exacte du lexique           -> "ok"
//   3. modèle avec emplacements           -> "ok" (montants et noms recopiés tels quels)
//   4. lexique mot à mot, couverture 100% -> "ok"
//   5. traduction automatique masquée     -> "mt" / "mt-critical"
//   6. sinon : message de sécurité        -> "kept" (laissé en français)
//              autre texte                -> "partial" (mots connus traduits)
(() => {
  "use strict";

  const TOKEN_RE = /\{([A-Z]{1,2})\}/g;
  const MAX_TOKENS = 100;
  const MAX_MACHINE_LENGTH = 500;
  const FAILURE_RETRY_MS = 30000;

  // Mots courts en majuscules qui ne sont pas des sigles (titres en capitales).
  const UPPERCASE_STOPWORDS = new Set([
    "LE", "LA", "LES", "DE", "DU", "DES", "UN", "UNE", "ET", "OU", "À", "AU", "AUX",
    "EN", "PAR", "POUR", "SUR", "VOS", "VOTRE", "SON", "SA", "SES", "CE", "CET",
    "CETTE", "NE", "PAS", "EST", "IL", "ELLE", "VOUS", "NOUS", "MES", "MON", "MA"
  ]);

  // Messages dont une erreur de sens serait un « défaut majeur » (règlement, §8).
  const CRITICAL_RE = new RegExp(
    "(?<!\\p{L})(?:attention|alerte|avertissement|s[ée]curit[ée]|fraude|arnaque|escroquerie|" +
      "jamais|erreur|[ée]chec|[ée]chou[ée]e?s?|refus[ée]e?s?|bloqu[ée]e?s?|suspendue?s?|" +
      "insuffisante?s?|irr[ée]versible|code|pin|otp|mot de passe|confidentiel(?:le)?s?|" +
      "v[ée]rifiez|ne\\s+(?:communiquez|partagez|donnez|divulguez|transmettez|saisissez))(?!\\p{L})",
    "iu"
  );

  // URL | e-mail | nombre (+ devise) | mot commençant par une majuscule
  const SENSITIVE_RE = new RegExp(
    "(https?:\\/\\/\\S+)" +
      "|([\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+)" +
      "|([-+]?\\d(?:[\\d\\s.,]*\\d)?(?:\\s*(?:F\\s?CFA|FCFA|XAF|CFA|EUR|€|\\$|%)(?!\\p{L}))?)" +
      "|(\\p{Lu}[\\p{L}\\p{M}'’-]*)",
    "gu"
  );

  const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Tolère les variantes d'apostrophe et d'espaces (insécables comprises).
  const sourceToPattern = (text) =>
    escapeRegExp(text.normalize("NFC"))
      .replace(/['’ʼ]/gu, "['’ʼ]")
      .replace(/\s+/gu, "\\s+");

  const normalize = (text) =>
    text
      .normalize("NFC")
      .replace(/[’ʼ]/gu, "'")
      .replace(/\s+/gu, " ")
      .trim()
      .toLocaleLowerCase("fr");

  function isFinancialValue(text) {
    return /^\s*(?:FCFA\s*)?[-+]?\d[\d\s.,]*(?:\s*FCFA)?\s*$/iu.test(text);
  }

  function isCritical(text) {
    return CRITICAL_RE.test(text);
  }

  // « Amina Diallo », « Jean Mbarga » : 2 à 4 mots tous capitalisés = nom propre,
  // jamais traduit ni envoyé au service externe.
  function isLikelyPersonName(text) {
    const words = text.trim().split(/\s+/u);
    return (
      words.length >= 2 &&
      words.length <= 4 &&
      words.every((word) => /^\p{Lu}[\p{Ll}\p{M}'’-]+$/u.test(word))
    );
  }

  function isSentenceStart(text, offset) {
    const before = text.slice(0, offset);
    return /^[\s\p{P}\p{S}]*$/u.test(before) || /[.!?…:]\s*[«"“]?\s*$/u.test(before);
  }

  function tokenName(index) {
    const letter = (n) => String.fromCharCode(65 + n);
    return index < 26 ? letter(index) : letter(Math.floor(index / 26) - 1) + letter(index % 26);
  }

  // Remplace montants, numéros, e-mails, URL, sigles et noms propres par des
  // jetons {A}, {B}... Ces valeurs ne quittent jamais le navigateur et sont
  // réinsérées à l'identique après traduction.
  function maskSensitive(text) {
    const values = new Map();
    const token = (value) => {
      const key = `{${tokenName(values.size)}}`;
      values.set(key, value);
      return key;
    };

    const masked = text.replace(SENSITIVE_RE, (match, url, email, number, word, offset, whole) => {
      if (url || email || number) return token(match);

      const letters = word.replace(/[^\p{L}]/gu, "");
      const isUppercase =
        letters === letters.toLocaleUpperCase("fr") && letters !== letters.toLocaleLowerCase("fr");
      if (isUppercase) {
        return letters.length <= 5 && !UPPERCASE_STOPWORDS.has(letters) ? token(word) : word;
      }
      return isSentenceStart(whole, offset) ? word : token(word);
    });

    return { masked, values };
  }

  // Vérifie l'intégrité d'une traduction : chaque jeton exactement une fois,
  // aucun chiffre inventé. En cas de doute, la traduction est rejetée.
  function restoreTokens(translated, values) {
    const seen = new Map();
    for (const match of translated.matchAll(TOKEN_RE)) {
      seen.set(match[0], (seen.get(match[0]) || 0) + 1);
    }
    if (seen.size !== values.size) return null;
    for (const key of values.keys()) {
      if (seen.get(key) !== 1) return null;
    }

    const withoutTokens = translated.replace(TOKEN_RE, " ");
    if (/\p{N}/u.test(withoutTokens) || /[{}]/u.test(withoutTokens)) return null;

    return translated.replace(TOKEN_RE, (key) => values.get(key));
  }

  function matchCase(source, translation) {
    const letters = source.replace(/[^\p{L}]/gu, "");
    if (
      letters.length > 1 &&
      letters === letters.toLocaleUpperCase("fr") &&
      letters !== letters.toLocaleLowerCase("fr")
    ) {
      return translation.toLocaleUpperCase("fr");
    }
    const first = source.match(/\p{L}/u)?.[0];
    if (first && first === first.toLocaleLowerCase("fr") && first !== first.toLocaleUpperCase("fr")) {
      return translation.charAt(0).toLocaleLowerCase("fr") + translation.slice(1);
    }
    return translation;
  }

  function compileTemplate(source, translation) {
    const parts = source.trim().replace(/[.!]$/u, "").split(/\{(\w+)\}/u);
    const names = [];
    let pattern = "^";
    parts.forEach((part, index) => {
      if (index % 2 === 1) {
        names.push(part);
        pattern += "(.+?)";
      } else {
        pattern += sourceToPattern(part);
      }
    });
    pattern += "\\s*[.!]?$";
    return { regex: new RegExp(pattern, "iu"), names, translation };
  }

  function createEngine(lexique, { machineTranslate = null } = {}) {
    const vocabulary = { ...(lexique.vocabulaire || {}), ...(lexique.vocabulaireAValider || {}) };
    const exact = new Map(
      Object.entries(vocabulary).map(([source, translation]) => [normalize(source), translation])
    );

    // Une seule expression, alternatives triées de la plus longue à la plus courte :
    // un passage unique, sans re-traduire un texte déjà traduit.
    const sources = Object.keys(vocabulary)
      .sort((a, b) => b.length - a.length)
      .map(sourceToPattern);
    const vocabularyRe = sources.length
      ? new RegExp(`(^|[^\\p{L}\\p{N}])(${sources.join("|")})(?=$|[^\\p{L}\\p{N}])`, "giu")
      : null;

    const templates = Object.entries({
      ...(lexique.modeles || {}),
      ...(lexique.modelesAValider || {})
    }).map(([source, translation]) => compileTemplate(source, translation));

    const machineCache = new Map();

    function applyVocabulary(text) {
      if (!vocabularyRe) return { translated: text, leftover: text };
      const translated = text.replace(
        vocabularyRe,
        (_match, prefix, word) => prefix + matchCase(word, exact.get(normalize(word)) ?? word)
      );
      // \u0001 garde la trace d'un mot traduit sans être pris pour un début de phrase.
      const leftover = text.replace(vocabularyRe, (_match, prefix) => `${prefix}\u0001`);
      return { translated, leftover };
    }

    function hasUntranslatedWords(leftover) {
      const { masked } = maskSensitive(leftover);
      return /\p{L}{2,}/u.test(masked.replace(TOKEN_RE, " "));
    }

    function applyTemplates(text) {
      for (const template of templates) {
        const match = template.regex.exec(text);
        if (!match) continue;

        const values = {};
        let valid = true;
        template.names.forEach((name, index) => {
          const value = match[index + 1].trim();
          if (!value || (name.startsWith("montant") && !/\p{N}/u.test(value))) valid = false;
          values[name] = value;
        });
        if (!valid) continue;

        const output = template.translation.replace(/\{(\w+)\}/gu, (placeholder, name) =>
          name in values ? values[name] : placeholder
        );
        // Contrôle d'intégrité : chaque valeur capturée figure dans le résultat.
        if (Object.values(values).every((value) => output.includes(value))) return output;
      }
      return null;
    }

    async function viaMachine(text) {
      if (typeof machineTranslate !== "function") return null;

      const { masked, values } = maskSensitive(text);
      const bare = masked.replace(TOKEN_RE, " ");
      if (
        values.size > MAX_TOKENS ||
        masked.length > MAX_MACHINE_LENGTH ||
        !/\p{L}{2,}/u.test(bare) ||
        /\p{N}/u.test(bare) ||
        /@|https?:/iu.test(bare)
      ) {
        return null;
      }

      let pending = machineCache.get(masked);
      if (!pending) {
        pending = Promise.resolve()
          .then(() => machineTranslate(masked))
          .catch(() => null);
        machineCache.set(masked, pending);
      }

      const raw = await pending;
      if (typeof raw !== "string" || !raw.trim()) {
        setTimeout(() => machineCache.delete(masked), FAILURE_RETRY_MS);
        return null;
      }
      return restoreTokens(raw, values);
    }

    async function translate(value, { allowMachine = true } = {}) {
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      if (!trimmed || !/\p{L}/u.test(trimmed) || isFinancialValue(trimmed)) return null;

      const leading = value.match(/^\s*/u)[0];
      const trailing = value.match(/\s*$/u)[0];
      const wrap = (text, kind) => ({ text: leading + text + trailing, kind });

      const exactTranslation = exact.get(normalize(trimmed));
      if (exactTranslation !== undefined) return wrap(matchCase(trimmed, exactTranslation), "ok");

      const templateTranslation = applyTemplates(trimmed);
      if (templateTranslation !== null) return wrap(templateTranslation, "ok");

      const { translated, leftover } = applyVocabulary(trimmed);
      if (!hasUntranslatedWords(leftover)) {
        return translated === trimmed ? null : wrap(translated, "ok");
      }
      if (isLikelyPersonName(trimmed)) return null;

      const critical = isCritical(trimmed);
      if (allowMachine) {
        const machine = await viaMachine(trimmed);
        if (machine) return wrap(machine, critical ? "mt-critical" : "mt");
      }

      if (critical) return { text: value, kind: "kept" };
      return translated === trimmed ? null : wrap(translated, "partial");
    }

    return { translate };
  }

  globalThis.SafinumTranslator = { createEngine, maskSensitive, restoreTokens };
})();
