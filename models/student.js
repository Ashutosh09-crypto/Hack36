const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    rollNumber: {
        type: Number,
        required: true
    },
    dob: {
        type: String,
        required: true
    },
    class: {
        type: String,
        required: true
    },
    schoolId: {
        type: String,
        required: true
    },
    subject: {
        type: [String]
    },
    xp: {
        type: [{ subjectName: String, Xp: Number }]
    }
})

const students = mongoose.model('students', studentSchema);

module.exports = students;