const User = require('../models/User');
const Snippet = require('../models/Snippet');
const Packages = require('../models/Package');
const jwt = require('jsonwebtoken');

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

    const token = jwt.sign({ id: myuser._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    myuser.lastLoginSession = token;
    await myuser.save();

    res.status(200).json({
      message: 'Login Successful',
      token,
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
    const password = getRandomPassword();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already Exists" });
    }

    const allSnippets = await Snippet.find({}, "_id");

    const shuffled = allSnippets
      .map(s => s._id)
      .sort(() => Math.random() - 0.5);

    const newUser = await User.create({
      name,
      email,
      mobile,
      admin,
      packages,
      price,
      paymentoptions,
      date,
      password: password,
      snippetOrder: shuffled,
      currentIndex: 0
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
        date: newUser.date,
        password: newUser.password
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getUsers = async(req,res) => {
    try{
        const allUsers = await User.find()
        .populate('admin','name')
        .populate('packages','name')
        .select('-__V');
        res.status(200).json(allUsers);
    }
    catch(err){
        res.status(200).json(err.message);
    }
}
function getRandomPassword(length = 7){
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&!()';
    let password = '';
    for(let i = 0; i<= length; i++){
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
        const activeusers = await User.find({isActive:true})
        res.status(200).json(activeusers);
    }
    catch(err){
        res.status(400).json(err.message);
    }
}
exports.getInActiveUsers = async(req,res) => {
    try{
        const inactiveusers = await User.find({isActive:false});
        res.status(200).json(inactiveusers);
    }
    catch(err){
        res.status(400).json(err.message);
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

exports.editUser = async(req,res) => {
    try{
        const {id} = req.params;
        const {name, email,mobile,admin,packages,price,paymentoptions,date} = req.body;

        const user = await User.findById(id);
        if(!user){
            return res.status(400).json({ message: 'User does not Exist'});
        }
        user.name = name;
        user.email = email;
        user.mobile = mobile;
        user.admin = admin;
        user.packages = packages;
        user.price = price;
        user.paymentoptions = paymentoptions;
        user.date = date;

        await user.save();
        res.status(200).json({message:'User Updated Succesfully'});
    }
    catch(err){
        res.status(400).json(err.message);
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

exports.getUser = async(req,res) => {
    try{
        const {id} = req.params;
        const user = await User.findById(id)
            .populate('admin','name')
            .populate('packages','name');
        res.status(200).json(user);
    }
    catch(err){
        res.status(500).json(err.message);
    }
}

exports.fetchStats = async(req,res) => {
    try{
        const {id} = req.params;
        const user = await User.findById(id)
            .populate("packages","name")
            .populate("admin","name");
        
        if(!user){
            return res.status(404).json({ message:'User Not Found'})
        }

        let goal = 0;
        const packageName = user.packages?.name?.toLowerCase();
        
        if(packageName === 'gold') goal = 100;
        else if(packageName === 'vip') goal = 200;
        else if(packageName === 'diamond') goal = 200;

        const completed = user.myerrors?.length || 0;

        const underReview = goal - completed >=0 ? goal - completed : 0;
        
        const dashboardData = {
            name: user.name,
            package: user.packages?.name || "N/A",
            goal,
            completed,
            underReview,
            validTill: user.date,
            admin: user.admin?.name || "N/A",
        };
        res.status(200).json(dashboardData);
        } 
        catch (err) {
            console.error(err);
            res.status(500).json({ message: err.message });
        }
};
exports.getExpiringSoonUsers = async(req,res) => {
  try{
    const today = new Date();
    const next4Days = new Date();
    next4Days.setDate(today.getDate() + 4);

    const expiringSoonUsers = await User.find({
      date:{
        $gte:today,
        $lte:next4Days
      }
    }).populate("packages admin");

    const expiringSoonCount = await User.countDocuments({
      date:{
        $gte:today,
        $lte:next4Days
      }
    });

    res.status(200).json({
      success:true,
      totalExpiringSoon:expiringSoonCount,
      users:expiringSoonUsers
    });

  }
  catch(err){
    console.error("Error Fecthing Expiring soon users:", err);
    res.status(500).json({success:false,message:"Server Error"})
  }
}

exports.targetsAchieved = async (req, res) => {
  try {
    const users = await User.find()
      .populate("packages")
      .lean();

    const accomplishedUsers = users.filter(user => {
      if (!user.packages) return false;

      const packageName = user.packages.name?.toLowerCase();
      const currentIndex = user.currentIndex || 0;

      if (packageName === "gold" && currentIndex >= 75) {
        return true;
      }

      if (["vip", "diamond"].includes(packageName) && currentIndex >= 150) {
        return true;
      }

      return false;
    });

    res.status(200).json({
      success: true,
      count: accomplishedUsers.length,
      users: accomplishedUsers
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
