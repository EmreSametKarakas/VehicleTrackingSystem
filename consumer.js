const amqp = require("amqplib");
const queueName = process.argv[2] || "jobsQueue";
const data = require("./data.json")
const redis = require("redis")
const client = redis.createClient({
  host: '127.0.0.1',
  port: 7001,
  redis
});

var veriler;

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const { response } = require('express');






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
          getData(JSON.parse(m).dizi);
          //veriler = m;
          //console.log("Okunan", m);

        });

      });
    } catch (error) {
      console.log("Error", error);
    }
  }
}


//console.log(array);
function getData(temp) {
  console.log(temp);
  app.get('/data', function (req, res) {
    let kisiler = [
      { adi: 'Yusuf', soyadi: 'SEZER' },
      { adi: 'Ramazan', soyadi: 'SEZER' },
      { adi: 'Sinan', soyadi: 'SEZER' },
      { adi: 'Mehmet', soyadi: 'SEZER' }
    ];

    res.jsonp(kisiler);
  });
}





//----------
// POST islemini cozumlemek icin gerekli bir ayristirici
var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.use(express.static('public'));
app.get('/index.htm', function (req, res) {
  res.sendFile(__dirname + "/" + "index.htm");
})

app.post('/process_post', urlencodedParser, function (req, res) {
  // JSON formatinda hazirla
  response = {
    bdaytime: req.body.bdaytime,


  };
  console.log(response);
  res.end(JSON.stringify(response));

})


var server = app.listen(8081, function () {
  var host = server.address().address
  var port = server.address().port

  console.log("Dinleniyor. http://%s:%s", host, port)

})