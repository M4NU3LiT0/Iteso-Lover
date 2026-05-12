const jwt = require('jsonwebtoken');

const accessSecret = process.env.JWT_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const generateToken = (id) => {
  return jwt.sign({ id }, accessSecret, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// version is included so that token reuse can be detected during rotation
const generateRefreshToken = (id, version = 0) => {
  return jwt.sign({ id, version }, refreshSecret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, accessSecret);
  } catch {
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, refreshSecret);
  } catch {
    return null;
  }
};

const generateTokens = (id, version = 0) => ({
  accessToken: generateToken(id),
  refreshToken: generateRefreshToken(id, version)
});

module.exports = {
  generateToken,
  generateRefreshToken,
  generateTokens,
  verifyToken,
  verifyRefreshToken
};
