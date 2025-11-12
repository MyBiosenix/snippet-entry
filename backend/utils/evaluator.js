// server/utils/evaluateSnippet.js
const { diffWordsWithSpace } = require("diff");

// --- Normalization (quotes, dashes, ellipsis, etc.)
function normalizeText(s = "") {
  return String(s || "")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, "") // invisible chars
    .replace(/[“”]/g, '"') // curly double → straight
    .replace(/[‘’]/g, "'") // curly single → straight
    .replace(/[–—]/g, "-") // long dash → hyphen
    .replace(/…/g, "...") // ellipsis
    .replace(/\u00A0/g, " ") // non-breaking space → normal space
    .replace(/\s+/g, " ") // collapse spaces
    .trim();
}

// --- Simple Levenshtein distance for spelling detection
function levenshtein(a = "", b = "") {
  const n = a.length, m = b.length;
  if (n === 0) return m;
  if (m === 0) return n;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[n][m];
}

const isWordToken = (t) => /^[\p{L}\p{N}'’-]+$/u.test(t);
const isPunctToken = (t) => /^[\p{P}\p{S}]+$/u.test(t);

function tokensFromTextPiece(piece) {
  return piece.trim().split(/\s+/).filter(Boolean);
}

function evaluateSnippet(original = "", userInput = "", opts = { debug: false }) {
  const debug = !!opts.debug;

  const myerrors = {
    capitalSmall: 0,
    punctuation: 0,
    missingExtraWord: 0,
    spelling: 0,
    totalErrorPercentage: 0,
  };

  const a = normalizeText(original);
  const b = normalizeText(userInput);
  const parts = diffWordsWithSpace(a, b);
  const debugParts = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (debug) debugParts.push(part);

    if (part.removed && i + 1 < parts.length && parts[i + 1].added) {
      const removedPart = part.value;
      const addedPart = parts[i + 1].value;
      const remTokens = tokensFromTextPiece(removedPart);
      const addTokens = tokensFromTextPiece(addedPart);
      const pairLen = Math.max(remTokens.length, addTokens.length);

      for (let k = 0; k < pairLen; k++) {
        const ow = remTokens[k] || "";
        const uw = addTokens[k] || "";

        if (!ow && uw) {
          if (isPunctToken(uw)) myerrors.punctuation++;
          else myerrors.missingExtraWord++;
          continue;
        }
        if (ow && !uw) {
          if (isPunctToken(ow)) myerrors.punctuation++;
          else myerrors.missingExtraWord++;
          continue;
        }

        if (ow.toLowerCase() === uw.toLowerCase() && ow !== uw) {
          myerrors.capitalSmall++;
          continue;
        }

        if (isPunctToken(ow) && isPunctToken(uw)) {
          if (ow !== uw) myerrors.punctuation++;
          continue;
        }

        if (isPunctToken(ow) && !isPunctToken(uw)) {
          myerrors.punctuation++;
          myerrors.missingExtraWord++;
          continue;
        }
        if (!isPunctToken(ow) && isPunctToken(uw)) {
          myerrors.punctuation++;
          myerrors.missingExtraWord++;
          continue;
        }

        const dist = levenshtein(ow.toLowerCase(), uw.toLowerCase());
        const ratio = dist / Math.max(ow.length, uw.length, 1);
        if (ratio > 0 && ratio <= 0.35) {
          myerrors.spelling++;
        } else if (ow !== uw) {
          myerrors.missingExtraWord++;
        }
      }

      i++;
      continue;
    }

    if (part.removed || part.added) {
      const tokens = tokensFromTextPiece(part.value);
      for (const tok of tokens) {
        if (isPunctToken(tok)) myerrors.punctuation += (tok.match(/[^\s]/g) || []).length;
        else if (isWordToken(tok)) myerrors.missingExtraWord++;
        else myerrors.missingExtraWord++;
      }
    }
  }

  const awords = a.split(/\s+/).filter(Boolean);
  const bwords = b.split(/\s+/).filter(Boolean);
  const minlen = Math.min(awords.length, bwords.length);
  for (let i = 0; i < minlen; i++) {
    if (awords[i].toLowerCase() === bwords[i].toLowerCase() && awords[i] !== bwords[i]) {
      myerrors.capitalSmall++;
    }
  }

  // --- Weighted error calculation ---
  const capitalWeight = 0.7;
  const punctuationWeight = 0.9;
  const missingExtraWeight = 1.0;
  const spellingWeight = 1.0;

  myerrors.totalErrorPercentage = (
    myerrors.capitalSmall * capitalWeight +
    myerrors.punctuation * punctuationWeight +
    myerrors.missingExtraWord * missingExtraWeight +
    myerrors.spelling * spellingWeight
  );

  for (const k of Object.keys(myerrors)) {
    myerrors[k] = Math.round(myerrors[k] * 100) / 100;
  }

  return debug ? { myerrors, debugParts } : { myerrors };
}

module.exports = { evaluateSnippet };
