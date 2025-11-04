require('dotenv').config();
const Admin = require('./models/Admin');
const connectDB = require('./config/db');

const CreateSuperAdmin = async(req,res) => {
    try{
        await connectDB();
        console.log('Mongodb Connected');
        
        const superadmindata = {
            name:'Rahul',
            email:'snippet@entry.com',
            password:'123456',
            role: 'superadmin'
        };

        const existingadmin = await Admin.findOne({ email: superadmindata.email});
        if(existingadmin){
            console.log('Super Admin already Exists');
        }
        else{
            await Admin.create(superadmindata);
            console.log('Super Admin Created Succesfully');
        }
    }
    catch(err){
        console.error(err.message);
    }
}

CreateSuperAdmin();