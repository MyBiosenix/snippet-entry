const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    role:{
        type: String,
        enum: ['superadmin','admin'],
        default: 'admin'
    },
    date:{
        type: Date,
        default: Date.now()
    }
})

module.exports = mongoose.model('Admin',AdminSchema);