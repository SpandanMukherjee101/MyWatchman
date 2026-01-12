const client = require("../config/postgres");

class WatchmanUtilsController {
  async add(req, res) {
    try {
      const wid = req.watchmanId;
      const { sid } = req.body;

      if (!sid) {
        return res.status(400).json({ message: "shift_id (sid) is required" });
      }

      const result = await client.query(
        `INSERT INTO watchman_shift (watchman_id, shift_id)
         VALUES ($1, $2)
         RETURNING *`,
        [wid, sid]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({ message: "Shift already assigned to this watchman" });
      }
      console.error("Error adding watchman_shift:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async list(req, res) {
    try {
      const wid = req.watchmanId;

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

  async del(req, res) {
    try {
      const wid = req.watchmanId;
      const { sid } = req.body;

      if (!sid) {
        return res.status(400).json({ message: "shift_id (sid) is required in body" });
      }

      const result = await client.query(
        `DELETE FROM watchman_shift
         WHERE watchman_id = $1 AND shift_id = $2
         RETURNING *`,
        [wid, sid]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Record not found" });
      }

      res.status(200).json({ message: "Deleted successfully" });
    } catch (error) {
      console.error("Error deleting watchman_shift:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new WatchmanUtilsController();