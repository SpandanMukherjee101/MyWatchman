const client = require("../config/postgres");

class shift {
  async add(req, res) {
    try {
      const managerId = req.id;
      const { tag, start_time, end_time } = req.body;

      if (!tag || !start_time || !end_time) {
        return res.status(400).json({ message: "tag, start_time, and end_time are required" });
      }

      const result = await client.query(
        `INSERT INTO shift (manager_id, tag, start_time, end_time)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [managerId, tag, start_time, end_time]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      if (error.code === "23505") {
        res.status(400).json({ message: "Tag must be unique" });
      } else {
        res.status(500).json({ message: "Error creating shift" });
      }
    }
  }

  async list(req, res) {
    try {
      const managerId = req.id;

      const result = await client.query(
        `SELECT * FROM shift WHERE manager_id = $1 ORDER BY id`,
        [managerId]
      );

      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching shifts" });
    }
  }

  async get(req, res) {
    try {
      const managerId = req.id;
      const { id } = req.params;

      const result = await client.query(
        `SELECT * FROM shift WHERE id = $1 AND manager_id = $2`,
        [id, managerId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Shift not found or unauthorized" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching shift" });
    }
  }

  async up(req, res) {
    try {
      const managerId = req.id;
      const { id } = req.params;
      const { tag, start_time, end_time } = req.body;

      if (!tag || !start_time || !end_time) {
        return res.status(400).json({ message: "tag, start_time, and end_time are required" });
      }

      const check = await client.query(
        `SELECT * FROM shift WHERE id = $1 AND manager_id = $2`,
        [id, managerId]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ message: "Not authorized to update this shift" });
      }

      const result = await client.query(
        `UPDATE shift
         SET tag = $1, start_time = $2, end_time = $3
         WHERE id = $4
         RETURNING *`,
        [tag, start_time, end_time, id]
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      if (error.code === "23505") {
        res.status(400).json({ message: "Tag must be unique" });
      } else {
        res.status(500).json({ message: "Error updating shift" });
      }
    }
  }

  async del(req, res) {
    try {
      const managerId = req.id;
      const { id } = req.params;

      const check = await client.query(
        `SELECT * FROM shift WHERE id = $1 AND manager_id = $2`,
        [id, managerId]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ message: "Not authorized to delete this shift" });
      }

      await client.query(`DELETE FROM shift WHERE id = $1`, [id]);

      res.json({ message: "Shift deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error deleting shift" });
    }
  }

  async getByBuilding(req, res) {
    try {
      const managerId = req.id;
      const { id } = req.params;
      const result = await client.query(
        'SELECT building_id from building_shift WHERE shift_id = $1',
        [id]
      );
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching building shifts" });
    }
  }
}

module.exports= new shift()