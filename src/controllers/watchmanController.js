const client = require("../config/postgres");

class watchmanController {
  async up(req, res) {
    try {
      const { username, name, country_code, phone_number } = req.body;
      const { id, role } = req;

      if (!id) {
        return res.status(400).json({ error: "Watchman ID is required" });
      }

      const query = `
        UPDATE watchman
        SET
          username = COALESCE($1, username),
          name = COALESCE($2, name),
          country_code = COALESCE($3, country_code),
          phone_number = COALESCE($4, phone_number)
        WHERE id = $5
        RETURNING *;
      `;

      const values = [username, name, country_code, phone_number, id];

      const result = await client.query(query, values);

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Watchman not found" });
      }

      res.status(200).json({
        message: "Profile updated successfully",
        watchman: result.rows[0],
      });
    } catch (e) {
      console.error("Error updating profile:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async gets(req, res) {
    try {
      const wid = req.id;

      const result = await client.query(
        `SELECT s.*
         FROM watchman_shift ws
         JOIN shift s ON s.id = ws.shift_id
         WHERE ws.watchman_id = $1
         ORDER BY s.id`,
        [wid]
      );

      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error listing watchman_shift:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async getb(req, res) {
    try {
      const wid = req.id;

      const result = await client.query(
        `SELECT DISTINCT b.id, b.name
         FROM building b
         JOIN building_shift bs ON bs.building_id = b.id
         JOIN watchman_shift ws ON ws.shift_id = bs.shift_id
         WHERE ws.watchman_id = $1
         ORDER BY b.id;`,
        [wid]
      );

      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error listing watchman_shift:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async geta(req, res) {
    try {
      const wid = req.id;

      const result = await client.query(
        `SELECT DISTINCT b.area
         FROM building b
         JOIN building_shift bs ON bs.building_id = b.id
         JOIN watchman_shift ws ON ws.shift_id = bs.shift_id
         WHERE ws.watchman_id = $1;`,
        [wid]
      );

      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error listing watchman_shift:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async scan(req, res) {
    try {
      const { qr_code, sid, lat, lng } = req.body;
      const wid = req.id;
      const fetchQuery = `
          SELECT 
              qc.id AS qr_id,
              qc.qr_details_id,
              qc.location,
              qd.shift_id,
              qd.serial,
              ST_Distance(
                  qc.location, 
                  ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography
              ) as distance_meters
          FROM qr_code qc
          JOIN qr_details qd ON qc.qr_details_id = qd.id
          WHERE qc.code = $1
      `;

      const targetResult = await client.query(fetchQuery, [qr_code, lng, lat]);
      const target = targetResult.rows[0];

      if (!target) {
        return res.status(404).json({ message: "Invalid QR Code" });
      }

      if (target.shift_id !== parseInt(sid)) {
        return res
          .status(403)
          .json({ message: "QR code does not belong to this shift" });
      }

      if (target.distance_meters > 500) {
        return res.status(400).json({
          message: "You are too far from the checkpoint",
          distance: Math.round(target.distance_meters) + "m",
        });
      }

      const logQuery = `
          SELECT qr_code_id 
          FROM qr_scan_log 
          WHERE watchman_id = $1 
            AND sid = $2 
            AND scanned_at::date = NOW()::date
            AND qr_code_id IN (
                SELECT id FROM qr_code WHERE qr_details_id = $3
            )
      `;
      const logResult = await client.query(logQuery, [
        wid,
        sid,
        target.qr_details_id,
      ]);
      const scannedIds = logResult.rows.map((r) => r.qr_code_id);

      // if (scannedIds.includes(target.qr_id)) {
      //   return res
      //     .status(400)
      //     .json({ message: "QR code already scanned today" });
      // }

      if (target.serial) {
        const allQrsResult = await client.query(
          `SELECT id FROM qr_code WHERE qr_details_id = $1 ORDER BY id ASC`,
          [target.qr_details_id]
        );

        const allQrIds = allQrsResult.rows.map((r) => r.id);

        const nextExpectedId = allQrIds.find((id) => !scannedIds.includes(id));        

        if (target.qr_id !== nextExpectedId) {
          return res
            .status(400)
            .json({
              message:
                "Invalid sequence. Please scan the previous QR codes first.",
            });
        }
      }

      const insertQuery = `
                INSERT INTO qr_scan_log (qr_code_id, watchman_id, sid, location) 
                VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326))
            `;
      await client.query(insertQuery, [target.qr_id, wid, sid, lng, lat]);

      res.status(201).json({ message: "QR code scanned successfully" });
    } catch (error) {
      console.error("Error in scan:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

module.exports = new watchmanController();
