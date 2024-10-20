const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');

const users = require('./jugadores');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = 8000;

let connectedUsers = [];

let questionsTrivia = [];
let questionsKahoot = [];

const cors = require('cors');
const { log } = require('console');
app.use(cors({ origin: 'http://localhost:8080', credentials: true }));

// Cargar preguntas desde el archivo JSON
fs.readFile('questionsTrivia.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Error al leer el archivo de preguntas:', err);
        return;
    }
    questionsTrivia = JSON.parse(data);
    
    
});


fs.readFile('questionsKahoot.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Error al leer el archivo de preguntas:', err);
        return;
    }
    questionsKahoot = JSON.parse(data);
    
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log(req.body);

    if (users[username] && users[username] === password) {
        if (!connectedUsers.includes(username)) {
            connectedUsers.push(username);
            io.emit('user-connected', username);
        }
        // Envía una respuesta de éxito sin redireccionar
        res.json({ success: true, username: username });
    } else {
        res.status(401).json({ error: 'Credenciales incorrectas' });
    }
});




app.get('/getConnectedPlayers', (req, res) => {
    res.json({players: connectedUsers});
});

let currentQuestionData = null;

app.post('/start-game', (req, res) => {   
                // Emitir todas las preguntas a través del socket
        io.emit('start-question', currentQuestionData);

        // Emitir una señal a todos los jugadores para redirigir a la página de pregunta
        io.emit('redirect-to-question');

        res.json({ success: true });
    
});

app.get('/getQuestionsKahoot', (req, res) => {
    if (questionsTrivia && questionsTrivia.length > 0) {
        res.json({ questions: questionsKahoot });
    } else {
        res.status(404).json({ error: 'No se encontraron preguntas' });
    }
});



app.get('/current-question', (req, res) => {
    if (currentQuestionData) {
        res.setHeader('Content-Type', 'application/json'); // Establecer el encabezado
        res.json(currentQuestionData);
        console.log('Pregunta actual:', currentQuestionData);
        
    } else {
        res.status(400).json({ error: 'No hay pregunta activa' });
    }
});


io.on('connection', (socket) => {
    console.log('Un usuario se ha conectado.');

    // Emitir la lista actual de jugadores al nuevo usuario
    socket.emit('current-players', connectedUsers);

    socket.on('set-username', (username) => {
        socket.username = username; // Asignar el nombre de usuario al socket
        if (!connectedUsers.includes(username) && username !== 'admin') {
            connectedUsers.push(username);
        }
        io.emit('update-players', connectedUsers); // Enviar la lista actualizada a todos los clientes
    });

    socket.on('disconnect', () => {
        console.log('Un usuario se ha desconectado.');
        connectedUsers = connectedUsers.filter(user => user !== socket.username);
        io.emit('update-players', connectedUsers); // Enviar la lista actualizada a todos los clientes
    });

    socket.on('submit-answer', (data) => {
        const correctAnswer = currentQuestion.correctAnswer;
        console.log('Respuesta recibida:', data.answer);
        if (data.answer === correctAnswer) {
            socket.emit('answer-result', { message: '¡Respuesta correcta!' });
        } else {
            socket.emit('answer-result', { message: 'Respuesta incorrecta.' });
        }
    });

    socket.on('nextQuestion', (question) => {
        // Emitir la nueva pregunta a todos los clientes conectados
        socket.broadcast.emit('newQuestion', question);
      });
});



server.listen(port, () => {
    console.log(`Servidor iniciado en http://localhost:${port}`);
});
