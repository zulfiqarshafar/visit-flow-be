const express = require("express");
const db = require("../database/db");

const router = express.Router();

// GET /api/entities
router.get("/", (req, res) => {
  try {
    const { segment, search } = req.query;

    // Validate segment
    if (segment && !["B2G", "B2B"].includes(segment)) {
      return res.status(400).json({
        message: "Segment must be either B2G or B2B",
      });
    }

    // Retrieve from entities table
    let query = `
      SELECT
        id,
        name,
        type,
        segment,
        region
      FROM entities
    `;

    const conditions = [];
    const params = [];

    if (segment) {
      conditions.push("segment = ?");
      params.push(segment);
    }

    if (search) {
      conditions.push("name LIKE ?");
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY name ASC`;

    const masterEntities = db.prepare(query).all(...params);

    if (masterEntities.length > 0) {
      return res.json(masterEntities);
    }

    // Fallback for entities from activities table
    let fallbackQuery = `
      SELECT DISTINCT
        e.id,
        e.name,
        e.type,
        e.segment,
        e.region
      FROM activities a
      INNER JOIN entities e ON e.id = a.entity_id
    `;

    const fallbackConditions = [];
    const fallbackParams = [];

    if (segment) {
      fallbackConditions.push("e.segment = ?");
      fallbackParams.push(segment);
    }

    if (search) {
      fallbackConditions.push("e.name LIKE ?");
      fallbackParams.push(`%${search}%`);
    }

    if (fallbackConditions.length > 0) {
      fallbackQuery += ` WHERE ${fallbackConditions.join(" AND ")}`;
    }

    fallbackQuery += ` ORDER BY e.name ASC`;

    const fallbackEntities = db.prepare(fallbackQuery).all(...fallbackParams);

    return res.json(fallbackEntities);
  } catch (error) {
    console.error("Get entities error:", error);

    return res.status(500).json({
      message: "Failed to retrieve entities",
    });
  }
});

module.exports = router;
