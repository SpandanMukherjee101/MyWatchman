const client = require("../config/postgres");

class wm {
  async add(req, res) {
    try {
      const { username, name, country_code, phone_number } = req.body;
      const manager_id = req.id;

      if (!name || !country_code || !phone_number) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const query = `
        INSERT INTO watchman (username, name, country_code, phone_number, manager_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const values = [username, name, country_code, phone_number, manager_id];

      const result = await client.query(query, values);

      res.status(201).json({
        message: "Watchman added successfully",
        data: result.rows[0],
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Server error", error: e.message });
    }
  }

  async list(req, res) {
    try {
      const managerId = req.id;

      const query = `
        SELECT id, username, name, country_code, phone_number
        FROM watchman
        WHERE manager_id = $1
        ORDER BY id DESC;
      `;
      const result = await client.query(query, [managerId]);

      res.status(200).json({
        message: "Watchmen list retrieved successfully",
        data: result.rows,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Server error", error: e.message });
    }
  }

  async get(req, res) {
    try {
      const managerId = req.id;
      const { watchmanId } = req.params;

      const query = `
        SELECT id, username, name, country_code, phone_number, manager_id
        FROM watchman
        WHERE id = $1 AND manager_id = $2;
      `;
      const result = await client.query(query, [watchmanId, managerId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Watchman not found" });
      }

      res.status(200).json({
        message: "Watchman details retrieved successfully",
        data: result.rows[0],
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Server error", error: e.message });
    }
  }

  async up(req, res) {
    try {
      const managerId = req.id;
      const { watchmanId } = req.params;
      const { username, name, country_code, phone_number } = req.body;

      const query = `
        UPDATE watchman
        SET username = COALESCE($1, username),
            name = COALESCE($2, name),
            country_code = COALESCE($3, country_code),
            phone_number = COALESCE($4, phone_number)
        WHERE id = $5 AND manager_id = $6
        RETURNING *;
      `;
      const values = [
        username,
        name,
        country_code,
        phone_number,
        watchmanId,
        managerId,
      ];

      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Watchman not found or unauthorized" });
      }

      res.status(200).json({
        message: "Watchman updated successfully",
        data: result.rows[0],
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Server error", error: e.message });
    }
  }

  async del(req, res) {
    try {
      const managerId = req.id;
      const { watchmanId } = req.params;

      const query = `
        DELETE FROM watchman
        WHERE id = $1 AND manager_id = $2
        RETURNING id;
      `;
      const result = await client.query(query, [watchmanId, managerId]);

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Watchman not found or unauthorized" });
      }

      res.status(200).json({ message: "Watchman deleted successfully" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Server error", error: e.message });
    }
  }
}

module.exports = new wm();
