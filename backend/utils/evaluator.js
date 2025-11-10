function normalizeQuotes(s = "") {
  return s
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2013\u2014\u2015]/g, "-")
    .replace(/\.{3,}/g, "...")   // normalize ellipses
    .replace(/--+/g, "-")        // normalize long dashes
    .replace(/\u00A0/g, " ")     // non-breaking space → normal space
    .trim();
}

function tokenizeKeepingPunct(s = "") {
  const normalized = normalizeQuotes(s);
  // group continuous punctuation as one token
  const re = /[\p{L}\p{N}]+|[.,!?;:'"“”‘’—\-…]+/gu;
  const tokens = [];
  let match;
  while ((match = re.exec(normalized)) !== null) {
    const tok = match[0];
    const isWord = /^[\p{L}\p{N}]+$/u.test(tok);
    tokens.push({
      raw: tok,
      type: isWord ? "word" : "punct",
      base: isWord ? tok.toLowerCase() : tok
    });
  }
  return tokens;
}

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

function lcsIndicesArray(a, b) {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  let i = n, j = m;
  const pairs = [];
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      pairs.unshift([i - 1, j - 1]);
      i--; j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
    else j--;
  }
  return pairs;
}

// ----------------------------------------------------------
// MAIN EVALUATOR (Stable & Accurate for Natural Typing)
// ----------------------------------------------------------
function evaluateSnippet(original = "", userInput = "") {
  const myerrors = {
    capitalSmall: 0,
    punctuation: 0,
    missingExtraWord: 0,
    spelling: 0,
    totalErrorPercentage: 0,
  };

  original = normalizeQuotes(original);
  userInput = normalizeQuotes(userInput);

  const origTokens = tokenizeKeepingPunct(original);
  const userTokens = tokenizeKeepingPunct(userInput);

  const origWordBases = origTokens.filter(t => t.type === "word").map(t => t.base);
  const userWordBases = userTokens.filter(t => t.type === "word").map(t => t.base);

  const matchedWordPairs = lcsIndicesArray(origWordBases, userWordBases);

  // map word-index → token-index
  const mapWordToTokenIdx = (tokens) => {
    const arr = [];
    let wi = 0;
    for (let ti = 0; ti < tokens.length; ti++) {
      if (tokens[ti].type === "word") arr[wi++] = ti;
    }
    return arr;
  };

  const origWordIdxToTokIdx = mapWordToTokenIdx(origTokens);
  const userWordIdxToTokIdx = mapWordToTokenIdx(userTokens);

  // ---------- Capitalization ----------
  for (const [owIdx, uwIdx] of matchedWordPairs) {
    const oTok = origTokens[origWordIdxToTokIdx[owIdx]];
    const uTok = userTokens[userWordIdxToTokIdx[uwIdx]];
    if (oTok.raw.toLowerCase() === uTok.raw.toLowerCase() && oTok.raw !== uTok.raw) {
      myerrors.capitalSmall++;
    }
  }

  // ---------- Stable Punctuation ----------
  const normalizePunct = p => p
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014\u2015]/g, "-")
    .replace(/\.{3,}/g, "...")
    .replace(/--+/g, "-")
    .replace(/\s+/g, "")
    .trim();

  const origPuncts = origTokens.filter(t => t.type === "punct").map(t => normalizePunct(t.raw));
  const userPuncts = userTokens.filter(t => t.type === "punct").map(t => normalizePunct(t.raw));

  let puncErr = 0;
  const len = Math.min(origPuncts.length, userPuncts.length);
  for (let i = 0; i < len; i++) {
    const oP = origPuncts[i];
    const uP = userPuncts[i];
    if (!oP && !uP) continue;
    if (oP !== uP) puncErr++;
  }
  puncErr += Math.abs(origPuncts.length - userPuncts.length);
  myerrors.punctuation = puncErr;

  // ---------- Spelling + Missing/Extra ----------
  let oPrev = -1, uPrev = -1;
  for (let k = 0; k <= matchedWordPairs.length; k++) {
    const [oNext, uNext] = matchedWordPairs[k] || [origWordBases.length, userWordBases.length];
    const origSeg = origWordBases.slice(oPrev + 1, oNext);
    const userSeg = userWordBases.slice(uPrev + 1, uNext);

    const pairCount = Math.min(origSeg.length, userSeg.length);
    for (let p = 0; p < pairCount; p++) {
      const ow = origSeg[p], uw = userSeg[p];
      const dist = levenshtein(ow, uw);
      const maxLen = Math.max(ow.length, uw.length, 1);
      const ratio = dist / maxLen;
      if (dist > 0 && ratio <= 0.35) {
        myerrors.spelling++;
      } else if (dist > 0) {
        myerrors.missingExtraWord++;
      }
    }

    const origLeft = origSeg.length - pairCount;
    const userLeft = userSeg.length - pairCount;
    if (origLeft > 0 || userLeft > 0) {
      myerrors.missingExtraWord += origLeft + userLeft;
    }

    oPrev = oNext;
    uPrev = uNext;
  }

  for (const k of Object.keys(myerrors)) {
    if (!Number.isFinite(myerrors[k])) myerrors[k] = 0;
    else myerrors[k] = Math.max(0, Math.round(myerrors[k]));
  }

  myerrors.totalErrorPercentage =
    myerrors.capitalSmall * 0.7 +
    myerrors.punctuation * 0.7 +  
    myerrors.missingExtraWord * 1.0 +
    myerrors.spelling * 1.0;

  return myerrors;
}

module.exports = { evaluateSnippet };
