const mongoose = require('mongoose');
const env = require('./env');

function maskMongoUri(uri = "") {
    try {
        return uri.replace(
            /(mongodb(?:\+srv)?:\/\/)([^:\/?#]+)(?::([^@\/?#]*))?@/i,
            (_, prefix) => `${prefix}****:****@`
        );
    } catch {
        return "[invalid mongo uri]";
    }
}

const connectDB = async() => {
    console.log("================================");
    console.log(`APP ENV: ${env.appEnv}`);
    console.log(`DB MODE: ${env.dbMode}`);
    console.log(`PORT: ${env.port}`);
    console.log(`MONGO URI: ${maskMongoUri(env.mongoUri)}`);
    console.log("================================");

    try{
        await mongoose.connect(env.mongoUri);

        const { host, name } = mongoose.connection;

        console.log("MongoDB Connected Successfully");
        console.log(`Connected Host: ${host || "unknown"}`);
        console.log(`Database Name: ${name || "unknown"}`);
    }
    catch(err){
        console.error("MongoDB Connection Failed");
        console.error(`Reason: ${err.message}`);
        process.exit(1);
    }
}

module.exports = connectDB;
