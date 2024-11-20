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
const playerResponses = {};
let players = [];


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
    //ahora mezclamos las preguntas
    questionsTrivia = questionsTrivia.sort(() => Math.random() - 0.5);

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

// Sirve los archivos estáticos de la carpeta dist
app.use(express.static(path.join(__dirname, '../dist')));

// Redirige todas las rutas al archivo index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log(req.body);

    if (users[username] && users[username] === password) {
        if (!connectedUsers.includes(username)) {
            //connectedUsers.push({username: username, score: 0});
            io.emit('user-connected', username);
        }
        // Envía una respuesta de éxito sin redireccionar
        res.json({ success: true, username: username });
    } else {
        res.status(401).json({ error: 'Credenciales incorrectas' });
    }
});




app.get('/getConnectedPlayers', (req, res) => {
    res.json({ players: connectedUsers });
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

app.get('/getQuestionsTrivia', (req, res) => {
    if (questionsTrivia && questionsTrivia.length > 0) {
        res.json({ questions: questionsTrivia });
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

app.post('/updatePlayers', (req, res) => {
    players = req.body.players;
    res.json({ success: true });
});

app.get('/getPlayers', (req, res) => {
    res.json({ players });
});

//ruta para obtener cuantas preguntas hay en el questions Trivia que tengas cada nombre en el About de "Aitor","Javier","Manel","Ana", "Oscar", "Noa", "Marcos" y "Carla"
app.get('/getQuestionsCount', (req, res) => {
    const questionsCount = {
        Aitor: 0,
        Javier: 0,
        Noa: 0,
        Ana: 0,
        Oscar: 0,
        Marcos: 0,
        Carla: 0,
        Manel: 0
    };

    //about es una array con strings, quiero que sume 1 a cada nombre que haya en el array

    questionsTrivia.forEach(question => {
        question.about.forEach(name => {
            if (questionsCount[name] !== undefined) {
                questionsCount[name]++;
            }
        });
    }
    );
    res.json(questionsCount);
});


io.on('connection', (socket) => {
    console.log('Un usuario se ha conectado.');

    // Emitir la lista actual de jugadores al nuevo usuario
    socket.emit('current-players', connectedUsers);

    socket.on('set-username', (username) => {
        socket.username = username; // Asignar el nombre de usuario al socket
        if (!connectedUsers.includes(username) && username !== 'admin') {
            connectedUsers.push({ username: socket.username, score: 0 });
            console.log('Usuarios conectados:', connectedUsers);

        }
        io.emit('update-players', connectedUsers); // Enviar la lista actualizada a todos los clientes
    });

    socket.on('disconnect', () => {
        console.log('Un usuario se ha desconectado.');
        connectedUsers = connectedUsers.filter(user => user.username !== socket.username);
        io.emit('update-players', connectedUsers); // Enviar la lista actualizada a todos los clientes
    });

    socket.on('submit-answer', (data) => {
        // Guardar la respuesta del jugador
        playerResponses[data.player] = data.answer;

        // Emitir al administrador para que actualice la lista de respuestas
        io.emit('new-answer', {
            player: data.player,
            answer: data.answer
        });
    });

    socket.on('resolve-answers', () => {
        const results = [];
        for (const player in playerResponses) {
            const isCorrect = playerResponses[player] === currentQuestion.correctAnswer;
            if (isCorrect) {
                // Lógica para sumar puntos al jugador
            }
            results.push({
                player,
                correct: isCorrect
            });
        }

        // Enviar los resultados al admin
        socket.emit('resolve-results', results);

        // Reiniciar las respuestas para la siguiente pregunta
        Object.keys(playerResponses).forEach(key => delete playerResponses[key]);
    });

    socket.on('nextQuestion', (question) => {
        // Emitir la nueva pregunta a todos los clientes conectados
        socket.broadcast.emit('newQuestion', question);
    });

    //socket para redigiar a los usuarios a trivia-room
    socket.on('redirect-to-trivia-room', () => {
        io.emit('redirect-to-trivia-room');
    });

    socket.on('redirect-to-resultados', () => {
        io.emit('redirect-to-resultados');
    });

    socket.on('nuevo-turno',(turno) =>{
        io.emit('nuevo-turno', turno);
    })

    socket.on('nueva-pregunta', (pregunta) => {
        io.emit('nueva-pregunta', pregunta);
    });
});



server.listen(port, () => {
    console.log(`Servidor iniciado en http://localhost:${port}`);
});
