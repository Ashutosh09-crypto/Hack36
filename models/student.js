const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    dob: {
        type: Date,
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