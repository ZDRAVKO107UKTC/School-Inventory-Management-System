const express = require("express");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const equipmentRoutes = require("./routes/equipmentRoutes");
const requestRoutes = require("./routes/requestRoutes");
const errorHandler = require("./middleware/errorHandler");


const app = express();

app.use(express.json());
app.use(cookieParser());

// Настройка на глобални префикси за всички маршрути
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/admin", adminRoutes);
app.use("/equipment", equipmentRoutes);
app.use("/request", requestRoutes);


app.use(errorHandler);

module.exports = app;