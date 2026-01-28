// utils/weights.js
const WEIGHTS = {
  capitalSmall: 0.7,
  punctuation: 0.9,
  missingExtraWord: 1.0,
  spelling: 1.0,
};

function calcTotal(e) {
  return (
    (Number(e.capitalSmall) || 0) * WEIGHTS.capitalSmall +
    (Number(e.punctuation) || 0) * WEIGHTS.punctuation +
    (Number(e.missingExtraWord) || 0) * WEIGHTS.missingExtraWord +
    (Number(e.spelling) || 0) * WEIGHTS.spelling
  );
}

module.exports = { WEIGHTS, calcTotal };
