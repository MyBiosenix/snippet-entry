// utils/analyzer.js
const { calcTotal } = require("./weights");

function normalize(s = "") {
  return String(s || "")
    .normalize("NFKC")
    .replace(/\u2026/g, "...")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const strip = (s) => String(s || "").replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
const stripPunct = (s) => String(s || "").replace(/[^\p{L}\p{N}]/gu, "");
const getPunct = (s) => String(s || "").replace(/[\p{L}\p{N}]/gu, "");

function analyze(original = "", userText = "") {
  original = normalize(original);
  userText = normalize(userText);

  const oWords = original.split(/\s+/).filter(Boolean);
  const uWords = userText.split(/\s+/).filter(Boolean);

  const oNorm = oWords.map(strip);
  const uNorm = uWords.map(strip);

  const m = oNorm.length, n = uNorm.length;

  // LCS dp
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oNorm[i - 1] === uNorm[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // backtrack
  let i = m, j = n;
  const align = [];
  while (i > 0 && j > 0) {
    if (oNorm[i - 1] === uNorm[j - 1]) {
      align.unshift({ ow: oWords[i - 1], uw: uWords[j - 1] });
      i--; j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      align.unshift({ ow: oWords[i - 1], uw: null });
      i--;
    } else {
      align.unshift({ ow: null, uw: uWords[j - 1] });
      j--;
    }
  }
  while (i > 0) align.unshift({ ow: oWords[i - 1], uw: null }), i--;
  while (j > 0) align.unshift({ ow: null, uw: uWords[j - 1] }), j--;

  const errors = {
    capitalSmall: 0,
    punctuation: 0,
    missingExtraWord: 0,
    spelling: 0,
    totalErrorPercentage: 0,
  };

  const displayTokens = [];

  for (let k = 0; k < align.length; k++) {
    const { ow, uw } = align[k];

    // missing word
    if (ow && !uw) {
      errors.missingExtraWord++;
      displayTokens.push({ text: `(${ow})`, cls: "error-red", tip: "Missing word" });
      continue;
    }

    // extra word
    if (!ow && uw) {
      errors.missingExtraWord++;
      displayTokens.push({ text: uw, cls: "error-red", tip: "Extra word" });
      continue;
    }

    const baseO = stripPunct(ow);
    const baseU = stripPunct(uw);

    const baseOlower = baseO.toLowerCase();
    const baseUlower = baseU.toLowerCase();

    // capital/small mistake
    if (baseOlower === baseUlower && baseO !== baseU) {
      errors.capitalSmall++;
      displayTokens.push({ text: uw, cls: "error-red", tip: "Capital/Small mistake" });
      continue;
    }

    // spelling mistake
    if (baseOlower !== baseUlower) {
      errors.spelling++;
      displayTokens.push({ text: uw, cls: "error-red", tip: "Spelling mistake" });
      continue;
    }

    // punctuation differs
    const pO = getPunct(ow);
    const pU = getPunct(uw);
    if (pO !== pU) {
      errors.punctuation++;
      displayTokens.push({ text: uw, cls: "error-blue", tip: "Punctuation differs" });
      continue;
    }

    // ok
    displayTokens.push({ text: uw, cls: "", tip: "" });
  }

  errors.totalErrorPercentage = calcTotal(errors);

  // round
  for (const k of Object.keys(errors)) {
    errors[k] = Math.round((Number(errors[k]) || 0) * 100) / 100;
  }

  return { errors, displayTokens };
}

module.exports = { analyze };
