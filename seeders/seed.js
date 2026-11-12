const bcrypt = require("bcryptjs");
const db = require("../database/db");

async function seed() {
  try {
    const hashedPassword = await bcrypt.hash("admin123", 10);

    db.prepare(
      `
      INSERT OR IGNORE INTO users (username, password)
      VALUES (?, ?)
    `,
    ).run("adminvf", hashedPassword);

    const entities = [
      ["Kantor Layanan Melati", "Instansi", "B2G", "Bandung"],
      ["Toko Sinar Jaya", "Perusahaan", "B2B", "Jakarta"],
      ["Mabel Solusi Mandiri", "Perusahaan", "B2B", "Bandung"],
      ["Sejahtera Rakyat", "Instansi", "B2G", "Surabaya"],
    ];

    const insertEntity = db.prepare(`
      INSERT OR IGNORE INTO entities (name, type, segment, region)
      VALUES (?, ?, ?, ?)
    `);

    const insertActivities = db.prepare(`
      INSERT INTO activities (entity_id, visit_date, status)
      VALUES (?, ?, ?)
    `);

    const getEntityId = db.prepare(`
      SELECT id
      FROM entities
      WHERE name = ? AND type = ? AND segment = ? AND region = ?
    `);

    const seedTransaction = db.transaction(() => {
      for (const entity of entities) {
        insertEntity.run(...entity);
      }

      const activityCount = db
        .prepare(
          `
        SELECT COUNT(*) AS total FROM activities
      `,
        )
        .get().total;

      if (activityCount === 0) {
        const activities = [
          [
            "Kantor Layanan Melati",
            "Instansi",
            "B2G",
            "Bandung",
            "2026-11-10",
            "VISITED",
          ],
          [
            "Toko Sinar Jaya",
            "Perusahaan",
            "B2B",
            "Jakarta",
            "2026-11-15",
            "NOT_VISITED",
          ],
          [
            "Mabel Solusi Mandiri",
            "Perusahaan",
            "B2B",
            "Bandung",
            "2026-11-18",
            "NOT_VISITED",
          ],
          [
            "Sejahtera Rakyat",
            "Instansi",
            "B2G",
            "Surabaya",
            "2026-11-20",
            "VISITED",
          ],
        ];

        for (const activity of activities) {
          const [name, type, segment, region, visitDate, status] = activity;

          const entity = getEntityId.get(name, type, segment, region);

          insertActivities.run(entity.id, visitDate, status);
        }
      }
    });

    seedTransaction();

    console.log("Seed data inserted successfully");
    console.log("Demo account:");
    console.log("Username: adminvf");
    console.log("Password: admin123");
  } catch (error) {
    console.error("Failed to seed database:", error);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

seed();
