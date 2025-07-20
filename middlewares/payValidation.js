// const jwt = require("jsonwebtoken");

// const User = require("../models/usersModel");

// exports.loginUser = async (req, res) => {
//   const { email, password } = req.body;

//   const user = await User.findOne({ email });

//   if (!user || user.password !== password) {
//     return res.status(401).json({ message: "Invalid email or password" });
//   }

//   // التوكن بيتولد هنا
//   const token = jwt.sign(
//     { id: user._id, email: user.email },
//     process.env.TOKEN_SECRET,
//     { expiresIn: "30m" }
//   );

//   res.status(200).json({ token });
// };

// module.exports = (req, res, next) => {
//   const authHeader = req.headers.authorization;

//   // التحقق من وجود الهيدر وصيغة Bearer
//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res.status(401).json({ message: "Please login first" });
//   }

//   // استخراج التوكن من الهيدر
//   const token = authHeader.split(" ")[1];

//   try {
//     // التحقق من التوكن
//     const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
//     req.user = decoded; // حفظ بيانات المستخدم في الطلب
//     next(); // الانتقال للراوت التالي
//   } catch (err) {
//     return res.status(401).json({ message: "Invalid or expired token" });
//   }
// };
const jwt = require("jsonwebtoken");
const User = require("../models/usersModel"); // Adjust path as needed

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.TOKEN_SECRET,
    { expiresIn: "30m" }
  );

  res.status(200).json({ token });
};
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  //console.log("Auth Header:", authHeader);
  //console.log("TOKEN_SECRET:", process.env.TOKEN_SECRET);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Please login first" });
  }
  const token = authHeader.split(" ")[1];
  //console.log("Token:", token);
  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    //console.log("Decoded Token:", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token Verification Error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
