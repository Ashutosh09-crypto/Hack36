const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    class: {
        type: [String]
    },
    schoolId: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    taskList: {
        type: [{ class: String, tasks: [{ taskName: String, taskDescription: String, startDate: Date, endDate: Date }] }]   // task -> (task-name, task-description, startDate, deadline);
    }
    ,
    notes: {
        type: [{ class: String, notes: [String] }]
    },
    forum: {
        type: [{ class: String, query: [{ qName: String, q: String }] }]
    }
})

const teachers = mongoose.model('teachers', teacherSchema);

module.exports = teachers;