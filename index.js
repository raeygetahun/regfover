const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const saltedMd5 = require("salted-md5");
const path = require("path");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });
require("dotenv").config();

const port = process.env.PORT || 8070;
const app = express();

// app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.BUCKET_URL,
  databaseURL:
    "https://constructorhack-4560c-default-rtdb.europe-west1.firebasedatabase.app",
});

app.locals.bucket = admin.storage().bucket();
const db = admin.firestore();

app.post("/register", upload.single("file"), async (req, res) => {
  try {
    console.log(req.body);
    console.log(req);
    const name = saltedMd5(req.file.originalname, "SUPER-S@LT!");
    const fileName = name + path.extname(req.file.originalname);
    await app.locals.bucket
      .file(fileName)
      .createWriteStream()
      .end(req.file.buffer);

    const [downloadURL] = await app.locals.bucket.file(fileName).getSignedUrl({
      action: "read",
      expires: "01-01-2100",
    });
    const data = req.body;
    const userData = {
      name: data.full_name,
      email: data.email,
      pronoun: data.pronouns,
      constructorStudent: data.constructor,
      major: data.major,
      minor: data.minor,
      school: data.school,
      diploma: data.diploma,
      graduationYear: data.graduation_year,
      linkedin: data.linkedin,
      cv: downloadURL,
      dietaryRestrictions: data.dietary_restrictions,
      dietaryRestrictionsDetails: data.dietary_restrictions,
      whyParticipate: data.reason_to_participate,
      haveTeam: data.team_preference,
      suggestionsQuestions: data.suggestions_questions,
    };

    db.collection("users").add(userData);
    res.sendFile(path.join(__dirname, "thankyou.html"));
  } catch (error) {
    const responseHtml = `
    <html>
      <head>
        <script>
          alert("Please try again!");
        </script>
      </head>
      <body></body>
    </html>
  `;
    // console.error(error);
    res.status(400).send(responseHtml);
  }
});

// app.post("/register", async (req, res) => {
//   try {
//     console.log("hi");
//     const data = req.body;
//     // const userData = {
//     //   name: data.fullName,
//     //   email: data.email,
//     //   pronoun: data.pronoun,
//     //   constructorStudent: data.constructorStudent,
//     //   major:data.major,
//     //   minor: data.minor,
//     //   school: data.school,
//     //   diploma: data.diploma,
//     //   graduationYear: data.graduationYear,
//     //   linkedin: data.linkedin,
//     //   // cv:data.cv,
//     //   dietaryRestrictions: data.dietaryRestrictions,
//     //   dietaryRestrictionsDetails: data.dietaryRestrictionsDetails,
//     //   whyParticipate: data.whyParticipate,
//     //   haveTeam: data.haveTeam,
//     //   suggestionsQuestions: data.suggestionsQuestions
//     // };
//     const userData = {
//       name: data.name,
//       email_id: data.email_id,
//       phone: data.phone,
//     };
//     db.collection("users").add(userData);
//     console.log(userData);
//     console.log(data);
//     res.send("added sucessfully");
//   } catch (error) {
//     console.log("error");
//     console.log(error);
//     res.send(error);
//   }
// });

app.listen(port, () => console.log("Running"));
