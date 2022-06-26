const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const express = require('express');
const app = express();


mongoose.connect('mongodb://localhost/librain_db')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log('Error connecting to MongoDB',err))

//type and required and joi

const librain_reg = new mongoose.Schema({
    regnum: Number,
    username: String, 
    email: String,
    password: String,
    category: {type: String, default: "student" },
    librain_points: {type: Number, default: 0}
});

const Member = mongoose.model('Member', librain_reg);

// use

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended:true }))
app.use(express.json());
app.use(express.static('public'))
app.use('/css',express.static(__dirname + '/public/css'))
app.use('/js',express.static(__dirname + '/public/js'))
app.use('/assets',express.static(__dirname + '/public/assets'))

// set

app.set('views', './views')
app.set('view engine','ejs');

// Routes

app.get('/',(req, res)=>{
    res.render('login');
})

app.get('/register',(req, res)=>{
    res.render('register');
})

app.post('/register',(req, res)=>{

    var regnum = parseInt(req.body.regnum);
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;

    async function register_member()
    {
        const member = new Member({
            regnum: regnum,
            username: username,
            email: email,
            password: password
        });
        
        const result = await member.save();
        console.log(result);
    }

    register_member();

    return res.redirect('/');
})



//Listen 

const port = process.env.PORT || 5000;
app.listen(port, ()=>{
    console.log(`listening on port: ${port}`);
})