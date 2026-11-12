const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../database/db");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: "Username and password are required.",
    });
  }

  try {
    const user = db
      .prepare(
        `
        SELECT id, username, password
        FROM users
        WHERE username = ?
      `,
      )
      .get(username);

    if (!user) {
      return res.status(401).json({
        message: "Invalid username or password.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid username or password.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({
      message: "Login successful.",
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
});

router.get("/me", (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.json({
      user: null,
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return res.json({
      user: {
        id: decoded.id,
        username: decoded.username,
      },
    });
  } catch (error) {
    return res.json({
      user: null,
    });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return res.json({
    message: "Logout successful.",
  });
});

module.exports = router;
