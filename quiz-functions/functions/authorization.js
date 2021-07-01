const { db, admin } = require("./utility")
admin.initializeApp()

exports.authorization = (req, res, next) => {
  let idToken
  if (req.headers.authorization) {
    idToken = req.headers.authorization.split("Bearer ")[1]
  } else {
    console.error("No token found")
    return res.status(403).json({ general: "Unauthorized" })
  }

  admin
    .auth()
    .verifyIdToken(idToken)
    .then(decodedToken => {
      req.user = decodedToken
      return db.collection("users").where("uid", "==", req.user.uid).limit(1).get()
    })
    .then(data => {
      return next()
    })
    .catch(err => {
      console.error("Error while verifying token", err)
      return res.status(403).json(err)
    })
}
