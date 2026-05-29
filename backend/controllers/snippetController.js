const Snippets = require('../models/Snippet');
const User = require('../models/User');
const { evaluateSnippet } = require('../utils/evaluator')
const { getPackagePageLimit } = require('../utils/packageRules');
const mongoose = require("mongoose");
const {
  buildPaginatedResponse,
  escapeRegex,
  parsePaginationQuery,
} = require("../utils/pagination");

let snippetIdCache = null;
let snippetIdCachePromise = null;

function shuffleIds(ids) {
  return [...ids].sort(() => Math.random() - 0.5);
}

function getCompletedProgress(user) {
  const entries = Array.isArray(user?.myerrors) ? user.myerrors : [];
  const submittedCount = entries.length;
  const maxPageNumber = entries.reduce((max, entry) => {
    const pageNumber = Number(entry?.pageNumber) || 0;
    return Math.max(max, pageNumber);
  }, 0);

  return Math.max(submittedCount, maxPageNumber);
}

function isUserExpired(dateValue) {
  if (!dateValue) {
    return false;
  }

  const expiry = new Date(dateValue);
  if (Number.isNaN(expiry.getTime())) {
    return false;
  }

  expiry.setHours(23, 59, 59, 999);
  return expiry.getTime() <= Date.now();
}

async function syncUserProgress(user) {
  const completedProgress = getCompletedProgress(user);

  if (completedProgress > (Number(user.currentIndex) || 0)) {
    user.currentIndex = completedProgress;
    await user.save();
  }

  return completedProgress;
}

async function getAllSnippetIds() {
  if (Array.isArray(snippetIdCache) && snippetIdCache.length > 0) {
    return snippetIdCache;
  }

  if (!snippetIdCachePromise) {
    snippetIdCachePromise = Snippets.find().select("_id").lean()
      .then((snippets) => {
        snippetIdCache = snippets.map((snippet) => snippet._id);
        return snippetIdCache;
      })
      .finally(() => {
        snippetIdCachePromise = null;
      });
  }

  return snippetIdCachePromise;
}

async function getPaginatedUserResults(req, res, options = {}) {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }
  const {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
    search,
  } = parsePaginationQuery(req.query, {
    defaultLimit: 20,
    defaultSortBy: "pageNumber",
    defaultSortOrder: "asc",
    allowedSortFields: ["pageNumber", "totalErrorPercentage", "createdAt", "editedAt"],
  });

  const basePipeline = [
    { $match: { _id: new mongoose.Types.ObjectId(userId) } },
    { $unwind: "$myerrors" },
  ];

  if (options.visibleOnly) {
    basePipeline.push({ $match: { "myerrors.visibleToUser": true } });
  }

  basePipeline.push(
    {
      $lookup: {
        from: "snippets",
        localField: "myerrors.snippetId",
        foreignField: "_id",
        as: "snippetData",
      },
    },
    {
      $addFields: {
        snippetData: { $arrayElemAt: ["$snippetData", 0] },
      },
    }
  );

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    basePipeline.push({
      $match: {
        $or: [
          { "myerrors.userText": regex },
          { "snippetData.title": regex },
          { "snippetData.content": regex },
        ],
      },
    });
  }

  const sortMap = {
    pageNumber: "myerrors.pageNumber",
    totalErrorPercentage: "myerrors.totalErrorPercentage",
    createdAt: "myerrors.createdAt",
    editedAt: "myerrors.editedAt",
  };

  const mongoSortField = sortMap[sortBy] || "myerrors.pageNumber";
  const mongoSort = { [mongoSortField]: sortOrder === "asc" ? 1 : -1, "myerrors._id": 1 };

  const countPipeline = [...basePipeline, { $count: "total" }];
  const dataPipeline = [
    ...basePipeline,
    { $sort: mongoSort },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: "$myerrors._id",
        snippetId: {
          _id: "$snippetData._id",
          title: "$snippetData.title",
          content: "$snippetData.content",
        },
        userText: "$myerrors.userText",
        capitalSmall: "$myerrors.capitalSmall",
        punctuation: "$myerrors.punctuation",
        missingExtraWord: "$myerrors.missingExtraWord",
        spelling: "$myerrors.spelling",
        totalErrorPercentage: "$myerrors.totalErrorPercentage",
        displayTokens: "$myerrors.displayTokens",
        createdAt: "$myerrors.createdAt",
        editedAt: "$myerrors.editedAt",
        visibleToUser: "$myerrors.visibleToUser",
        pageNumber: "$myerrors.pageNumber",
      },
    },
  ];

  const [rows, countResult] = await Promise.all([
    User.aggregate(dataPipeline),
    User.aggregate(countPipeline),
  ]);

  return res.json(buildPaginatedResponse(rows, page, limit, countResult[0]?.total || 0));
}

