const bcrypt = require('bcrypt');
const Joi = require('joi');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const fs = require('fs');
const upload = require('express-fileupload');
const { array } = require('joi');
const app = express();


mongoose.connect('mongodb://localhost/librain_db')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log('Error connecting to MongoDB', err))
      


const librain_reg = new mongoose.Schema({
    Register_number: Number,
    Username: String,
    email: { type: String },
    password: String,
    category: { type: String, default: "student" },
    librain_points: { type: Number, default: 0 }
});

const upload_schema = new mongoose.Schema({
    url: String, 
    path: String, 
    name: String,
    branch: String,
    sem: String,
    scheme: String,
    subject: String,
    material: String,
    upvote: Number,
    report: Number
});

const upload_subject = new mongoose.Schema({
    _id: String,
    subject: Array, 
    branch: String, 
    sem: String,
    scheme: String
});


const Member = mongoose.model('Member', librain_reg);
const File = mongoose.model('File', upload_schema);
const Subject = mongoose.model('Subject', upload_subject);


app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }))
app.use(express.json());
app.use(upload());

app.use(express.static('public'))
app.use('/css', express.static(__dirname + '/public/css'))
app.use('/js', express.static(__dirname + '/public/js'))
app.use('/assets', express.static(__dirname + '/public/assets'))

// set

app.set('views', './views')
app.set('view engine', 'ejs');

// Routes

app.get('/', (req, res) => {
    
    res.render('login', { msg: "" });
})

app.get('/register', (req, res) => {
    res.render('register', { msg: "" });
})

app.get('/home', (req, res) => {
    res.render('home');
})

app.get('/branch', (req, res) => {
    res.render('branch')
})

app.get('/branch/:branch', (req, res) => { 
    res.render('sem_copy')
})

app.get('/branch/:branch/:sem/', (req, res) => {
    res.render('scheme');
})

app.get('/branch/:branch/:sem/:scheme/',async(req, res) => {

    let trikoo = await Subject.findOne({branch:req.params.branch, sem:req.params.sem, scheme:req.params.scheme});
    console.log(typeof req.params.sem)
    let sem_id = parseInt(req.params.sem);
    console.log(trikoo.subject);
    res.render('subject',{subjects:trikoo.subject});

})


app.get('/branch/:branch/:sem/:scheme/:subject/', (req, res) => {
    res.render('materials');
})

function toTitleCase(str) {
    return str.replace(
      /\w\S*/g,
      function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
    );
  }

app.get('/branch/:branch/:sem/:scheme/:subject/:material', async (req, res) => {
    console.log({url: req.get('Referrer')+req.params.material});
    const files = await File.find({url: req.get('Referrer')+req.params.material+"/"}).exec();

    res.render('textbook', {files, header: toTitleCase(req.params.material)});
})

app.post('/', async (req, res) => {

    let result = await Member.findOne({ Register_number: req.body.Register_number });
    console.log(result);
    if (!result) return res.render('login', { msg: "invalid register number or password" });

    const compare = await bcrypt.compare(req.body.password, result.password);
    if (!compare) return res.render('login', { msg: "invalid register number or password" });

    res.render('home')
})

app.post('/upload', async (req, res) => {
    if (!req.files)
        return res.end("Upload failed");

    console.log(req.get('Referrer'));

    u_rl = JSON.stringify(req.get('Referrer'));

    u__rl = u_rl.split("/")

    const file = req.files.file;
    const out = path.resolve(`./public/uploads/${file.md5}-${file.name}`);
    fs.writeFileSync(out, file.data);



    const uploaded = new File({
        path: `/uploads/${file.md5}-${file.name}`,
        name: file.name,
        url: req.get('Referrer'),
        branch: u__rl[4],
        sem: u__rl[5],
        scheme: u__rl[6],
        subject: u__rl[7],
        material: u__rl[8]
    });

    await uploaded.save();

    res.write("<script>navigation.back()</script>");

})

app.post('/register', (req, res) => {

    var Register_number = parseInt(req.body.Register_number);
    var Username = req.body.Username;
    var email = req.body.email;
    var password = req.body.password;

    async function register_member() {
        const member = new Member({
            Register_number: Register_number,
            Username: Username,
            email: email,
            password: password
        })

        const { error } = validateMember(member);
        const error_pass = error.details[0].message;
        if (error_pass != '"$__" is not allowed') {
            console.log(error_pass);
            if (error) return res.render('register', { msg: error_pass });
        }
        // return res.json ({ status: 'error', error: 'invalid Username'})
        // return res.status(400).send(error.details[0].message);
        const salt = await bcrypt.genSalt(10);
        console.log(salt);
        const hashed = await bcrypt.hash(member.password, salt);
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

        Register_number: Joi.number()
            .greater(3)
            .required(),

        Username: Joi.string()
            .alphanum()
            .min(3)
            .max(30)
            .required(),

        email: Joi.string()
            .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net','in'] } }),

        password: Joi.string()
            .min(3)
            .max(10),

    })
    return schema.validate(member);

}

//Listen 

const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`listening on port: ${port}`);
})