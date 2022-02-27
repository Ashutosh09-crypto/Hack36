const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
const schools = require('./models/school')
const students = require('./models/student')
const teachers = require('./models/teacher')
const cookieParser = require("cookie-parser");
const cookieSession = require('cookie-session');
const flash = require('connect-flash');
const { resolveSoa } = require('dns');

mongoose.connect('mongodb://localhost:27017/padaiCrow', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Database connected");
    })
    .catch(err => {
        console.log("OH NO ERROR!!!");
        console.log(err);
    })

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: false }))

app.use(cookieParser());
// parse application/json
app.use(bodyParser.json())

// For an actual app you should configure this with an experation time, better keys, proxy and secure
app.use(cookieSession({
    name: 'tuto-session',
    keys: ['key1', 'key2']
}))


app.get("/", async (req, res) => {
    res.send("Hello there!");
})


app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/studentLogin');
})
// student routes

// student logging in
app.get("/studentLogin", async (req, res) => {
    res.render("students/login.ejs");
})


// processing student login post request
app.post("/studentLogin", async (req, res) => {
    const { studentId, studentPassword } = req.body;
    const student = await students.findOne({ email: studentId, dob: studentPassword });

    if (!student) {
        res.send("Sorry, no such user exists!");
    }
    else {
        req.session.userType = "student";
        req.session.user = studentId;
        res.redirect("/students");
    }
})

app.get('/students', async (req, res) => {
    const email = req.session.user;
    const student = await students.findOne({ email: email });
    let clas = student.class;
    const subjects = student.subject;
    console.log(subjects);

    res.render('students/students.ejs', { clas, subjects });
})


app.get("/student/dashboard", async (req, res) => {
    let { subject, clas } = req.cookies;
    const email = req.session.user;
    const student = await students.findOne({ email: email });

    // providing all students
    const allStudents = await students.find({ class: clas, schoolId: student.schoolId });

    // accessing the teacher who teaches the subject
    const teacher = await teachers.findOne({ subject: subject, schoolId: student.schoolId, class: { $in: [clas] } })

    // providing tasks
    const taskList = teacher.taskList;
    let tasks = [];
    for (task of taskList) {
        if (task["class"] = clas)
            tasks = task["tasks"];
    }
    console.log(tasks);
    res.render('students/dashboard.ejs', { allStudents, tasks });
})

// teacher routes

app.listen(3000, () => {
    console.log("STARTED");
})
