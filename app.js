const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require("cookie-parser");
const { resolveSoa } = require('dns');

const teachers = require('./models/teacher.js');
const students = require('./models/student.js');
const schools = require('./models/school.js');

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
app.use(bodyParser.urlencoded({ extended: true }))
app.use(session({
    secret: 'keyboard',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1 * 60 * 60 * 1000 },
}))

app.use(flash());

app.use(cookieParser());
// parse application/json
app.use(bodyParser.json())


app.get("/",(req,res)=>{
    res.render("selector");
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
    console.log(subject);
    console.log(clas);
    const email = req.session.user;
    const student = await students.findOne({ email: email });

    // providing all students
    const allStudents = await students.find({ class: clas, schoolId: student.schoolId });

    // accessing the teacher who teaches the subject
    const teacher = await teachers.findOne({ subject: subject, schoolId: student.schoolId, class: { $in: [clas] } })


    // providing tasks
    const taskList = teacher.taskList;
    let tasks = [];

    taskList.forEach(task => {
        if (task["class"] === clas)
            tasks = task["tasks"];
    });
    res.render('students/dashboard.ejs', { allStudents, tasks, student, teacher });
})


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

app.get("/teacher/rewardStudents", async (req, res) => {
    const currentteacher = (req.session.teacherData);

    res.render("teacher/rewardStudent", { user: currentteacher });
});

app.get("/studentfromclassx:class", async (req, res) => {

    const currentclass = req.params.class.substring(1,);
    const currentteacher = (req.session.teacherData);

    if (currentteacher && currentclass) {
        const users = await students.find({ schoolld: currentteacher.schoolld, class: currentclass, subject: { $elemMatch: { $eq: currentteacher.subject } } })
        res.send(JSON.stringify(users));
    }

})

app.post("/teacher/submitreward", async (req, res) => {

    const currentteacher = (req.session.teacherData);

    if (currentteacher) {
        const stu = await students.findById({ _id: (req.body.students) });
        let currentxp;

        stu.xp.forEach(e => {
            if (e.subjectName === currentteacher.subject) {
                currentxp = e.Xp;
            }
        });

        await students.updateOne({ _id: (req.body.students), "xp.subjectName": currentteacher.subject }, { $set: { "xp.$.Xp": parseInt(currentxp + parseInt(req.body.xp)) } });
        res.redirect("/teacher/classes");
    }


})

app.get("/teacher/logout", (req, res) => {
    req.session.teacherData = {};
    res.redirect("/teacher/login");
})


// school routes

app.get('/schoolLogin', async (req, res) => {
    res.render("school/schoolLogin.ejs");
})

app.post('/schoolLogin', async (req, res) => {
    const { schoolEmail, schoolPassword } = req.body;
    const school = await schools.findOne({ email: schoolEmail, password: schoolPassword });

    if (!school) {
        res.send("Sorry, No school found!");
    }
    else {
        const name = school.name;
        req.session.school = schoolEmail;
        req.session.schoolId = school._id;
        res.redirect('/school/dashboard');
    }
})

app.get('/school/dashboard', async (req, res) => {
    const school = await schools.findOne({ email: req.session.school });
    const name = school.name;
    res.render('school/schoolDashboard.ejs', { name });
})

app.get('/school/teachers', async (req, res) => {
    const school = await schools.findOne({ email: req.session.school });
    const allTeachers = await teachers.find({ schoolId: school._id });
    res.render('school/schoolTeachers.ejs', { allTeachers });
})

app.get('/school/students', async (req, res) => {
    res.render("school/schoolStudents.ejs");
})

// registration of new student

app.post('/school/addStudent', async (req, res) => {
    const { studentName, studentEmail, studentDob, studentClass } = req.body;
    const isExisting = await students.findOne({ email: studentEmail });

    if (isExisting) {
        res.send('Student already exist with such email!');
    }
    else {
        const schoolId = req.session.schoolId;
        const student = new students({
            name: studentName,
            email: studentEmail,
            dob: studentDob,
            class: studentClass,
            schoolId: schoolId
        });

        await student.save();
        res.redirect('/school/students');
    }

})

app.post('/school/searchStudent', async (req, res) => {
    const { studentEmail } = req.body;
    const isExisting = await students.findOne({ email: studentEmail });

    if (!isExisting) {
        res.send("Sorry, no student found!");
    }
    else {
        req.session.user = studentEmail;
        res.redirect('/students');
    }
})

app.listen(3000, () => {
    console.log("STARTED");
})
