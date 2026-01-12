const pool = require("../config/postgres");
const { pubClient } = require("../config/socket");

exports.getCurrentLocation = async (req, res) => {
  try {
    const managerId = req.id;
    const watchmen = await pool.query(
      "SELECT id, name FROM watchman WHERE manager_id = $1", [managerId]
    );

    const results = [];
    for (const w of watchmen.rows) {
      const loc = await pubClient.hGetAll(`watchman:${w.id}:last`);
      if (Object.keys(loc).length) {
        results.push({
          watchman_id: w.id,
          name: w.name,
          lat: parseFloat(loc.lat),
          lon: parseFloat(loc.lon),
          steps: parseInt(loc.totalSteps || loc.steps || 0),
          timestamp: loc.timestamp
        });
      }
    }

    res.json({ watchmen: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching current locations" });
  }
};


exports.getSteps = async (req, res) => {
  try {
    const sid = req.params.sid;
    const managerId = req.id;

    const watchmen = await pool.query("SELECT id FROM watchman WHERE manager_id = $1", [managerId]);
    const ids = watchmen.rows.map((r) => r.id);

    const steps = [];
    for (const wid of ids) {
      const key = await pubClient.hGetAll(`watchman:${wid}:shift:${sid}`);
      if (Object.keys(key).length) {
        steps.push({ watchman_id: wid, steps: key.steps || 0 });
      }
    }

    res.json(steps);
  } catch (err) {
    res.status(500).json({ error: "Failed to get steps data" });
  }
};
