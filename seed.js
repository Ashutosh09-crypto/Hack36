const schools = require('./models/school')
const mongoose = require('mongoose');


mongoose.connect('mongodb://localhost:27017/padaiCrow', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Database connected");
    })
    .catch(err => {
        console.log("OH NO ERROR!!!");
        console.log(err);
    })

const padai = new schools({
    name: "DPS",
    password: "DPS123",
    email: "dps@gmail.com"
})


const func = async () => {
    await padai.save();
}


func();









