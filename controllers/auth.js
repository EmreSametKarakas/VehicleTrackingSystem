const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { route } = require("../routes/auth");
const async = require("hbs/lib/async");
const cookieParser = require("cookie-parser");

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

exports.login = async (req, res) => {
    try{
        const {email, password} = req.body;

        if(!email || !password) {
            return res.status(400).render('login', {
                message: 'you need email and password'
            })
        }

        db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
            if(!results || !(await bcrypt.compare(password, results[0].password)))
                res.status(400).render('login', {
                    message: 'the email or password its incorrect'
                })
                else{
                    const id = results = results[0].id;
                    const token = jwt.sign({ id }, process.env.JWT_SECRET, {
                        expiresIn: process.env.JWT_EXPIRE_IN
                    });
                    /*const coockieOptions = {
                        expires: new date (
                            Date.now() + process.env.JWT_COOKIE_EXPIRE *24 *60*60*1000
                        ),
                        httponly: true,
                    }*/
                    res.cookie('jwt', token, cookieParser);
                    res.status(200).redirect("/")
                }
        });
    } catch(error) {
        console.log(error);
    }
}

exports.register = (req, res) => {
    console.log(req.body);
    const {name, email, password, passwordCheck} = req.body;

    db.query( 'SELECT email, FROM users WHERE email = ?' [email], async, (error, results) => {
        if(error) {
            console.log(error);
        }
        if (results.lenght > 0 ) {
            return res.render('register', {message: 'already use database'})
        } else if ( password !== passwordCheck) {
            return res.render('register', {message: 'not match!'})
        }

        //const hashedPassword = bcrypt.hash(password, 8);

        
        let hashedPassword = bcrypt.hash(password,8);
        console.log(hashedPassword);

        

        db.query(' INSERT INTO user SET ?', {name: name, email: email, password: hashedPassword}, (error, results) => {
            if (error) {
                console.log(error);
            } else {
                return res.render('register', {message: 'the user is register'});
            }
        });

    });

    console.log(req.body);
    res.send("Register confirmed");
}