const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');

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
            process.env.JWT_SECRET,
            {expiresIn:'1h'}
        )

        res.status(200).json({
            message:'Login Succesful',
            token,
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

    const expiringSoonUsers = await User.find({
      admin: adminId,
      date: {
        $gte: today,
        $lte: next4Days
      }
    }).populate("packages");

    const expiringSoonCount = expiringSoonUsers.length;

    /* ---------- TARGETS ACHIEVED USERS ---------- */
    const users = await User.find({ admin: adminId })
      .populate("packages")
      .lean();

    const targetsAchievedUsers = users.filter(user => {
      if (!user.packages) return false;

      const packageName = user.packages.name?.toLowerCase();
      const currentIndex = user.currentIndex || 0;

      if (packageName === "gold" && currentIndex >= 75) return true;
      if (["vip", "diamond"].includes(packageName) && currentIndex >= 150) return true;

      return false;
    });

    /* ---------- RESPONSE ---------- */
    res.status(200).json({
    success: true,
    totalUsers,
    activeUsers,
    inactiveUsers,
    expiringSoonCount,
    targetsAchievedCount: targetsAchievedUsers.length,
    expiringSoonUsers,
    targetsAchievedUsers
    });


  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


exports.getMyUsers = async(req,res) => {
    try{
        const adminId = req.admin._id;

        const users = await User.find({admin:adminId})
        .populate('packages','name')
        .select('-__v');
        
        res.status(200).json(users);
    }
    catch(err){
        res.status(500).json({message: err.message});
    }
};

exports.getActiveUsers = async(req,res) => {
    try{
        const adminId = req.admin._id;

        const activeUsers = await User.find({admin:adminId, isActive:true})
        .select('-__v');
        res.status(200).json(activeUsers);
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
}

exports.getInActiveUsers = async(req,res) => {
    try{
        const adminId = req.admin._id;

        const InactiveUsers = await User.find({admin:adminId, isActive:false})
        .select('-__v');
        res.status(200).json(InactiveUsers);
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
}