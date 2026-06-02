const User = require('../models/User');
const Snippet = require('../models/Snippet');
const Packages = require('../models/Package');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { getPackagePageLimit, hasTargetAchieved } = require('../utils/packageRules');
const env = require('../config/env');
const {
  buildPaginatedResponse,
  escapeRegex,
  parsePaginationQuery,
} = require("../utils/pagination");

function getCompletedPages(user) {
  if (Array.isArray(user?.myerrors)) {
    return user.myerrors.length;
  }

  return Number(user?.currentIndex) || 0;
}

function withCompletedPages(user) {
  if (!user) return user;

  return {
    ...user,
    completedPages: getCompletedPages(user),
  };
}

const USER_LIST_SELECT =
  "name email mobile paymentoptions price isActive isDraft date currentIndex admin packages isComplete isDeclared declaredAt softwareUsed notInSequence";

const USER_PROFILE_SELECT =
  "name email mobile price paymentoptions date isActive isDeclared declaredAt isComplete softwareUsed notInSequence admin packages";

function buildUserSort(sortBy = "_id", sortOrder = "asc") {
  const direction = sortOrder === "asc" ? 1 : -1;

  switch (sortBy) {
    case "_id":
    case "createdAt":
      return { _id: direction };

    case "date":
      return { date: direction, _id: 1 };

    case "name":
      return { name: direction, _id: 1 };

    case "email":
      return { email: direction, _id: 1 };

    case "admin":
      return { "admin.name": direction, name: 1, _id: 1 };

    case "package":
      return { "packages.name": direction, name: 1, _id: 1 };

    case "completedPages":
      return { completedPages: direction, _id: 1 };

    case "isActive":
      return { isActive: direction, name: 1, _id: 1 };

    default:
      return { _id: 1 };
  }
}

async function getPaginatedUsers(req, res, options = {}) {
  const {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
    search,
  } = parsePaginationQuery(req.query, {
    defaultLimit: 10,
  defaultSortBy: "_id",
defaultSortOrder: "asc",
allowedSortFields: [
  "_id",
  "createdAt",
  "date",
  "name",
  "email",
  "admin",
  "package",
  "completedPages",
  "isActive",
],
  });

  const baseMatch = {};

  if (typeof options.isActive === "boolean") {
    baseMatch.isActive = options.isActive;
  }

  if (typeof options.isDraft === "boolean") {
    baseMatch.isDraft = options.isDraft;
  }

  if (options.adminId) {
    baseMatch.admin = new mongoose.Types.ObjectId(options.adminId);
  }

  if (options.expiringSoon) {
    const today = new Date();
    const next4Days = new Date();
    next4Days.setDate(today.getDate() + 4);
    baseMatch.date = { $gte: today, $lte: next4Days };
  }

  const regex = search ? new RegExp(escapeRegex(search), "i") : null;

  const pipeline = [
    { $match: baseMatch },
    {
      $lookup: {
        from: "admins",
        localField: "admin",
        foreignField: "_id",
        as: "adminData",
      },
    },
    {
      $lookup: {
        from: "packages",
        localField: "packages",
        foreignField: "_id",
        as: "packageData",
      },
    },
    {
      $addFields: {
        adminData: { $arrayElemAt: ["$adminData", 0] },
        packageData: { $arrayElemAt: ["$packageData", 0] },
      },
    },
    {
      $addFields: {
        completedPages: {
          $let: {
            vars: { errorCount: { $size: { $ifNull: ["$myerrors", []] } } },
            in: {
              $cond: [
                { $gt: ["$$errorCount", 0] },
                "$$errorCount",
                { $ifNull: ["$currentIndex", 0] },
              ],
            },
          },
        },
        admin: {
          _id: "$adminData._id",
          name: "$adminData.name",
        },
        packages: {
          _id: "$packageData._id",
          name: "$packageData.name",
          pages: "$packageData.pages",
        },
        searchDate: {
          $dateToString: {
            format: "%d/%m/%Y",
            date: "$date",
            timezone: "Asia/Calcutta",
          },
        },
      },
    },
  ];

  if (options.targetsAchieved) {
    pipeline.push({
      $match: {
        $expr: {
          $gte: [
            "$completedPages",
            { $multiply: [{ $ifNull: ["$packageData.pages", 0] }, 0.75] },
          ],
        },
      },
    });
  }

  if (regex) {
    const searchMatch = {
      $or: [
        { name: regex },
        { email: regex },
        { "adminData.name": regex },
        { "packageData.name": regex },
        { searchDate: regex },
      ],
    };

    const lowerSearch = search.toLowerCase();

    if ("active".includes(lowerSearch)) {
      searchMatch.$or.push({ isActive: true });
    }

    if ("inactive".includes(lowerSearch) || "deactivated".includes(lowerSearch)) {
      searchMatch.$or.push({ isActive: false });
    }

    if ("draft".includes(lowerSearch)) {
      searchMatch.$or.push({ isDraft: true });
    }

    if ("complete".includes(lowerSearch)) {
      searchMatch.$or.push({ isComplete: true });
    }

    if ("incomplete".includes(lowerSearch)) {
      searchMatch.$or.push({ isComplete: false });
    }

    if ("software".includes(lowerSearch)) {
      searchMatch.$or.push({ softwareUsed: true });
    }

    if ("sequence".includes(lowerSearch)) {
      searchMatch.$or.push({ notInSequence: true });
    }

    pipeline.push({ $match: searchMatch });
  }

  const countPipeline = [...pipeline, { $count: "total" }];
  const dataPipeline = [
    ...pipeline,
    { $project: { myerrors: 0, lastLoginSession: 0, adminData: 0, packageData: 0 } },
    { $sort: buildUserSort(sortBy, sortOrder) },
    { $skip: skip },
    { $limit: limit },
  ];

  const [data, countResult] = await Promise.all([
    User.aggregate(dataPipeline),
    User.aggregate(countPipeline),
  ]);

  const total = countResult[0]?.total || 0;

  return res.status(200).json(buildPaginatedResponse(data, page, limit, total));
}

