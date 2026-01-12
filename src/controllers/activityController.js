const client = require("../config/postgres");

class ActivityController {
  async getStatus(req, res) {
    const { sid } = req.params; 
    const { id } = req; 

    try {
      const result = await client.query(
        `SELECT duty, timestamp
         FROM duty_log
         WHERE watchman_id = $1 AND shift_id = $2
         ORDER BY timestamp DESC
         LIMIT 1`,
        [id, sid]
      );

      if (result.rows.length === 0) {
        return res.json({ duty: "Off", message: "No previous duty record found" });
      }

      res.json({
        shift_id: sid,
        duty: result.rows[0].duty,
        timestamp: result.rows[0].timestamp,
      });
    } catch (err) {
      console.error("❌ Error fetching duty status:", err);
      res.status(500).json({ message: "Error fetching duty status" });
    }
  }

  async setDuty(req, res) {
    const sid = parseInt(req.params.sid, 10);
    const { id } = req;
    const { duty } = req.body;

    const validStatuses = ["ON", "OFF", "on BREAK"];
    if (!validStatuses.includes(duty)) {
      return res.status(400).json({
        message: "Invalid duty status. Must be one of: ON, OFF, on BREAK",
      });
    }

    try {
      const last = await client.query(
        `SELECT duty FROM duty_log
         WHERE watchman_id = $1 AND shift_id = $2
         ORDER BY timestamp DESC
         LIMIT 1`,
        [id, sid]
      );

      if (last.rows[0]?.duty === duty) {
        return res.status(400).json({
          message: `Already ${duty}`,
        });
      }

      await client.query(
        `INSERT INTO duty_log (watchman_id, shift_id, duty)
         VALUES ($1, $2, $3)`,
        [id, sid, duty]
      );

      res.json({
        message: `Duty status set to ${duty}`,
        shift_id: sid,
        duty,
      });
    } catch (err) {
      console.error("❌ Error setting duty status:", err);
      res.status(500).json({ message: "Error setting duty status" });
    }
  }
}

module.exports = new ActivityController();
