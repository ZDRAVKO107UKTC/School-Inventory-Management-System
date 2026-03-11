const logout = (req, res) => {
  // Clear the cookie (replace 'token' with your specific cookie name)
  res.clearCookie('token', {
    httpOnly: true,
    secure: true, // set to true if using HTTPS
    sameSite: 'None'
  });
  
  return res.status(200).json({ message: "Logged out successfully" });
};

module.exports = { logout };