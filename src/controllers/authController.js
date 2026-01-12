const client = require("../config/postgres");
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.SECRET_KEY;

class authController {
  async signup(req, res) {
    try {
      const { name, c_code, ph } = req.body;

      if (!name || !c_code || !ph) {
        return res
          .status(400)
          .json({ error: "name, c_code and ph are required" });
      }

      const country_code = Number(c_code);
      const phone_number = String(ph).trim();

      try {
        await client.query("BEGIN");
        const findText =
          "SELECT id FROM manager WHERE phone_number = $1 LIMIT 1";
        const findRes = await client.query(findText, [phone_number]);
        if (findRes.rowCount > 0) {
          return res.status(409).json({ data: "User exists already!" });
        }
        const insertText = `
            INSERT INTO manager (name, country_code, phone_number)
            VALUES ($1, $2, $3)
            RETURNING id
        `;
        const insertValues = [name, country_code, phone_number];
        const insertRes = await client.query(insertText, insertValues);
        const userId = insertRes.rows[0].id;

        await client.query("COMMIT");

        const token = jwt.sign({ id: userId, role: 1 }, SECRET_KEY, {
          expiresIn: "170h",
        });
        res.json(token);
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        console.error("DB error:", err);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async login(req, res) {
    try {
      const { c_code, ph } = req.body;

      if (!c_code || !ph) {
        return res.status(400).json({ error: "c_code and ph are required" });
      }

      const country_code = Number(c_code);
      const phone_number = String(ph).trim();

      try {
        await client.query("BEGIN");
        const findText =
          "SELECT id FROM manager WHERE phone_number = $1 AND country_code = $2 LIMIT 1";
        const findRes = await client.query(findText, [phone_number, country_code]);
        if (findRes.rowCount > 0) {
          const token = jwt.sign({ id: findRes.rows[0].id, role: 1 }, SECRET_KEY, {
            expiresIn: "170h",
          });
          return res.json(token);
        }

        await client.query("COMMIT");

        return res.status(404).json({ data: "User doesn't exist!" });
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        console.error("DB error:", err);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async wmLogin(req, res) {
    try {
      const { c_code, ph } = req.body;

      if (!c_code || !ph) {
        return res.status(400).json({ error: "c_code and ph are required" });
      }

      const country_code = Number(c_code);
      const phone_number = String(ph).trim();

      try {
        await client.query("BEGIN");
        const findText =
          "SELECT id, manager_id FROM watchman WHERE phone_number = $1 AND country_code = $2 LIMIT 1";
        const findRes = await client.query(findText, [phone_number, country_code]);
        if (findRes.rowCount > 0) {
          const token = jwt.sign({ id: findRes.rows[0].id, role: 2 }, SECRET_KEY, {
            expiresIn: "170h",
          });
          return res.json(token);
        }

        await client.query("COMMIT");

        return res.status(404).json({ data: "User doesn't exist!" });
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        console.error("DB error:", err);
      }
    } catch (e) {
      console.log(e);
    }
  }
}

module.exports = new authController();
