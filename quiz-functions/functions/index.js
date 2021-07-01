//firebase init
const functions = require("firebase-functions")
const { db, firebase } = require("./utility")
const app = require("express")()
const cors = require("cors")

app.use(cors())

const { authorization } = require("./authorization")
//QUIZ ACTIONS
//get previews
app.get("/quizPreviews", (req, res) => {
  db.collection("quizPreviews")
    .orderBy("completions", "desc")
    .limit(20)
    .get()
    .then(qs => {
      let previews = []
      qs.forEach(doc => previews.push(doc.data()))
      return res.status(200).json(previews)
    })
    .catch(err => res.status(500).json(err.code))
})
//get previews for certain user
app.get("/quizPreviews/:uid", (req, res) => {
  const uid = req.params.uid
  db.collection("quizPreviews")
    .where("uid", "==", uid)
    .get()
    .then(qs => {
      let previews = []
      qs.forEach(doc => previews.push(doc.data()))
      return res.status(200).json(previews)
    })
    .catch(err => res.status(500).json(err.code))
})
//post quiz
app.post("/quizCreate", authorization, (req, res) => {
  const quiz = JSON.parse(req.body)
  const quizObj = quiz.quizObj
  const titleUrl = quiz.titleUrl

  db.doc(`/quizzes/${titleUrl}`)
    .get()
    .then(doc => {
      if (doc.exists) return res.json({ title: "You already made quiz with that title!" })
      return db.doc(`/quizzes/${titleUrl}`).set(quizObj)
    })
    .then(doc => {
      return res.status(201).json({ successes: `Your quizz successfully created` })
    })
    .catch(err => res.status(500).json({ error: "Server error" }))
})
//get quiz
app.get("/quiz/:quiz", (req, res) => {
  db.doc(`quizzes/${req.params.quiz}`)
    .get()
    .then(doc => {
      console.log(doc.data())
      const completionsNumber = doc.data().completions
      if (!doc.exists) return res.status(404).json({ error: "Quiz does not exists" })
      return res.status(200).json(doc.data())
    })
    .catch(err => {
      console.error(err)
      res.status(500).json({ error: "Something went wrong" })
    })
})
//delete quiz
app.delete("/quiz/:quiz", authorization, (req, res) => {
  db.doc(`/quizzes/${req.params.quiz}`)
    .get()
    .then(doc => {
      if (doc.data().userName !== req.user.userName) {
        return res.status(401).json({ general: "Unauthorized" })
      } else {
        return db.doc(`/quizzes/${req.params.quiz}`).delete()
      }
    })
    .then(() => res.status(200).json({ general: "Your quiz was successfully deleted" }))
    .catch(err => res.status(500).json(err.code))
})

exports.api = functions.region("europe-west3").https.onRequest(app)

//Functions on db updates
exports.createQuizPreview = functions
  .region("europe-west3")
  .firestore.document("/quizzes/{title}")
  .onCreate(doc => {
    return db
      .doc(`/quizPreviews/${doc.id}`)
      .set({
        title: doc.data().title,
        description: doc.data().description,
        createdAt: doc.data().createdAt,
        userName: doc.data().userName,
        completions: doc.data().completions,
        imageUrl: doc.data().imageUrl,
        uid: doc.data().uid,
        id: doc.id,
      })
      .catch(err => console.error(err))
  })

exports.deleteQuizPreview = functions
  .region("europe-west3")
  .firestore.document("/quizzes/{title}")
  .onDelete(doc => {
    if (doc.data().imageUrl) {
      let urlArray = doc.data().imageUrl.split("/")
      let imageRef = urlArray[urlArray.length - 1]
      firebase.storage().ref(`quiz/${imageRef})}`).delete()
    }

    return db
      .doc(`/quizPreviews/${doc.id}`)
      .delete()
      .catch(err => console.error(err))
  })

exports.updatePreview = functions
  .region("europe-west3")
  .firestore.document("/quizzes/{title}")
  .onUpdate(doc => {
    return db.doc(`/quizPreviews/${doc.after.id}`).set({
      title: doc.after.data().title,
      description: doc.after.data().description,
      createdAt: doc.after.data().createdAt,
      userName: doc.after.data().userName,
      completions: doc.after.data().completions,
      imageUrl: doc.after.data().imageUrl,
      uid: doc.after.data().uid,
      id: doc.after.id,
    })
  })
