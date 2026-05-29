const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
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

const SUBADMIN_USER_SELECT =
  "name email mobile paymentoptions price isActive isDraft date currentIndex admin packages isComplete isDeclared declaredAt softwareUsed notInSequence";

function buildUserSort(sortBy = "date", sortOrder = "desc") {
  const direction = sortOrder === "asc" ? 1 : -1;

  switch (sortBy) {
    case "name":
      return { name: direction, _id: 1 };
    case "email":
      return { email: direction, _id: 1 };
    case "package":
      return { "packages.name": direction, name: 1, _id: 1 };
    case "completedPages":
      return { completedPages: direction, _id: 1 };
    case "isActive":
      return { isActive: direction, name: 1, _id: 1 };
    default:
      return { date: direction, _id: 1 };
  }
}

async function getPaginatedSubAdminUsers(req, res, options = {}) {
  const adminId = req.admin._id;
  const {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
    search,
  } = parsePaginationQuery(req.query, {
    defaultLimit: 10,
    defaultSortBy: "date",
    defaultSortOrder: "desc",
    allowedSortFields: ["date", "name", "email", "package", "completedPages", "isActive"],
  });

  const baseMatch = {
    admin: adminId,
  };

  if (typeof options.isActive === "boolean") {
    baseMatch.isActive = options.isActive;
  }

  const regex = search ? new RegExp(escapeRegex(search), "i") : null;

  const pipeline = [
    { $match: baseMatch },
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
        packageData: { $arrayElemAt: ["$packageData", 0] },
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
        packages: {
          _id: "$packageData._id",
          name: "$packageData.name",
          pages: "$packageData.pages",
        },
      },
    },
  ];

  if (regex) {
    pipeline.push({
      $match: {
        $or: [
          { name: regex },
          { email: regex },
          { "packageData.name": regex },
        ],
      },
    });
  }

  const countPipeline = [...pipeline, { $count: "total" }];
  const dataPipeline = [
    ...pipeline,
    { $project: { password: 0, lastLoginSession: 0, myerrors: 0, packageData: 0 } },
    { $sort: buildUserSort(sortBy, sortOrder) },
    { $skip: skip },
    { $limit: limit },
  ];

  const [users, countResult] = await Promise.all([
    User.aggregate(dataPipeline),
    User.aggregate(countPipeline),
  ]);

  return res.status(200).json(
    buildPaginatedResponse(users, page, limit, countResult[0]?.total || 0)
  );
}

exports.login = async(req,res) => {
    try{
        const {email, password} = req.body;
        const admin = await Admin.findOne({email});

        if(!admin){
            return res.status(400).json({message:'Admin Does Not Exist'});
        }
        if(password !== admin.password){
            return res.status(500).json({message:'Invalid Passwords'});
        }

        const token = jwt.sign(
            {id:admin._id, role:admin.role},
            env.jwtSecret,
            {expiresIn: env.subAdminJwtExpiresIn}
        )

        res.status(200).json({
            message:'Login Succesful',
            token,
            expiresIn: env.subAdminJwtExpiresIn,
            subadmin:{
                id:admin._id,
                name:admin.name,
                role:admin.role,
                email:admin.email
            }
        })
    }
    catch(err){
        console.error(err.message);
        res.status(500).json({ message: 'server error'});
    }
}

exports.getDashStats = async (req, res) => {
  try {
    const adminId = req.admin._id;

    /* ---------- BASIC COUNTS ---------- */
    const totalUsers = await User.countDocuments({ admin: adminId });

    const activeUsers = await User.countDocuments({
      admin: adminId,
      isActive: true
    });

    const inactiveUsers = await User.countDocuments({
      admin: adminId,
      isActive: false
    });

    /* ---------- EXPIRING SOON USERS (NEXT 4 DAYS) ---------- */
    const today = new Date();
    const next4Days = new Date();
    next4Days.setDate(today.getDate() + 4);

    const expiringSoonCount = await User.countDocuments({
      admin: adminId,
      date: {
        $gte: today,
        $lte: next4Days
      }
    });

    /* ---------- TARGETS ACHIEVED USERS ---------- */
    const targetCountResult = await User.aggregate([
      { $match: { admin: adminId } },
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
          packageData: { $arrayElemAt: ["$packageData", 0] },
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
        },
      },
      {
        $match: {
          $expr: {
            $gte: [
              "$completedPages",
              { $multiply: [{ $ifNull: ["$packageData.pages", 0] }, 0.75] },
            ],
          },
        },
      },
      { $count: "total" },
    ]);

    /* ---------- RESPONSE ---------- */
    res.status(200).json({
    success: true,
    totalUsers,
    activeUsers,
    inactiveUsers,
    expiringSoonCount,
    targetsAchievedCount: targetCountResult[0]?.total || 0,
    });


  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


exports.getMyUsers = async(req,res) => {
    try{
        return getPaginatedSubAdminUsers(req, res);
    }
    catch(err){
        res.status(500).json({message: err.message});
    }
};

exports.getActiveUsers = async(req,res) => {
    try{
        return getPaginatedSubAdminUsers(req, res, { isActive: true });
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
}

exports.getInActiveUsers = async(req,res) => {
    try{
        return getPaginatedSubAdminUsers(req, res, { isActive: false });
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
}
