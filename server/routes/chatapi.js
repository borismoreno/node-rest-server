require('../config/config');
const app = require('express')();
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
app.use(bodyParser.json());
let Message = require('../models/message');
let Respuesta = require('../models/respuesta');
const mailComposer = require('mailcomposer');
var nodeses = require('node-ses'),
    client = nodeses.createClient({ key: process.env.API_KEY_SES, secret: process.env.SECRET_SES });


process.on('unhandledRejection', err => {
    console.log(err)
});	

app.get('/webhook', function (req, res) {
    res.send("Esta funcionando.");
}); 

app.post('/webhook', async function (req, res) {
    const data = req.body;
    let respuesta;
    const respuestas = [];
    // console.log(JSON.stringify(data));
    // mailComposer({
    //     from: 'borismoreno84@gmail.com',
    //     to: 'boris_marco_moreno@hotmail.com',
    //     subject: 'Mensajes',
    //     text: JSON.stringify(data)
    // }).build((err, mensaje) => {
    //     if (err) {
    //         //console.log(err);
    //     } else {
    //         client.sendRawEmail({
    //             from: 'borismoreno84@gmail.com',
    //             rawMessage: mensaje
    //         },
    //         function(err, data, respuesta) {});
    //     }
    // })
    let message;
    for (var i in data.messages) {
        const author = data.messages[i].author;
        const body = data.messages[i].body;
        const chatId = data.messages[i].chatId;
        const senderName = data.messages[i].senderName;

        message = new Message({
            author,
            body,
            chatId,
            senderName,
            fecha: new Date()
        });

        try {
            if (!data.messages[i].fromMe) {
                await message.save();
                let text = 'No entiendo tu mensaje'
                if (/comenzar/.test(body.toString().toLowerCase())) {
                    text = `${senderName}, Por favor ingresa una de las siguientes opciones:\n\n1) Saldo\n2) Movimientos`;
                } else if (/1/.test(body.toString().toLowerCase())) {
                    text = `${senderName}, Tu saldo es de $20.`;
                } else if (/2/.test(body.toString().toLowerCase())) {
                    text = `${senderName}, Tus 2 últimos movimientos son los siguientes:\n\n-Retiro de $20.\n-Retiro de $50.`;
                }
                if (chatId === '593994651967@c.us' || chatId === '593984545169@c.us')
                    await apiChatApi('message', {chatId, body: text});
            }
        } catch (error) {
            console.log(error);
        }

        //if(data.messages[i].fromMe)return;
        
        // if(/help/.test(body)){
        //     const text = `${senderName}, this is a demo bot for https://chat-api.com/.
        //     Commands:
        //     1. chatId - view the current chat ID
        //     2. file [pdf/jpg/doc/mp3] - get a file
        //     3. ptt - get a voice message
        //     4. geo - get a location
        //     5. group - create a group with you and the bot`;
        //     respuesta = await apiChatApi('message', {chatId: chatId, body: text});
        // }else if(/Ok!/.test(body)){
        // //}else if(/chatId/.test(body)){
        //     console.log('entra');
        //     respuesta = await apiChatApi('message', {chatId: chatId, body: chatId});
        // }else if(/file (pdf|jpg|doc|mp3)/.test(body)){
        //     const fileType = body.match(/file (pdf|jpg|doc|mp3)/)[1];
        //     const files = {
        //         doc: "http://domain.com/tra.docx",
        //         jpg: "http://domain.com/tra.jpg",
        //         mp3: "http://domain.com/tra.mp3",
        //         pdf: "http://domain.com/tra.pdf"
        //     };
        //     var dataFile = {
        //         phone: author,
        //         body: files[fileType],
        //         filename: `File *.${fileType}`
        //     };
        //     if(fileType == "jpg")dataFile['caption'] = "Text under the photo.";
        //     respuesta = await apiChatApi('sendFile', dataFile);
        // }else if(/ptt/.test(body)){            
        //     respuesta = await apiChatApi('sendAudio', {audio: "http://domain.com/tra.ogg", chatId: chatId});
        // }else if(/geo/.test(body)){
        //     respuesta = await apiChatApi('sendLocation', {lat: 51.178843, lng: -1.826210, address: 'Stonehenge', chatId: chatId});
        // }else if(/group/.test(body)){
        //     let arrayPhones = [ author.replace("@c.us","") ];
        //     respuesta = await apiChatApi('group', {groupName: 'Bot group', phones: arrayPhones, messageText: 'Welcome to the new group!'});
        // }
        // respuestas.push(respuesta);
    }
    res.send('Ok');
});

async function apiChatApi(method, params){
    const options = {};
    options['method'] = "POST";
    options['body'] = JSON.stringify(params);
    options['headers'] = { 'Content-Type': 'application/json' };
    const apiUrl = process.env.API_CHAT;
    const token = process.env.API_CHAT_TOKEN;
    
    const url = `${apiUrl}/${method}?token=${token}`; 
    
    const apiResponse = await fetch(url, options);
    const jsonResponse = await apiResponse.json();
    
    const {sent, message, id} = jsonResponse;

    try {
        let respuesta = new Respuesta({
            sent,
            message,
            id
        });
        await respuesta.save();
    } catch (error) {
        console.log(error);
    }
    // const jsonResponse = {
    //     url,
    //     options
    // }
    return jsonResponse;
}

module.exports = app;