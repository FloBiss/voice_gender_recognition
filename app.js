const BodyParser = require("body-parser");
const fs = require('fs');
const http = require('http');
const express = require('express');
const app = express();
const { exec } = require('child_process');
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
const server = http.createServer(app);
const io = require('socket.io').listen(server);

var url = 'http://localhost:8000/';
var epPredictGender = 'predictGender';
var epAddNewInput = 'addNewInput';



//#region File Management
app.get('/main.js', function (req, res) {
    res.sendFile(__dirname + '/web/main.js');
});

app.get('/img/micro.svg', (req, res) => {
    res.sendFile(__dirname + '/web/img/micro.svg');
});
app.get('/img/thumbDown.svg', (req, res) => {
    res.sendFile(__dirname + '/web/img/thumbDown.svg');
});
app.get('/img/thumbUp.svg', (req, res) => {
    res.sendFile(__dirname + '/web/img/thumbUp.svg');
});
app.get('/img/logo.png', (req, res) => {
    res.sendFile(__dirname + '/web/img/logo.png');
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/web/index.html');
});
app.get('/style.css', function (req, res) {
    res.sendFile(__dirname + '/web/style.css');
});
//#endregion


io.sockets.on('connection', function (socket) {
    console.log('Un client est connecté !');


    socket.on('addNewInput', function (gender) {
        console.log('Add new input request received (gender : ' + gender + ')');

        http.get(url + epAddNewInput + '?gender=' + gender, function (res) {
            res.on('data', function (data) {
                var value = data.toString('ascii');
                console.log(value);
            });
            res.on('error', function (err) {
                socket.emit('serverError', err);
                console.log(err);
            });
        });
    });

    socket.on('audioBlob', function (data) {
        console.log('blob received');

        var buf = new Buffer.from(data, 'base64'); // decode
        fs.writeFile("recording/test.wav", buf, function (err) {
            if (err) {
                console.log("err", err);
            } else {
                console.log({ 'status': 'success' });
                http.get(url + epPredictGender, function (res) {

                    res.on('error', (errHttp) => {
                        socket.emit('error', errHttp);
                        console.log(httpErr);
                    });

                    res.on('data', (resData) => {
                        console.log('data : ' + resData);
                        resData = resData + "";
                        var temp = resData.replace(/\\/g, '');
                        temp = temp.replace('"', '');
                        temp = temp.substring(0, temp.length - 2) + ']';
                        var genderObj = JSON.parse(temp);
                        console.log('Gender : ' + genderObj);

                        socket.emit('prediction', genderObj);
                    });


                }).on('error', (httpErr) => {
                    socket.emit('error', httpErr);
                    console.log(httpErr);

                });
            }
        });
    });

});

console.log(new Date());



















server.listen(8080);
