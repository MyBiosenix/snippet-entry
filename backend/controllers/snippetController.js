const Snippets = require('../models/Snippet');
const User = require('../models/User');
const { evaluateSnippet } = require('../utils/evaluator')

const getNextSnippet = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate("packages", "name");
    if (!user) return res.status(404).json({ message: "User not found" });

    let maxSnippets = 100;
    const packageName = user.packages?.name?.toLowerCase();

    if (packageName === "vip" || packageName === "diamond") {
      maxSnippets = 200;
    }

    if (!user.snippetOrder || user.snippetOrder.length === 0) {
      const allSnippets = await Snippets.find().select("_id");

      if (!allSnippets.length)
        return res.status(404).json({ message: "No snippets found in database" });

      const shuffled = allSnippets
        .map(s => s._id)
        .sort(() => Math.random() - 0.5)
        .slice(0, maxSnippets);

      user.snippetOrder = shuffled;
      user.currentIndex = 0;
      await user.save();
    }

    if (user.snippetOrder.length > maxSnippets) {
      user.snippetOrder = user.snippetOrder.slice(0, maxSnippets);
      await user.save();
    }

    if (user.currentIndex >= user.snippetOrder.length) {
      return res.json({ done: true, message: "All snippets completed!" });
    }

    const snippetId = user.snippetOrder[user.currentIndex];
    const snippet = await Snippets.findById(snippetId);

    if (!snippet) {
      return res.status(404).json({ message: "Snippet not found" });
    }

    res.json({
      snippetNumber: user.currentIndex + 1,
      totalSnippets: user.snippetOrder.length,
      snippet,
    });

  } catch (err) {
    console.error("Error in getNextSnippet:", err);
    res.status(500).json({ message: err.message });
  }
};



const submitSnippet = async (req, res) => {
  try {
    const { userId, snippetId, userText } = req.body;

    const snippet = await Snippets.findById(snippetId);
    if (!snippet) return res.status(404).json({ message: "Snippet not found" });

    const { myerrors, debugParts } = evaluateSnippet(snippet.content, userText, { debug: true });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.myerrors.push({
      snippetId,
      userText,
      pageNumber: user.currentIndex + 1,
      ...myerrors,
    });

    user.markModified("myerrors");
    user.currentIndex = user.currentIndex + 1;
    await user.save();

    res.json({
      message: "Evaluation saved",
      errors: myerrors,
      debug: debugParts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const getUserResults = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate("myerrors.snippetId", "title content");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.myerrors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getNextSnippetIndex = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    const completedCount = user.myerrors.length;

    res.json({ nextIndex: completedCount + 1 }); 
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const toggleVisibility = async (req, res) => {
  try {
    const { userId, errorId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const target = user.myerrors.id(errorId);
    if (!target) return res.status(404).json({ message: "Result not found" });

    target.visibleToUser = !target.visibleToUser;

    await user.save();

    res.json({
      message: `Visibility toggled to ${target.visibleToUser}`,
      visibleToUser: target.visibleToUser
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const getVisibleUserResults = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .populate("myerrors.snippetId", "title content")
      .lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    const visibleResults = user.myerrors.filter(err => err.visibleToUser === true);

    res.json(visibleResults);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const updateSnippetErrors = async (req, res) => {
  try {
    const { userId, errorId } = req.params;
    const {
      capitalSmall = 0,
      punctuation = 0,
      missingExtraWord = 0,
      spelling = 0,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const target = user.myerrors.id(errorId);
    if (!target) return res.status(404).json({ message: "Result not found" });

    const cs = Number(capitalSmall || 0);
    const p = Number(punctuation || 0);
    const mw = Number(missingExtraWord || 0);
    const sp = Number(spelling || 0);

    const totalErrorPercentage = (cs * 0.9) + (p * 0.7) + (mw * 1) + (sp * 1);

    target.capitalSmall = cs;
    target.punctuation = p;
    target.missingExtraWord = mw;
    target.spelling = sp;
    target.totalErrorPercentage = totalErrorPercentage;

    await user.save();

    const updated = {
      _id: target._id,
      capitalSmall: target.capitalSmall,
      punctuation: target.punctuation,
      missingExtraWord: target.missingExtraWord,
      spelling: target.spelling,
      totalErrorPercentage: target.totalErrorPercentage,
      visibleToUser: target.visibleToUser,
      userText: target.userText,
      snippetId: target.snippetId
    };

    res.json({ message: "Updated", updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


const editUserText = async (req, res) => {
  try {
    const { userId, errorId } = req.params;
    const { userText } = req.body;

    if (typeof userText !== "string") {
      return res.status(400).json({ message: "userText is required (string)" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const target = user.myerrors.id(errorId);
    if (!target) return res.status(404).json({ message: "Result not found" });

    const snippet = await Snippets.findById(target.snippetId).select("content");
    if (!snippet) return res.status(404).json({ message: "Snippet not found" });

    target.userText = userText;

    const { myerrors } = evaluateSnippet(snippet.content, userText);

    target.capitalSmall = myerrors.capitalSmall;
    target.punctuation = myerrors.punctuation;
    target.missingExtraWord = myerrors.missingExtraWord;
    target.spelling = myerrors.spelling;
    target.totalErrorPercentage = myerrors.totalErrorPercentage;

    target.editedAt = new Date();

    user.markModified("myerrors");
    await user.save();

    return res.json({
      message: "User text updated & re-evaluated",
      updated: {
        _id: target._id,
        userText: target.userText,
        capitalSmall: target.capitalSmall,
        punctuation: target.punctuation,
        missingExtraWord: target.missingExtraWord,
        spelling: target.spelling,
        totalErrorPercentage: target.totalErrorPercentage,
        visibleToUser: target.visibleToUser,
        snippetId: target.snippetId,
        pageNumber: target.pageNumber,
      },
    });
  } catch (err) {
    console.error("editUserText error:", err);
    return res.status(500).json({ message: err.message });
  }
};




const showUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate("myerrors.snippetId", "title content"); 

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.myerrors); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch user snippets" });
  }
};

module.exports = { getNextSnippet, submitSnippet, getUserResults, getNextSnippetIndex, toggleVisibility, getVisibleUserResults, updateSnippetErrors,showUser,editUserText};