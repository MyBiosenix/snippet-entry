const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');

exports.login = async(req, res) =>{
    try{
        const {email, password} = req.body;
        
        const admin = await Admin.findOne({email});
        if(!admin){
            return res.status(400).json({message: 'Admin does not Exist'});
        }
        if(password !== admin.password){
            return res.status(400).json({message: 'Incorrect Password'});
        }
        const token = jwt.sign(
            { id: admin._id, role: admin.role},
            process.env.JWT_SECRET,
            {expiresIn: '1h'}
        );

        res.status(200).json({
            message: 'Login Succesful',
            token,
            admin:{
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

    }

    catch(err){
        console.error(err.message);
        res.status(500).json({ message: 'server error'});
    }
};

exports.createAdmin = async(req, res) => {
    try{
        const {name, email, password, role} = req.body;
        const existingAdmin = await Admin.findOne({ email });
        
        if(existingAdmin){
            return res.status(400).json({message: 'Admin Already Exists'});
        }
        const newAdmin = await Admin.create({
            name,
            email,
            role,
            password
        });
        res.status(200).json({ message: 'Admin Created Succesfully', admin:{
            _id : newAdmin.id,
            name : newAdmin.name,
            role : newAdmin.role,
        }}
    )

    }
    catch(err){
        res.status(500).json({ message: err.message });
    }
}

exports.getAdmin = async(req,res) => {
    try{
        const admins = await Admin.find().select('-__v');
        res.status(200).json(admins);
    }
    catch(err){
        res.status(500).json({message: err.message});
    }
}

exports.getAdminName = async(req,res) => {
    try{
        const adminName = await Admin.find().select('name');
        res.status(200).json(adminName);
    }
    catch(err){
        res.status(500).json({message: err.message});
    }
}

exports.deleteAdmin = async(req,res) => {
    try{
        const {id} = req.params;
        await Admin.findByIdAndDelete(id);
        res.status(200).json({ message: 'Admin Deleted Succesfully '});
    }
    catch(err){
        res.status(400).json(err.message);
    }
}

exports.editAdmin = async(req,res) => {
    try{
        const {id} = req.params;
        const { name, email, password, role } = req.body;

        const admin = await Admin.findById(id);
        if(!admin){
            return res.status(500).json({message: 'Admin does not exist'});
        }
        admin.name = name;
        admin.email = email;
        admin.password = password;
        admin.role = role;

        await admin.save();
        res.status(200).json({ message: 'Admin Updated Succesfully'});
    }
    catch(err){
        res.status(400).json(err.message);
    }
}

exports.changePassword = async(req,res) => {
    try{
        const {id} = req.params;
        const {password, newPassword} = req.body;

        const admin = await Admin.findById(id);
        if(!admin){
            return res.status(400).json({message: 'Admin does not exists'});
        }

        if(admin.password !== password){
            return res.status(400).json({message: 'Invalid Password'});
        }

        admin.password = newPassword;
        await admin.save();

        res.status(200).json({message: 'Password Updated Succesfully'});
    }
    catch(err){
        res.status(500).json(err.message);
    }
}

exports.getAdminStats = async(req,res) => {
    try{
        const totalAdmins = await Admin.countDocuments();
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({isActive: true});
        const InactiveUsers = await User.countDocuments({isActive: false});

        res.status(200).json({
            totalAdmins,
            totalUsers,
            activeUsers,
            InactiveUsers
        });
    }
    catch(err){
        res.status(500).json(err.message);
    }
}