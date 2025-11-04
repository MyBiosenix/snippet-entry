const User = require('../models/User');

exports.checkActiveUser = async (req,res,next) => {
    try{
        const userId = req.user.id;
        const user = await User.findById(userId);

        if(!user){
            return res.status(404).json({message: 'User Not Found'});
        }

        if(!user.isActive){
            return res.status(403).json({message: 'Your Account has been deactivated. Contact Admin'});
        }
        next();
    }
    catch(err){
        return res.status(500).json({message:'Server Error'});
    }
};