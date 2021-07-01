const firebase = require("firebase")
const admin = require("firebase-admin")
const config = require("./config")
const db = firebase.firestore(firebase.initializeApp(config))

module.exports = { db, admin, firebase }
