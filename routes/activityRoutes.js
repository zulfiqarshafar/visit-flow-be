const express = require("express");
const db = require("../database/db");

const router = express.Router();

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

// GET /api/activities
router.get("/", (req, res) => {
  try {
    const { segment, status, from, to, search } = req.query;

    // Validate segment
    if (segment && !["B2G", "B2B"].includes(segment)) {
      return res.status(400).json({
        message: "Segment must be either B2G or B2B",
      });
    }

    // Validate status
    if (status && !["VISITED", "NOT_VISITED"].includes(status)) {
      return res.status(400).json({
        message: "Status must be VISITED or NOT_VISITED",
      });
    }

    // Validate dates
    if (from && !isValidDate(from)) {
      return res.status(400).json({
        message: "Invalid start date. Use YYYY-MM-DD format.",
      });
    }

    if (to && !isValidDate(to)) {
      return res.status(400).json({
        message: "Invalid end date. Use YYYY-MM-DD format.",
      });
    }

    if (from && to && from > to) {
      return res.status(400).json({
        message: "Start date cannot be later than end date.",
      });
    }

    // Base query
    let query = `
      SELECT
        a.id,
        e.id AS entity_id,
        e.name AS entity_name,
        e.type AS entity_type,
        e.segment,
        e.region,
        a.visit_date,
        a.status,
        a.created_at
      FROM activities a
      INNER JOIN entities e ON e.id = a.entity_id
      WHERE 1 = 1
    `;

    const params = [];

    // Apply segment filter
    if (segment) {
      query += ` AND e.segment = ?`;
      params.push(segment);
    }

    // Apply status filter
    if (status) {
      query += ` AND a.status = ?`;
      params.push(status);
    }

    // Apply start date filter (inclusive)
    if (from) {
      query += ` AND a.visit_date >= ?`;
      params.push(from);
    }

    // Apply end date filter (inclusive)
    if (to) {
      query += ` AND a.visit_date <= ?`;
      params.push(to);
    }

    // Apply entity name search
    if (search) {
      query += ` AND e.name LIKE ?`;
      params.push(`%${search.trim()}%`);
    }

    query += ` ORDER BY a.visit_date ASC, a.id DESC`;

    const activities = db.prepare(query).all(...params);

    return res.json(activities);
  } catch (error) {
    console.error("Get activities error:", error);

    return res.status(500).json({
      message: "Failed to retrieve activities",
    });
  }
});

const insertActivity = db.prepare(`
  INSERT INTO activities (entity_id, visit_date)
  VALUES (?, ?)
`);

// POST /api/activities
router.post("/", (req, res) => {
  try {
    const { entityId, segment, visitDate } = req.body;

    // Validate entityId
    if (!Number.isInteger(entityId) || entityId <= 0) {
      return res.status(400).json({
        message: "A valid entityId is required",
      });
    }

    // Validate segment
    if (!["B2G", "B2B"].includes(segment)) {
      return res.status(400).json({
        message: "Segment must be either B2G or B2B",
      });
    }

    // Validate visit date
    if (!visitDate || !isValidDate(visitDate)) {
      return res.status(400).json({
        message: "A valid visitDate is required. Use YYYY-MM-DD format.",
      });
    }

    // Check whether entity exists
    const entity = db
      .prepare(
        `
      SELECT id, name, type, segment, region
      FROM entities
      WHERE id = ?
    `,
      )
      .get(entityId);

    if (!entity) {
      return res.status(404).json({
        message: "Entity not found",
      });
    }

    // Ensure segment matches the selected entity
    if (entity.segment !== segment) {
      return res.status(400).json({
        message: "Selected segment does not match the entity segment",
      });
    }

    // Insert activity
    const result = insertActivity.run(entityId, visitDate);

    // Retrieve created activity
    const activity = db
      .prepare(
        `
      SELECT
        a.id,
        e.id AS entity_id,
        e.name AS entity_name,
        e.type AS entity_type,
        e.segment,
        e.region,
        a.visit_date,
        a.status,
        a.created_at
      FROM activities a
      INNER JOIN entities e ON e.id = a.entity_id
      WHERE a.id = ?
    `,
      )
      .get(result.lastInsertRowid);

    return res.status(201).json(activity);
  } catch (error) {
    console.error("Create activity error:", error);

    return res.status(500).json({
      message: "Failed to create visit plan",
    });
  }
});

const updateActivity = db.prepare(`
  UPDATE activities
  SET status = ?
  WHERE id = ?
`);

// PATCH /api/activities/:id
router.patch("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate activity ID
    const activityId = Number(id);

    if (!Number.isInteger(activityId) || activityId <= 0) {
      return res.status(400).json({
        message: "Invalid activity ID",
      });
    }

    // Validate status
    if (!["VISITED", "NOT_VISITED"].includes(status)) {
      return res.status(400).json({
        message: "Status must be VISITED or NOT_VISITED",
      });
    }

    const existingActivity = db
      .prepare(
        `
      SELECT id
      FROM activities
      WHERE id = ?
    `,
      )
      .get(activityId);

    if (!existingActivity) {
      return res.status(404).json({
        message: "Activity not found",
      });
    }

    // Update activity status
    updateActivity.run(status, activityId);

    // Retrieve updated activity
    const activity = db
      .prepare(
        `
      SELECT
        a.id,
        e.id AS entity_id,
        e.name AS entity_name,
        e.type AS entity_type,
        e.segment,
        e.region,
        a.visit_date,
        a.status,
        a.created_at
      FROM activities a
      INNER JOIN entities e ON e.id = a.entity_id
      WHERE a.id = ?
    `,
      )
      .get(activityId);

    return res.json(activity);
  } catch (error) {
    console.error("Update activity error:", error);

    return res.status(500).json({
      message: "Failed to update activity status",
    });
  }
});

module.exports = router;
