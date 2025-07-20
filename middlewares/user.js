const user = (req, res, next) => {
  if (req.user?.role !== "user") {
    return res.status(403).json({
      status: "Failure",
      message: "Access denied. Users only.",
    });
  }

  next(); 
};

module.exports = {user};
