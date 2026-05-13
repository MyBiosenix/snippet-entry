const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

const startServer = async () => {
    await connectDB();

    app.listen(env.port,'0.0.0.0',() => {
        console.log(`Server running on PORT:${env.port}`)
    });
};

startServer().catch((err) => {
    console.error("Application startup failed");
    console.error(err.message);
    process.exit(1);
});
