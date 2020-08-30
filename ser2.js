const express = require('express');
const bodyParser = require('body-parser');
//const mongoose = require('mongoose');
//const apiRouter = require('./app/services');
const fs = require('fs');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

//var PythonShell = require('python-shell');
let {PythonShell} = require('python-shell');
var options = {
    mode : 'text', //podria ser json
    pythonPath: '/usr/bin/python2.7',
    pythonOptions: ['-u'],
    args: []
};
var sckt;

app.use(express.static(__dirname + '/public')); //html por defecto, estatico, sin template engines
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function (req, res) {
    res
        .status(200)
        .sendFile(__dirname + '/public/ind2.html');
});

app.get('/pruebaio', function (req, res) {
    res
        .status(200)
        .sendFile(__dirname + '/public/ind3.html');
});


app.post('/', function (req, res) { /* VER ESTO, ¿REPUESTA A POST DEL USUARIO? */
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end("mando la respuesta");
});

app.post('/procesar', function (req, res) {
    // *************
   /* !!!!!  El io connection tiene que ir afuera de todos los metodos de app get/post me parece */
    //io.on('connection', function (socket) {
    // *************

    var codigoLimpio = req.body.codigo; //toString??
    var codigoProcesado, codigoDevuelto = "";

    fs.writeFile(__dirname + '/public/emptyscript.py', codigoLimpio, function (err) {
        if (err) throw err;
    });
    var pyshell = new PythonShell(__dirname + '/public/emptyscript.py', options);
    pyshell.on('message', function (message) {
        codigoProcesado = message;
        console.log(codigoProcesado);
        codigoDevuelto += codigoProcesado + "\n";

        io.emit('chat message', message);
     //   io.emit('respuesta', codigoProcesado);
  //      socket.emit('repuesta', codigoProcesado);

    });
    pyshell.end(function (err) { //terminarlo aca?
        if (err){
            codigoDevuelto = err;
        }//throw err;
        console.log("pyshell hace end");
        /* DEVOLVER DATOS DE SCRIPT A USUARIO */

        // *** COMENTO EL END (RESPONSE) A VER QUE PASA *** QUEDA PENDING..
        //res.writeHead(200, {"Content-Type": "text/plain"});
        //res.end("Lo que devuelve el servidor al cliente: \n\r" + codigoDevuelto);

        res.redirect('back');

    });
    // console.log('script del usuario finalizado');
    //  console.log("Devuelto: ");
    //  console.log(codigoDevuelto);

   // });//io.on
});

io.on('connection', (socket) => {
    sckt = socket;
    socket.on('chat message', (msg) => {
       // console.log('message: ' + msg);
        io.emit('chat message', msg);
        /*envio msj a todos los clientes (emito evento a todos los sockets
          conectados) */
    });
});

http.listen(3000, function () {
    console.log('Escuchando en el puerto 3000');
});