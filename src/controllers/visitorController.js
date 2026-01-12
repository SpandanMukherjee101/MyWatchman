const client = require("../config/postgres");

class WatchmanBuildingController {
  constructor() {
    this.getBuildingVisitorLogs = this.getBuildingVisitorLogs.bind(this);
    this.getVisitorBuildings = this.getVisitorBuildings.bind(this);
    this.getVisitorsForBuilding = this.getVisitorsForBuilding.bind(this);
    this.logVisitor = this.logVisitor.bind(this);
    this.updateVisitorLog = this.updateVisitorLog.bind(this);
  }

  async _checkBuildingUnderWatchmanManager(watchmanId, buildingId) {
    const result = await client.query(
      `SELECT 1
       FROM watchman w
       JOIN building b ON b.mid = w.manager_id
       WHERE w.id = $1 AND b.id = $2;`,
      [watchmanId, buildingId]
    );
    return result.rows.length > 0;
  }

  async _checkWatchmanBuildingAccess(watchmanId, buildingId) {
    const result = await client.query(
      `SELECT 1
       FROM building b
       JOIN building_shift bs ON bs.building_id = b.id
       JOIN watchman_shift ws ON ws.shift_id = bs.shift_id
       WHERE ws.watchman_id = $1 AND b.id = $2;`,
      [watchmanId, buildingId]
    );
    return result.rows.length > 0;
  }

  async getBuildingVisitorLogs(req, res) {
    try {
      const watchmanId = req.id;
      const buildingId = req.params.bid;

      const allowed = await this._checkBuildingUnderWatchmanManager(
        watchmanId,
        buildingId
      );
      if (!allowed)
        return res
          .status(403)
          .json({ message: "This building is not under your manager" });

      const result = await client.query(
        `SELECT v.*, vl.visited_at, vl.left_at
         FROM visit_log vl
         JOIN visitor v ON v.id = vl.visitor_id
         WHERE vl.building_id = $1
         ORDER BY vl.visited_at DESC;`,
        [buildingId]
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching building visitor logs:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async getVisitorBuildings(req, res) {
    try {
      const watchmanId = req.id;
      const visitorId = req.params.vid;

      const result = await client.query(
        `SELECT b.*
         FROM watchman w
         JOIN building b ON b.mid = w.manager_id
         JOIN visitor_building vb ON vb.building_id = b.id
         WHERE w.id = $1 AND vb.visitor_id = $2;`,
        [watchmanId, visitorId]
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching visitor buildings:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async getVisitorsForBuilding(req, res) {
    try {
      const watchmanId = req.id;
      const buildingId = req.params.bid;

      const allowed = await this._checkBuildingUnderWatchmanManager(
        watchmanId,
        buildingId
      );
      if (!allowed)
        return res
          .status(403)
          .json({ message: "This building is not under your manager" });

      const result = await client.query(
        `SELECT v.*
         FROM visitor v
         JOIN visitor_building vb ON vb.visitor_id = v.id
         WHERE vb.building_id = $1;`,
        [buildingId]
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching visitors for building:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async logVisitor(req, res) {
    try {
      const watchmanId = req.id;
      const { name, phone_number, address, building_id } = req.body;

      const hasAccess = await this._checkWatchmanBuildingAccess(
        watchmanId,
        building_id
      );
      if (!hasAccess)
        return res
          .status(403)
          .json({ message: "You are not assigned to this building" });

      let visitor = await client.query(
        `SELECT * FROM visitor WHERE phone_number = $1;`,
        [phone_number]
      );

      if (visitor.rows.length === 0) {
        visitor = await client.query(
          `INSERT INTO visitor (name, phone_number, address)
           VALUES ($1, $2, $3)
           RETURNING *;`,
          [name, phone_number, address]
        );
      }

      const visitorId = visitor.rows[0].id;

      await client.query(
        `INSERT INTO visitor_building (visitor_id, building_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING;`,
        [visitorId, building_id]
      );

      const log = await client.query(
        `INSERT INTO visit_log (visitor_id, building_id)
         VALUES ($1, $2)
         RETURNING *;`,
        [visitorId, building_id]
      );

      res
        .status(201)
        .json({ message: "Visitor logged successfully", log: log.rows[0] });
    } catch (error) {
      console.error("Error logging visitor:", error);
      res.status(500).json({ error: error.message });
    }
  }

  async updateVisitorLog(req, res) {
    try {
      const watchmanId = req.id;
      const visitorId = req.params.visitorId;
      const { building_id, left_at } = req.body;

      const hasAccess = await this._checkWatchmanBuildingAccess(
        watchmanId,
        building_id
      );
      if (!hasAccess)
        return res
          .status(403)
          .json({ message: "You are not assigned to this building" });

      const result = await client.query(
        `UPDATE visit_log
         SET left_at = $1
         WHERE visitor_id = $2 AND building_id = $3 AND left_at IS NULL
         RETURNING *;`,
        [left_at || new Date(), visitorId, building_id]
      );

      if (result.rows.length === 0)
        return res.status(404).json({ message: "Active visit not found" });

      res.json({ message: "Visit updated successfully", log: result.rows[0] });
    } catch (error) {
      console.error("Error updating visitor log:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new WatchmanBuildingController();
