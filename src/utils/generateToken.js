// Import necessary modules from dependencies
import jwt from 'jsonwebtoken';
// Function to generate an activation token
export function generateActivationToken(payload) {
  return jwt.sign(payload, process.env.ACTIVATION_TOKEN_SECRET, { expiresIn: '30m' });
}

// Function to generate an access token
export function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10m' });
}

// Function to generate a refresh token and set it in a cookie
export function generateRefreshToken(payload, res) {
  const token = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '30d' });

  res.cookie('inspace_rfToken', token, {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,  // 30 days
    path: '/api/v1/auth/refresh_token'
  });

  return token;
}
