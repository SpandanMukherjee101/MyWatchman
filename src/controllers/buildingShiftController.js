const client = require("../config/postgres");

class BuildingShiftController {
  constructor() {
    this.list = this.list.bind(this);
    this.add = this.add.bind(this);
    this.get = this.get.bind(this);
    this.up = this.up.bind(this);
    this.del = this.del.bind(this);
  }

  async _checkOwnership(managerId, buildingId) {
    const result = await client.query(
      `SELECT 1 FROM building WHERE id = $1 AND mid = $2`,
      [buildingId, managerId]
    );
    return result.rows.length > 0;
  }

  async list(req, res) {
    try {
      const managerId = req.id;
      const building_id = req.params.id;

      const ownsBuilding = await this._checkOwnership(managerId, building_id);
      if (!ownsBuilding) {
        return res
          .status(403)
          .json({ message: "Not authorized to access this building" });
      }

      const result = await client.query(
        `SELECT s.*
         FROM building_shift bs
         JOIN shift s ON s.id = bs.shift_id
         WHERE bs.building_id = $1
         ORDER BY s.id;`,
        [building_id]
      );

      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error listing building_shift:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async add(req, res) {
    try {
      const managerId = req.id;
      const building_id = req.params.id;
      const shift_id = req.body.sid;

      const ownsBuilding = await this._checkOwnership(managerId, building_id);
      if (!ownsBuilding) {
        return res
          .status(403)
          .json({ message: "Not authorized to modify this building" });
      }

      const result = await client.query(
        `INSERT INTO building_shift (shift_id, building_id)
         VALUES ($1, $2)
         RETURNING *;`,
        [shift_id, building_id]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      if (error.code === "23505") {
        return res
          .status(409)
          .json({ message: "Shift already linked to this building" });
      }
      console.error("Error adding building_shift:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async get(req, res) {
    try {
      const managerId = req.id;
      const building_id = req.params.id;
      const shift_id = req.params.sid;

      const ownsBuilding = await this._checkOwnership(managerId, building_id);
      if (!ownsBuilding) {
        return res
          .status(403)
          .json({ message: "Not authorized to access this building" });
      }

      const result = await client.query(
        `SELECT *
         FROM building_shift
         WHERE building_id = $1 AND shift_id = $2;`,
        [building_id, shift_id]
      );

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Shift not found for this building" });
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching building_shift:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async up(req, res) {
    try {
      const managerId = req.id;
      const building_id = req.params.id;
      const { shift_id, new_shift_id } = req.body;

      if (!new_shift_id) {
        return res
          .status(400)
          .json({ message: "new_shift_id is required in body" });
      }

      const ownsBuilding = await this._checkOwnership(managerId, building_id);
      if (!ownsBuilding) {
        return res
          .status(403)
          .json({ message: "Not authorized to modify this building" });
      }

      const result = await client.query(
        `UPDATE building_shift
         SET shift_id = $1
         WHERE building_id = $2 AND shift_id = $3
         RETURNING *;`,
        [new_shift_id, building_id, shift_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Record not found" });
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error("Error updating building_shift:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async del(req, res) {
    try {
      const managerId = req.id;
      const building_id = req.params.id;
      const shift_id = req.params.sid;

      const ownsBuilding = await this._checkOwnership(managerId, building_id);
      if (!ownsBuilding) {
        return res
          .status(403)
          .json({ message: "Not authorized to modify this building" });
      }

      const result = await client.query(
        `DELETE FROM building_shift
         WHERE building_id = $1 AND shift_id = $2
         RETURNING *;`,
        [building_id, shift_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Record not found" });
      }

      res.status(200).json({ message: "Deleted successfully" });
    } catch (error) {
      console.error("Error deleting building_shift:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new BuildingShiftController();
