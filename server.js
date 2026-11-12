require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

require("./database/db");

const entityRoutes = require("./routes/entityRoutes");
const activityRoutes = require("./routes/activityRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

const authMiddleware = require("./middleware/authMiddleware");

app.use("/api/auth", authRoutes);
app.use("/api/activities", authMiddleware, activityRoutes);
app.use("/api/entities", authMiddleware, entityRoutes);

const port = 3000;

app.listen(port, () => {
  console.log(`Visit flow listening on port ${port}`);
});
