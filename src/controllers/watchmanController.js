const client= require('../config/postgres')

class watchmanController {
    async up(req, res) {
    try {
      const { username, name, country_code, phone_number } = req.body;
      const { id , role }= req;

      if (!id) {
        return res.status(400).json({ error: 'Watchman ID is required' });
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
        return res.status(404).json({ error: 'Watchman not found' });
      }

      res.status(200).json({
        message: 'Profile updated successfully',
        watchman: result.rows[0],
      });
    } catch (e) {
      console.error('Error updating profile:', e);
      res.status(500).json({ error: 'Internal server error' });
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
}

module.exports= new watchmanController();