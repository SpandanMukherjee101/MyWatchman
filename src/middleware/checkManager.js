const client = require("../config/postgres");

module.exports = async (req, res, next) => {
  try {
    const wid = req.body.wid || req.params.wid;

    if (!wid) {
      return res.status(400).json({ message: "watchman_id (wid) is required" });
    }

    const result = await client.query(
      `SELECT * FROM watchman WHERE id = $1 AND manager_id = $2`,
      [wid, req.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ message: "Forbidden: you do not manage this watchman" });
    }

    req.watchmanId = wid;
    next();
  } catch (error) {
    console.error("Error in manager check middleware:", error);
    res.status(500).json({ error: error.message });
  }
};
