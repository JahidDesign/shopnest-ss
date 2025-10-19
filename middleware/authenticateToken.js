// authenticateToken.js
const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "fa939a8bb3acbcf74b2aa4163a41897ea04ce9ab9c24d472413cbe027d1037fe3c4f801c9968db0e62e4705ffac1bd6cb795834099b21c6df9a5424a376b7919";

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Authorization header missing or invalid" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, error: "Token missing" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, error: "Invalid or expired token" });
    }
    req.user = decoded; // attach decoded user info to req
    next();
  });
}

module.exports = authenticateToken;
