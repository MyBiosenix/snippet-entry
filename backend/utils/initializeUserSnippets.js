const User = require("../models/User");
const Snippet = require("../models/Snippet");

async function initializeUserSnippets(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found while initializing snippets");

  // If snippet order already exists, do nothing
  if (user.snippetOrder && user.snippetOrder.length > 0) return;

  const snippets = await Snippet.find({}, "_id");
  const randomOrder = snippets.map(s => s._id).sort(() => Math.random() - 0.5);

  user.snippetOrder = randomOrder;
  await user.save();
}

module.exports = { initializeUserSnippets };
