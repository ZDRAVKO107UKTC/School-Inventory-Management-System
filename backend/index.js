// index.js

const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes');

// Middleware
app.use(express.json());

// Начална страница (поставяме я тук, за да се зарежда веднага)
app.get('/', (req, res) => {
    res.send('<h1>Сървърът е готов</h1>');
});

// Routes
// Променяме от '/' на '/api', за да станат маршрутите /api/auth/...
app.use('/api', authRoutes); 

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});