exports.login = async (req, res) => {
  try {
    const { email, password, forceLogin } = req.body;

    const myuser = await User.findOne({ email }).populate('packages','name');
    if (!myuser) return res.status(400).json({ message: 'User Does Not Exist' });

    if (password !== myuser.password)
      return res.status(400).json({ message: 'Incorrect Password' });

    if (!myuser.isActive)
      return res.status(400).json({ message: 'Your Account has been deactivated. Contact Admin' });

    if (myuser.lastLoginSession && !forceLogin) {
      return res.status(409).json({
        message: 'You are already logged in on another device. Click login again to continue.',
        requiresForceLogin: true
      });
    }

    const token = jwt.sign(
      { id: myuser._id },
      env.jwtSecret,
      { expiresIn: env.userJwtExpiresIn }
    );

    myuser.lastLoginSession = token;
    await myuser.save();

    res.status(200).json({
      message: 'Login Successful',
      token,
      expiresIn: env.userJwtExpiresIn,
      user: { id: myuser._id, name: myuser.name, email: myuser.email, mobile: myuser.mobile,package: myuser.packages?.name, isActive: myuser.isActive }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    const userId = req.user._id; 
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.lastLoginSession = null;
    await user.save();

    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Server error during logout" });
  }
};


exports.createUser = async (req, res) => {
  try {
    const { name, email, mobile, admin, packages, price, paymentoptions, date } = req.body;

    if (!date) return res.status(400).json({ message: "Expiry date/time is required" });

    const expiryDate = new Date(date);
    if (isNaN(expiryDate.getTime())) {
      return res.status(400).json({ message: "Invalid expiry date/time" });
    }

    const password = getRandomPassword();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already Exists" });
    }

    const selectedPackage = await Packages.findById(packages).select("pages");
    if (!selectedPackage) {
      return res.status(400).json({ message: "Selected package does not exist" });
    }

    const allSnippets = await Snippet.find({}, "_id");
    const snippetLimit = getPackagePageLimit(selectedPackage);
    const shuffled = allSnippets
      .map((s) => s._id)
      .sort(() => Math.random() - 0.5)
      .slice(0, snippetLimit);

    const newUser = await User.create({
      name,
      email,
      mobile,
      admin,
      packages,
      price,
      paymentoptions,
      date: expiryDate,       // ✅ store as Date object
      password,
      snippetOrder: shuffled,
      currentIndex: 0,
    });

    res.status(200).json({
      message: "User Created Successfully",
      user: {
        _id: newUser.id,
        name: newUser.name,
        mobile: newUser.mobile,
        admin: newUser.admin,
        packages: newUser.packages,
        price: newUser.price,
        paymentoptions: newUser.paymentoptions,
        date: newUser.date, // expiry datetime
        password: newUser.password,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getUsers = async (req, res) => {
  try {
    return getPaginatedUsers(req, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



function getRandomPassword(length = 7){
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&!()';
    let password = '';
    for(let i = 0; i < length; i++){
        password += chars.charAt(Math.floor(Math.random()*chars.length))
    }
    return password;
}

exports.activateUser = async(req,res) => {
    try{
        const {id} = req.params;
        await User.findByIdAndUpdate(id,{isActive:true});
        res.status(200).json({message: 'User Activated Succesfully'});
    }
    catch(err){
        res.status(400).json({message: err.message});
    }
}

exports.deactivateUser = async(req,res) => {
    try{
        const {id} = req.params;
        await User.findByIdAndUpdate(id,{isActive:false});
        res.status(200).json({message: 'User Deactivated Succesfully'});
    }
    catch(err){
        res.status(400).json({message: err.message});
    }
}

exports.getActiveUsers = async(req,res) => {
    try{
        return getPaginatedUsers(req, res, { isActive: true });
    }
    catch(err){
        res.status(400).json({ message: err.message });
    }
}

exports.getInActiveUsers = async(req,res) => {
    try{
        return getPaginatedUsers(req, res, { isActive: false });
    }
    catch(err){
        res.status(400).json({ message: err.message });
    }
}

exports.deleteUser = async(req,res) => {
    try{
        const {id} = req.params;
        await User.findByIdAndDelete(id);
        res.status(200).json({ message: 'User Deleted Succesfully'});
    }
    catch(err){
        res.status(400).json(err.message);
    }
}

exports.editUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, mobile, admin, packages, price, paymentoptions, date } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(400).json({ message: "User does not Exist" });
    }

    if (!date) return res.status(400).json({ message: "Expiry date/time is required" });

    const expiryDate = new Date(date);
    if (isNaN(expiryDate.getTime())) {
      return res.status(400).json({ message: "Invalid expiry date/time" });
    }

    // Optional: email uniqueness check on edit
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && String(existingUser._id) !== String(user._id)) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    user.name = name;
    user.email = email;
    user.mobile = mobile;
    user.admin = admin;
    user.packages = packages;
    user.price = price;
    user.paymentoptions = paymentoptions;
    user.date = expiryDate; // ✅ store Date object

    await user.save();
    res.status(200).json({ message: "User Updated Successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.addToDrafts = async(req,res) => {
  try{
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      {isDraft:true},
    )
    if(!user){
      return res.status(400).json({message:'User Not Found'});
    }

    res.status(200).json({message:'User Moved to Drafts'});
  }
  catch(err){
    res.status(500).json(err.message);
  }
}

exports.removeDrafts = async(req,res) => {
  try{
    const {id} = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      {isDraft:false}
    )

    if(!user){
      return res.status(400).json({message:'User Not Found'});
    }
    res.status(200).json({message:'User Removed from Drafts'});
  }
  catch(err){
    res.status(500).json(err.message);
  }
}

exports.getDrafts = async(req,res) => {
  try{
    return getPaginatedUsers(req, res, { isDraft: true });
  }
  catch(err){
    res.status(500).json({ message: err.message });
  }
}

exports.changePassword = async(req,res) => {
    try{
        const {id} = req.params;
        const {password, newPassword} = req.body;

        const user = await User.findById(id);
        if(!user){
            return res.status(400).json({message: 'User Does Not Exist'});
        }
        if(password !== user.password){
            return res.status(400).json({message: 'Invalid Password'});
        }
        user.password = newPassword;
        await user.save();

        res.status(200).json({message: 'Password Changed Succesfully'});

    }
    catch(err){
        res.status(500).json(err.message);
    }
}

exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id)
      .select(USER_PROFILE_SELECT)
      .populate("admin", "name")
      .populate("packages", "name pages")
      .lean();
    // lean() not needed — mongoose doc is fine
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

exports.getUserForAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select(
        "name email mobile isDeclared declaredAt date currentIndex isActive packages admin isComplete softwareUsed notInSequence"
      )
      .populate("admin", "name")
      .populate("packages", "name pages")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(withCompletedPages(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.fetchStats = async (req, res) => {
  try {
    const { id } = req.params;

    
    const user = await User.findById(id)
      .select("name date currentIndex packages admin isDeclared isComplete softwareUsed notInSequence")
      .populate("packages", "name pages")
      .populate("admin", "name")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    
    const goal = getPackagePageLimit(user.packages);

    const completed = getCompletedPages(user);

    const underReview = goal - completed >= 0 ? goal - completed : 0;

    const dashboardData = {
      name: user.name,
      package: user.packages?.name || "N/A",
      goal,
      completed,
      underReview,
      validTill: user.date,
      admin: user.admin?.name || "N/A",
      isDeclared: !!user.isDeclared,
      isComplete: user.isComplete === false ? false : true,
      softwareUsed: !!user.softwareUsed,
      notInSequence: !!user.notInSequence,
    };

    res.status(200).json(dashboardData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
exports.markUserIncomplete = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const u = await User.findByIdAndUpdate(
      id,
      { isComplete: false },
      { new: true }
    ).select("-password");

    if (!u) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ message: "User marked as Incomplete", user: u });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

exports.markUserComplete = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const u = await User.findByIdAndUpdate(
      id,
      { isComplete: true },
      { new: true }
    ).select("-password");

    if (!u) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ message: "User marked as Complete", user: u });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
exports.markSoftwareUsed = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid user id" });

    const u = await User.findByIdAndUpdate(
      id,
      { softwareUsed: true },
      { new: true }
    ).select("-password");

    if (!u) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ message: "Marked as Software Used", user: u });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

exports.unmarkSoftwareUsed = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid user id" });

    const u = await User.findByIdAndUpdate(
      id,
      { softwareUsed: false },
      { new: true }
    ).select("-password");

    if (!u) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ message: "Software Used unmarked", user: u });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

exports.markNotInSequence = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid user id" });

    const u = await User.findByIdAndUpdate(
      id,
      { notInSequence: true },
      { new: true }
    ).select("-password");

    if (!u) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ message: "Marked as Not In Sequence", user: u });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

exports.unmarkNotInSequence = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid user id" });

    const u = await User.findByIdAndUpdate(
      id,
      { notInSequence: false },
      { new: true }
    ).select("-password");

    if (!u) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ message: "Not In Sequence unmarked", user: u });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getExpiringSoonUsers = async(req,res) => {
  try{
    return getPaginatedUsers(req, res, { expiringSoon: true });
  }
  catch(err){
    console.error("Error Fectching Expiring soon users:", err);
    res.status(500).json({success:false,message:"Server Error"})
  }
}

exports.targetsAchieved = async (req, res) => {
  try {
    return getPaginatedUsers(req, res, { targetsAchieved: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.declareResult = async(req,res) => {
  try {
    const { userId } = req.params;
    const declared = typeof req.body.declared === "boolean" ? req.body.declared : true;

    const update = {
      isDeclared: declared,
      declaredAt: declared ? new Date() : null,
    };

    const user = await User.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true,
      select: "isDeclared declaredAt",
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      message: declared ? "Result declared successfully" : "Result hidden successfully",
      isDeclared: user.isDeclared,
      declaredAt: user.declaredAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}
