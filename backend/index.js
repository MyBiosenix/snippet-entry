require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const userAuthRoutes = require('./routes/userAuthRoutes');
const packageRoutes = require('./routes/packageRoutes');
const snippetRoutes = require('./routes/snipetRoutes');
const subadminRoutes = require('./routes/subadminRoutes');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT;
app.use('/api/admin', adminAuthRoutes);
app.use('/api/auth',userAuthRoutes);
app.use('/api/package',packageRoutes);
app.use('/api/snippet',snippetRoutes);
app.use('/api/sub-admin',subadminRoutes);

connectDB();
app.listen(PORT,'0.0.0.0',() => {
    console.log(`Server running on PORT:${PORT}`)
})