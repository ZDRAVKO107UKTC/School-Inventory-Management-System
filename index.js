const express = require('express');
const authRoutes = require('./backend/routes/authRoutes');
const { validateLogin } = require('./backend/middleware/validation');

const app = express();
app.use(express.json()); // Essential for reading JSON bodies

// Apply middleware globally or specifically to the route
app.use('/api/auth', validateLogin, authRoutes);

app.listen(3000, () => console.log("The server is running on port 3000"));