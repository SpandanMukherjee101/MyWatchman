const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY;

module.exports = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }


  jwt.verify(token, SECRET_KEY, (error, decoded) => {
    if (error) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    
    req.id = decoded.id;
    req.role = decoded.role;
    next();
  });
};
