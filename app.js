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
const session = require('express-session')

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
app.use(session({
    secret: 'keyboard',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1 * 60 * 60 * 1000 },
}))

app.use(bodyParser.urlencoded({ extended: false }))

app.use(cookieParser());
// parse application/json
app.use(bodyParser.json())

// For an actual app you should configure this with an experation time, better keys, proxy and secure
app.use(cookieSession({
    name: 'tuto-session',
    keys: ['key1', 'key2']
}))


//teacher route
app.get("/teacher/login", (req, res) => {
    res.render("teacher/login.ejs");
})


app.post("/teacher/teacherAuth", async (req, res) => {
    const user = await teachers.find({ email: req.body.email })
    if (user[0].password === req.body.pass) {
        console.log("user is authenticated ");
        req.session.teacherData = user[0];
        res.redirect("/teacher/classes");
    } else {
        res.redirect("/teacher/login");
    }
});


app.get("/teacher/classes", (req, res) => {
    res.render("teacher/classes", { user: req.session.teacherData })
})

app.get("/teacher/profile", (req, res) => {
    res.render("teacher/profile", { user: req.session.teacherData })
})

app.get("/teacher/class:num", (req, res) => {
    res.render("teacher/dashboard", { num: req.params.num, user: req.session.teacherData })
})



app.get("/studentsdata:class", async (req, res) => {
    const currentclass = req.params.class.substring(1,);
    const currentteacher = (req.session.teacherData);

    if (currentteacher) {
        const users = await students.find({ schoolld: currentteacher.schoolld, class: currentclass, subject: { $elemMatch: { $eq: currentteacher.subject } } })
        console.log(users);
        res.send(JSON.stringify(users));
    }

})

app.get("/taskdata:class", async (req, res) => {
    const currentclass = req.params.class.substring(1,);
    const currentteacher = (req.session.teacherData);

    if (currentteacher) {
        res.send(JSON.stringify(req.session.teacherData));
    }

})

app.get("/teacher/addtask", async (req, res) => {
    res.render("teacher/addtask");
});


app.post("/teacher/submittask", async (req, res) => {
    const currentteacher = (req.session.teacherData);
    const tasklist = currentteacher.taskList;

    let index = tasklist.findIndex((e) => (e.class == req.body.currentclass));
    tasklist[index].tasks.push({
        "taskName": req.body.taskname,
        "taskDescription": req.body.taskDescription,
        "startDate": req.body.startDate,
        "endDate": req.body.EndDate
    });

    await teachers.updateOne({ _id: (currentteacher._id) }, { taskList: tasklist });

    let user = await teachers.findById({ _id: (currentteacher._id) });
    req.session.teacherData = user;
    res.redirect("/teacher/classes");

});


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
