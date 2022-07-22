const bcrypt = require('bcrypt');
const Joi = require('joi');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const express = require('express');
const app = express();


mongoose.connect('mongodb://localhost/librain_db')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log('Error connecting to MongoDB',err))

//type and required and joi

const librain_reg = new mongoose.Schema({
    Register_number: Number,
    Username: String, 
    email: {type: String},
    password: String,
    category: {type: String, default: "student" },
    librain_points: {type: Number, default: 0}
});

const Member = mongoose.model('Member', librain_reg);

// async function salter(){
    
// }
// salter();

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
    res.render('login',{ msg:""});
})

app.get('/register',(req, res)=>{
    res.render('register',{ msg:""});
})

app.post('/', async (req, res)=>{

    let result = await Member.findOne({ Register_number : req.body.Register_number});
    console.log(result);
    if (!result) return res.render('login',{ msg:"invalid register number or password" });

    const compare = await bcrypt.compare(req.body.password , result.password);
    if(!compare) return res.render('login',{ msg:"invalid register number or password" });

    res.send("<h1>You are logged in</h1>");
})

app.post('/register',(req, res)=>{

    var Register_number = parseInt(req.body.Register_number);
    var Username = req.body.Username;
    var email = req.body.email;
    var password = req.body.password;

    async function register_member()
    {
        const member = new Member({
            Register_number: Register_number,
            Username: Username,
            email: email,
            password: password
        })

        const { error } = validateMember(member);
        const error_pass = error.details[0].message;
        if(error_pass != '"$__" is not allowed'){
            console.log(error_pass);
            if (error) return res.render('register',{ msg:error_pass });
        }
        // return res.json ({ status: 'error', error: 'invalid Username'})
        // return res.status(400).send(error.details[0].message);
        const salt = await bcrypt.genSalt(10);
        console.log(salt);
        const hashed = await bcrypt.hash(member.password ,salt);
        member.password = hashed;
        console.log(hashed);

        const result = await member.save();
        console.log(result);
        return res.redirect('/');
    }

    register_member();
})

function validateMember(member) {
    const schema = Joi.object({

        Register_number:Joi.number()
        .greater(3)
        .required(),

        Username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required(),

        email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),

        password: Joi.string()
        .pattern(new RegExp('^[a-z]{1}[a-z0-9_]{3,13}$')),

    })
    return schema.validate(member);

}

//Listen 

const port = process.env.PORT || 5000;
app.listen(port, ()=>{
    console.log(`listening on port: ${port}`);
})