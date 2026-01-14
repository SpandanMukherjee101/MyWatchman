const pgPool = require("../config/postgres");

const setupDatabase = async () => {
  try {
    await pgPool.query(`
      CREATE EXTENSION IF NOT EXISTS timescaledb;
      CREATE EXTENSION IF NOT EXISTS postgis;

      CREATE TABLE IF NOT EXISTS manager (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        country_code INTEGER NOT NULL,
        phone_number VARCHAR(15) UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS watchman (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50),
        name VARCHAR(100) NOT NULL,
        country_code INTEGER NOT NULL,
        phone_number VARCHAR(15) UNIQUE NOT NULL,
        manager_id INTEGER NOT NULL,
        FOREIGN KEY (manager_id) REFERENCES manager(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS shift (
        id SERIAL PRIMARY KEY,
        manager_id INTEGER NOT NULL,
        tag VARCHAR(50) UNIQUE,
        start_time TIMETZ NOT NULL,
        end_time TIMETZ NOT NULL,
        FOREIGN KEY (manager_id) REFERENCES manager(id) ON DELETE CASCADE 
      );

      CREATE TABLE IF NOT EXISTS watchman_shift (
        watchman_id INTEGER NOT NULL,
        shift_id INTEGER NOT NULL,
        PRIMARY KEY (watchman_id, shift_id),
        FOREIGN KEY (watchman_id) REFERENCES watchman(id) ON DELETE CASCADE,
        FOREIGN KEY (shift_id) REFERENCES shift(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS resident (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        country_code INTEGER NOT NULL,
        phone_number VARCHAR(15) UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS building (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        area VARCHAR(25),
        mid INTEGER NOT NULL,
        FOREIGN KEY (mid) REFERENCES manager(id)
      );

      CREATE TABLE IF NOT EXISTS resident_building (
        resident_id INTEGER NOT NULL,
        building_id INTEGER NOT NULL,
        PRIMARY KEY (resident_id, building_id),
        FOREIGN KEY (resident_id) REFERENCES resident(id) ON DELETE CASCADE,
        FOREIGN KEY (building_id) REFERENCES building(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS building_shift (
        shift_id INTEGER NOT NULL,
        building_id INTEGER NOT NULL,
        PRIMARY KEY (shift_id, building_id),
        FOREIGN KEY (shift_id) REFERENCES shift(id) ON DELETE CASCADE,
        FOREIGN KEY (building_id) REFERENCES building(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS manager_building (
        manager_id INTEGER NOT NULL,
        building_id INTEGER NOT NULL,
        PRIMARY KEY (manager_id, building_id),
        FOREIGN KEY (manager_id) REFERENCES manager(id) ON DELETE CASCADE,
        FOREIGN KEY (building_id) REFERENCES building(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS visitor (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone_number VARCHAR(15) NOT NULL,
        address TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS visitor_building (
        visitor_id INTEGER NOT NULL,
        building_id INTEGER NOT NULL,
        PRIMARY KEY (visitor_id, building_id),
        FOREIGN KEY (visitor_id) REFERENCES visitor(id) ON DELETE CASCADE,
        FOREIGN KEY (building_id) REFERENCES building(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS qr_details (
        id SERIAL PRIMARY KEY,
        qr_set VARCHAR(255) UNIQUE NOT NULL,
        mid INTEGER NOT NULL,
        area VARCHAR(25),
        serial BOOLEAN DEFAULT FALSE,
        shift_id INTEGER NOT NULL,
        scan_interval INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (mid) REFERENCES manager(id) ON DELETE CASCADE,
        FOREIGN KEY (shift_id) REFERENCES shift(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS qr_code (
        id SERIAL PRIMARY KEY,
        code VARCHAR(255) UNIQUE NOT NULL,
        location GEOGRAPHY(POINT, 4326) NOT NULL,
        qr_details_id INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (qr_details_id) REFERENCES qr_details(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS qr_scan_log (
        id SERIAL,
        watchman_id INTEGER NOT NULL,
        qr_code_id INTEGER NOT NULL,
        scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (id, scanned_at),
        FOREIGN KEY (watchman_id) REFERENCES watchman(id) ON DELETE CASCADE,
        FOREIGN KEY (qr_code_id) REFERENCES qr_code(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS duty_log (
        id SERIAL,
        watchman_id INTEGER NOT NULL,
        shift_id INTEGER NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        duty duty_stat NOT NULL,
        PRIMARY KEY (id, timestamp),
        FOREIGN KEY (watchman_id) REFERENCES watchman(id) ON DELETE CASCADE,
        FOREIGN KEY (shift_id) REFERENCES shift(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS visit_log (
        id SERIAL,
        visitor_id INTEGER NOT NULL,
        building_id INTEGER NOT NULL,
        visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        left_at TIMESTAMPTZ,
        PRIMARY KEY (id, visited_at),
        FOREIGN KEY (visitor_id) REFERENCES visitor(id) ON DELETE CASCADE,
        FOREIGN KEY (building_id) REFERENCES building(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS log (
        id SERIAL,
        watchman_id INTEGER NOT NULL,
        shift_id INTEGER NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        steps INTEGER NOT NULL,
        location GEOGRAPHY(POINT, 4326) NOT NULL,
        PRIMARY KEY (id, timestamp),
        FOREIGN KEY (watchman_id) REFERENCES watchman(id) ON DELETE CASCADE,
        FOREIGN KEY (shift_id) REFERENCES shift(id) ON DELETE CASCADE
      );
    `);

    await pgPool.query(`
      SELECT create_hypertable('visit_log', 'visited_at', if_not_exists => TRUE);
    `);

    await pgPool.query(`
      SELECT create_hypertable('log', 'timestamp', if_not_exists => TRUE);
    `);

    await pgPool.query(`
      SELECT create_hypertable('qr_scan_log', 'scanned_at', if_not_exists => TRUE);
    `);

    await pgPool.query(`
      CREATE INDEX IF NOT EXISTS visit_log_composite_idx 
      ON visit_log(visited_at DESC, visitor_id, building_id);
    `);

    await pgPool.query(`
      CREATE INDEX IF NOT EXISTS log_composite_idx 
      ON log(timestamp DESC, watchman_id, shift_id);
    `);

    await pgPool.query(`
      CREATE INDEX IF NOT EXISTS visit_log_visitor_idx ON visit_log(visitor_id);
      CREATE INDEX IF NOT EXISTS visit_log_building_idx ON visit_log(building_id);
      CREATE INDEX IF NOT EXISTS log_watchman_idx ON log(watchman_id);
      CREATE INDEX IF NOT EXISTS log_shift_idx ON log(shift_id);
    `);

    await pgPool.query(`
      ALTER TABLE log 
      SET (
        timescaledb.compress,
        timescaledb.compress_segmentby = 'id,watchman_id,shift_id'
      );
    `);

    await pgPool.query(`
      SELECT add_compression_policy('log', INTERVAL '1 day', if_not_exists => TRUE);
    `);

    console.log("✅ Database setup complete");
  } catch (err) {
    console.error("❌ Error setting up DB:", err);
  }
};

module.exports = { setupDatabase };
