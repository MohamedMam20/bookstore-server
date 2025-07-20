require("dotenv").config();

const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const { authorization } = req.headers;
  const token = authorization && authorization.split(" ")[1];

  if (token == null) {
    return res.status(401).json({
      status: "Failure",
      message: "You must login first.",
    });
  }
  jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({
        status: "Failure",
        message: `You must login first.`,
      });
    }
    // if(user.role != "admin"){
    //            return res.status(401).json({
    //                     status: "Failure",
    //             message : "Invalid Role"
    //         });

    // }
    req.user = user;

    next();
  });
};

module.exports = { verifyToken };


