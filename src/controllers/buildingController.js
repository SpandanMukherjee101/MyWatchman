const client = require("../config/postgres");

class BuildingController {
  async add(req, res) {
    try {
      const { name, area } = req.body;
      const managerId = req.id;

      if (!name) {
        return res.status(400).json({ message: "Building name is required" });
      }

      const result = await client.query(
        `INSERT INTO building (name, area, mid)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [name, area, managerId]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error creating building" });
    }
  }

  async list(req, res) {
    try {
      const managerId = req.id;

      const result = await client.query(
        `SELECT * FROM building WHERE mid = $1`,
        [managerId]
      );

      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching buildings" });
    }
  }

  async get(req, res) {
    try {
      const managerId = req.id;
      const { id } = req.params;

      const result = await client.query(
        `SELECT * FROM building WHERE id = $1 AND mid = $2`,
        [id, managerId]
      );

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Building not found or unauthorized" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching building" });
    }
  }

  async up(req, res) {
    try {
      const managerId = req.id;
      const { id } = req.params;
      const { name, area } = req.body;

      const result = await client.query(
        `UPDATE building
         SET 
           name = COALESCE($1, name),
           area = COALESCE($2, area)
         WHERE id = $3 AND mid = $4
         RETURNING *`,
        [name, area, id, managerId]
      );

      if (result.rows.length === 0) {
        return res
          .status(403)
          .json({ message: "Not authorized or building not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error updating building" });
    }
  }

  async del(req, res) {
    try {
      const managerId = req.id;
      const { id } = req.params;

      const result = await client.query(
        `DELETE FROM building WHERE id = $1 AND mid = $2 RETURNING *`,
        [id, managerId]
      );

      if (result.rows.length === 0) {
        return res
          .status(403)
          .json({ message: "Not authorized or building not found" });
      }

      res.json({ message: "Building deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error deleting building" });
    }
  }
}

module.exports = new BuildingController();
