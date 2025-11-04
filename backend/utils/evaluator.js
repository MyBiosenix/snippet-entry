function levenshtein(a = "", b = "") {
  const n = a.length, m = b.length;
  if (n === 0) return m;
  if (m === 0) return n;
  const dp = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0));
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

function lcsIndices(a, b) {
  const n = a.length, m = b.length;
  const dp = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0));
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
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return pairs;
}

function stripPunct(s = "") {
  return s.replace(/[^A-Za-z0-9]/g, "");
}

function getPunct(s = "") {
  return s.replace(/[A-Za-z0-9]/g, "");
}


function evaluateSnippet(original = "", userInput = "") {
  const myerrors = {
    capitalSmall: 0,
    punctuation: 0,
    missingExtraWord: 0,
    spelling: 0,
    totalErrorPercentage: 0
  };

  const origWords = original.split(/\s+/).filter(Boolean);
  const userWords = userInput.split(/\s+/).filter(Boolean);

  const origNorm = origWords.map(w => stripPunct(w).toLowerCase());
  const userNorm = userWords.map(w => stripPunct(w).toLowerCase());

  const matchedPairs = lcsIndices(origNorm, userNorm);

  myerrors.missingExtraWord = 0;

  for (const [oi, ui] of matchedPairs) {
    const ow = origWords[oi];
    const uw = userWords[ui];

    const owBase = stripPunct(ow);
    const uwBase = stripPunct(uw);

    if (owBase.toLowerCase() === uwBase.toLowerCase() && ow !== uw) {
      if (ow.toLowerCase() === uw.toLowerCase()) {
        myerrors.capitalSmall++;
      }
    }

    if (stripPunct(ow).toLowerCase() === stripPunct(uw).toLowerCase() && ow !== uw) {
      const owP = getPunct(ow);
      const uwP = getPunct(uw);
      if (owP !== uwP) {
        myerrors.punctuation++;
      }
    }
  }

  let oPrev = -1;
  let uPrev = -1;

  for (let k = 0; k <= matchedPairs.length; k++) {
    const [oNext, uNext] = matchedPairs[k] || [origWords.length, userWords.length];

    const origSeg = origWords.slice(oPrev + 1, oNext);
    const userSeg = userWords.slice(uPrev + 1, uNext);

    const pairCount = Math.min(origSeg.length, userSeg.length);
    for (let p = 0; p < pairCount; p++) {
      const owRaw = origSeg[p];
      const uwRaw = userSeg[p];
      const ow = stripPunct(owRaw).toLowerCase();
      const uw = stripPunct(uwRaw).toLowerCase();
      if (!ow && !uw) continue;
      const dist = levenshtein(ow, uw);
      const maxLen = Math.max(ow.length, uw.length, 1);
      const ratio = dist / maxLen;

      if ((ratio <= 0.4) || (dist <= 2)) {
        myerrors.spelling++;
      } else {
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
    myerrors[k] = Number.isFinite(myerrors[k]) ? Math.max(0, Math.round(myerrors[k])) : 0;
  }

  myerrors.totalErrorPercentage =
    myerrors.capitalSmall * 0.7 +
    myerrors.punctuation * 0.9 +
    myerrors.missingExtraWord * 1.0 +
    myerrors.spelling * 1.0;

  return myerrors;
}


module.exports = { evaluateSnippet };