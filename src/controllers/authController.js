const client = require("../config/postgres");
const jwt = require("jsonwebtoken");
const twilio = require("twilio");

const SECRET_KEY = process.env.SECRET_KEY;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID; 
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_SERVICE_SID = process.env.TWILIO_SERVICE_SID;

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

class authController {
  
  async sendOtp(req, res) {
    try {
      const { c_code, ph } = req.body;
      if (!c_code || !ph) {
        return res.status(400).json({ error: "c_code and ph are required" });
      }

      const phoneNumber = `+${c_code}${ph}`;

      await twilioClient.verify.v2
        .services(TWILIO_SERVICE_SID)
        .verifications.create({ to: phoneNumber, channel: "sms" });

      return res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
      console.error("Twilio Error:", error);
      return res.status(500).json({ error: "Failed to send OTP" });
    }
  }

  async signup(req, res) {
    try {
      const { name, c_code, ph, otp } = req.body;

      if (!name || !c_code || !ph || !otp) {
        return res.status(400).json({ error: "All fields including OTP are required" });
      }

      const phoneNumber = `+${c_code}${ph}`;

      try {
        const verification = await twilioClient.verify.v2
          .services(TWILIO_SERVICE_SID)
          .verificationChecks.create({ to: phoneNumber, code: otp });

        if (verification.status !== "approved") {
          return res.status(401).json({ error: "Invalid or expired OTP" });
        }
      } catch (twilioErr) {
        return res.status(500).json({ error: "OTP Verification failed" });
      }

      const country_code = Number(c_code);
      const phone_number = String(ph).trim();

      try {
        await client.query("BEGIN");
        
        const findText = "SELECT id FROM manager WHERE phone_number = $1 LIMIT 1";
        const findRes = await client.query(findText, [phone_number]);
        
        if (findRes.rowCount > 0) {
          await client.query("ROLLBACK");
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
        res.status(500).json({ error: "Database error" });
      }
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Server error" });
    }
  }

  async login(req, res) {
    try {
      const { c_code, ph, otp } = req.body;

      if (!c_code || !ph || !otp) {
        return res.status(400).json({ error: "c_code, ph and otp are required" });
      }

      const phoneNumber = `+${c_code}${ph}`;

      try {
        const verification = await twilioClient.verify.v2
          .services(TWILIO_SERVICE_SID)
          .verificationChecks.create({ to: phoneNumber, code: otp });

        if (verification.status !== "approved") {
          return res.status(401).json({ error: "Invalid or expired OTP" });
        }
      } catch (twilioErr) {
        return res.status(500).json({ error: "OTP Verification failed" });
      }

      const country_code = Number(c_code);
      const phone_number = String(ph).trim();

      try {
        await client.query("BEGIN");
        const findText = "SELECT id FROM manager WHERE phone_number = $1 AND country_code = $2 LIMIT 1";
        const findRes = await client.query(findText, [phone_number, country_code]);

        if (findRes.rowCount > 0) {
          const token = jwt.sign({ id: findRes.rows[0].id, role: 1 }, SECRET_KEY, {
            expiresIn: "170h",
          });
          await client.query("COMMIT");
          return res.json(token);
        }

        await client.query("COMMIT");
        return res.status(404).json({ data: "User doesn't exist!" });

      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        console.error("DB error:", err);
        res.status(500).json({ error: "Database error" });
      }
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Server error" });
    }
  }

  async wmLogin(req, res) {
    try {
      const { c_code, ph, otp } = req.body;

      if (!c_code || !ph || !otp) {
        return res.status(400).json({ error: "c_code, ph and otp are required" });
      }

      const phoneNumber = `+${c_code}${ph}`;

      try {
        const verification = await twilioClient.verify.v2
          .services(TWILIO_SERVICE_SID)
          .verificationChecks.create({ to: phoneNumber, code: otp });

        if (verification.status !== "approved") {
          return res.status(401).json({ error: "Invalid or expired OTP" });
        }
      } catch (twilioErr) {
        return res.status(500).json({ error: "OTP Verification failed" });
      }

      const country_code = Number(c_code);
      const phone_number = String(ph).trim();

      try {
        await client.query("BEGIN");
        const findText = "SELECT id, manager_id FROM watchman WHERE phone_number = $1 AND country_code = $2 LIMIT 1";
        const findRes = await client.query(findText, [phone_number, country_code]);

        if (findRes.rowCount > 0) {
          const token = jwt.sign({ id: findRes.rows[0].id, role: 2 }, SECRET_KEY, {
            expiresIn: "170h",
          });
          await client.query("COMMIT");
          return res.json(token);
        }

        await client.query("COMMIT");
        return res.status(404).json({ data: "User doesn't exist!" });

      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        console.error("DB error:", err);
        res.status(500).json({ error: "Database error" });
      }
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Server error" });
    }
  }
}

module.exports = new authController();