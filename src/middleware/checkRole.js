module.exports = (req, res, next) => {
  if (req.role !== 1) {
    return res.status(403).json({ message: "Access denied: insufficient permissions" });
  }
  next();
};
