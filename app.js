var express = require("express");
var mysql = require("mysql");
var dotenv = require('dotenv');
var path = require('path');
var cookieParser = require('cookie-parser');
// ------------
var bodyParser = require('body-parser');
var { response } = require('express');

const amqp = require("amqplib");

const message = {
    dizi: []
};

const datalar = require("./data.json");
const { connect } = require("http2");
const queueName = process.argv[2] || "jobsQueue";
//---------


dotenv.config({ path: './.env' });

var app = express();



var db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABE_PASSWORD,
    database: process.env.DATABASE,
});

var publicDirectory = path.join(__dirname, './public');
var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.set('view engine', 'hbs');
app.use(express.static(publicDirectory));
//parse url kısmı
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.post('/creat-contact', function (req, res) {
    return res.redirect('practice');
});
//----


db.connect((error) => {
    if (error) {
        console.log(error)
    } else {
        console.log("Mysql connected..")
    }
});

//define routes
app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));

//--------

app.use(express.static(publicDirectory));
app.get('/index.hbs', function (req, res) {
    res.sendFile(__dirname + "/" + "index.hbs");
})

app.post('/', urlencodedParser, function (req, res) {
    // JSON formatinda hazirla
    response = {
        bdaytime: req.body.bdaytime,
        bdaytime1: req.body.bdaytime1,
        aracid: req.body.aracid

    };
    //console.log(response.bdaytime);
    console.log(response.aracid);
    //res.end(JSON.stringify(response));
    res.sendFile(__dirname + "/" + "index"); //-----------------
    data_gonder(response.bdaytime, response.bdaytime1, response.aracid);
    res.redirect('/');
})

function data_gonder(parametre, parametre1, parametre2) {
    connect_rabbitmq();

    async function connect_rabbitmq() {
        try {

            const connection = await amqp.connect("amqp://localhost:5672");
            const channel = await connection.createChannel();
            const assertion = await channel.assertQueue(queueName);
            datalar.forEach(i => {
                if (i.id == parametre2) {
                    var parcala = i.tarih.split(" ");
                    var alinan_tarih = parametre.split("T");
                    var alinan_tarih1 = parametre1.split("T");


                    var sm = parcala[1].split(":");
                    var s = sm[0];
                    var m = sm[1];

                    var sm_alinan = alinan_tarih[1].split(":");
                    var sm_alinan1 = alinan_tarih1[1].split(":");
                    
                    var p;
                    //console.log(sm_alinan[0]);


                    for (p = sm_alinan[0] + 1; p >= sm_alinan1[0]; p--) {

                        if ((s == p) && parcala[0] == alinan_tarih[0]) {
                            message.dizi.push(i);
                        }
                    }


                }

            });
            channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message.dizi)));
            //console.log("Gönderilern mesaj", message);
            // verileri_at(message);
            veri_cek();
        } catch (error) {
            console.log("Error", error);
        }
    }
}

const redis = require("redis")
const client = redis.createClient({
    host: '127.0.0.1',
    port: 7001,
    redis
});

var veriler;


function veri_cek() {
    connect_rabbitmq();

    async function connect_rabbitmq() {
        try {

            const connection = await amqp.connect("amqp://localhost:5672");
            const channel = await connection.createChannel();
            const assertion = await channel.assertQueue(queueName);
            // Mesajın Alınması...
            //console.log("Mesaj bekleniyor...");
            channel.consume(queueName, message => {
                const messageInfo = JSON.parse(message.content.toString())

                // console.log("İşlenen Kayıt", messageInfo);
                client.set('user_${1}', JSON.stringify(messageInfo), (err, status) => {

                    if (!err) {
                        console.log("Status", status);
                        channel.ack(message);
                    }
                });

                client.get('user_${1}', (e, m) => {
                    //datayiGetir(m);
                    datayiGetir(JSON.parse(m)); 
                    //veriler = m;
                    //console.log("Okunan", m);

                });

            });
        } catch (error) {
            console.log("Error", error);
        }
    }
}


function datayiGetir(gecici) {
    //veriler = gecici.tarih;
    //console.log(gecici);    
    app.get('/datalar', function (req, res) {
        /*let kisiler = [
            { adi: 'Yusuf', soyadi: 'SEZER' },
            { adi: 'Ramazan', soyadi: 'SEZER' },
            { adi: 'Sinan', soyadi: 'SEZER' },
            { adi: 'Mehmet', soyadi: 'SEZER' }
        ];*/
        //res.send(gecici);
       res.jsonp(gecici);
    });
}

//console.log(array); 

app.use(express.static('public'));
app.get('/index', function (req, res) {
    res.sendFile(__dirname + "/" + "index");
})

/*
var server = app.listen(8081, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("Dinleniyor. http://%s:%s", host, port)

})*/



//-------

app.listen(8081, () => {
    console.log("Server started on port 8081");
    
    
});