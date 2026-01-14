const client = require("../config/postgres");
const crypto = require("crypto"); // Built-in Node module, much faster than bcrypt for this

class qrController {
    async details(req, res) {
        try {
            const { qr_set, area, serial, scan_interval, shift_id } = req.body;
            const mid = req.id;

            const query = `
                INSERT INTO qr_details (qr_set, mid, area, serial, scan_interval, shift_id) 
                VALUES ($1, $2, $3, $4, $5, $6) 
                RETURNING *`;
            
            const values = [qr_set, mid, area, serial, scan_interval, shift_id];
            const result = await client.query(query, values);

            res.status(201).json({ 
                message: "QR details saved successfully", 
                qrDetails: result.rows[0] 
            });
        } catch (error) {
            console.error("Error in details:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    async generate(req, res) {
        try {
            const { qr_details_id, latitude, longitude, count } = req.body;

            if (!latitude || !longitude || latitude.length !== count || longitude.length !== count) {
                return res.status(400).json({ message: "Latitude/Longitude data missing or mismatch with count" });
            }

            const values = [];
            const placeholders = [];
            
            for (let i = 0; i < count; i++) {
                const code = `QR-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
                
                const locationStr = `POINT(${longitude[i]} ${latitude[i]})`; 

                values.push(code, locationStr, qr_details_id);
                
                const offset = i * 3;
                placeholders.push(`($${offset + 1}, ST_GeographyFromText($${offset + 2}), $${offset + 3})`);
            }

            const query = `
                INSERT INTO qr_code (code, location, qr_details_id) 
                VALUES ${placeholders.join(', ')} 
                RETURNING *`;

            const result = await client.query(query, values);

            res.status(201).json({ 
                message: "QR codes generated successfully", 
                qrCode: result.rows 
            });

        } catch (error) {
            console.error("Error Generating QR code:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    async detailsList(req, res) {
        try {
            const mid = req.id;
            const result = await client.query('SELECT * FROM qr_details WHERE mid = $1', [mid]);
            res.status(200).json({ message: "QR details retrieved", qrDetails: result.rows });
        } catch (e) {
            console.error("Error detailsList:", e);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    async generatedList(req, res) {
        try {
            const mid = req.id;
            const query = `
                SELECT qc.* FROM qr_code qc
                JOIN qr_details qd ON qc.qr_details_id = qd.id
                WHERE qd.mid = $1`;
            
            const result = await client.query(query, [mid]);
            res.status(200).json({ message: "Generated QR codes retrieved", generatedQrCodes: result.rows });
        } catch (e) {
            console.error("Error generatedList:", e);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}

module.exports = new qrController();