const getNextSnippet = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select("packages snippetOrder currentIndex myerrors date")
      .populate("packages", "name pages");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (isUserExpired(user.date)) {
      return res.json({
        expired: true,
        validTill: user.date,
      });
    }

    const maxSnippets = getPackagePageLimit(user.packages);
    const allSnippetIds = await getAllSnippetIds();

    if (!allSnippetIds.length) {
      return res.status(404).json({ message: "No snippets found in database" });
    }

    if (!user.snippetOrder || user.snippetOrder.length === 0) {
      user.snippetOrder = shuffleIds(allSnippetIds).slice(0, maxSnippets);
      user.currentIndex = 0;
      await user.save();
    }

    // ✅ ensure order is not bigger than package limit
    if (user.snippetOrder.length > maxSnippets) {
      user.snippetOrder = user.snippetOrder.slice(0, maxSnippets);

      // also clamp currentIndex if needed
      if (user.currentIndex > user.snippetOrder.length) {
        user.currentIndex = user.snippetOrder.length;
      }

      await user.save();
    }

    if (user.snippetOrder.length < maxSnippets) {
      const existingIds = new Set(user.snippetOrder.map((id) => String(id)));
      const missingPool = shuffleIds(
        allSnippetIds.filter((id) => !existingIds.has(String(id)))
      );

      const needed = maxSnippets - user.snippetOrder.length;
      user.snippetOrder = [...user.snippetOrder, ...missingPool.slice(0, needed)];
      await user.save();
    }

    await syncUserProgress(user);

    if (user.currentIndex >= user.snippetOrder.length) {
      return res.json({
        done: true,
        expired: false,
        validTill: user.date,
        message: "All snippets completed!",
      });
    }

    const snippetId = user.snippetOrder[user.currentIndex];
    const snippet = await Snippets.findById(snippetId).lean();

    if (!snippet) {
      return res.status(404).json({ message: "Snippet not found" });
    }

    res.json({
      expired: false,
      validTill: user.date,
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

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    await syncUserProgress(user);

    if (!Array.isArray(user.snippetOrder) || user.currentIndex >= user.snippetOrder.length) {
      return res.status(400).json({ message: "No active snippet available for submission" });
    }

    const expectedSnippetId = String(user.snippetOrder[user.currentIndex]);
    if (String(snippetId) !== expectedSnippetId) {
      return res.status(409).json({ message: "Snippet submission is out of sequence" });
    }

    const existingPage = user.myerrors.find(
      (entry) => entry.pageNumber === user.currentIndex + 1
    );
    if (existingPage) {
      return res.status(409).json({ message: "This page has already been submitted" });
    }

    const snippet = await Snippets.findById(snippetId);
    if (!snippet) return res.status(404).json({ message: "Snippet not found" });

    const { myerrors, debugParts } = evaluateSnippet(snippet.content, userText, { debug: true });

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
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const existingUser = await User.exists({ _id: req.params.userId });
    if (!existingUser) return res.status(404).json({ message: "User not found" });
    return getPaginatedUserResults(req, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getNextSnippetIndex = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    const completedCount = getCompletedProgress(user);

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
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const existingUser = await User.exists({ _id: req.params.userId });
    if (!existingUser) return res.status(404).json({ message: "User not found" });
    return getPaginatedUserResults(req, res, { visibleOnly: true });
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
    const userId = req.params.userId || req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const user = await User.exists({ _id: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return getPaginatedUserResults(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch user snippets" });
  }
};

module.exports = { getNextSnippet, submitSnippet, getUserResults, getNextSnippetIndex, toggleVisibility, getVisibleUserResults, updateSnippetErrors,showUser,editUserText};
