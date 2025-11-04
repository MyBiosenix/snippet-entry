const mongoose = require('mongoose');

const connectDB = async() => {
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Mongodb Connected");
    }
    catch(err){
        console.error(err.message);
        console.log('Mongodb Connection Failed');
        process.exit(1);
    }
}

module.exports = connectDB;