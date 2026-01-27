const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
    name:{
        type:String,
        required: true,
        unique: true
    },
    price:{
        type:Number,
        required: true
    },
    pages:{
        type:Number,
        required:true
    }
})

module.exports = mongoose.model("Packages",packageSchema);