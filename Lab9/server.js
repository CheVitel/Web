const express    = require('express');
const bodyParser = require('body-parser');
const path       = require('path');
const http       = require('http');
const { Server } = require('socket.io');
const rest       = require('./rest');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);
const PORT   = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// ── Страницы ──────────────────────────────────────────────
app.get('/', function(req, res) { res.render('index'); });
app.get('/about', function(req, res) { res.render('about'); });
app.get('/chat', function(req, res) { res.render('chat'); });

// ── REST API ──────────────────────────────────────────────
app.get('/items',        rest.getAll);
app.get('/items/:id',    rest.getById);
app.post('/items',       rest.create);
app.put('/items/:id',    rest.update);
app.delete('/items/:id', rest.remove);

// ── WebSocket (Socket.IO) ─────────────────────────────────
const users = {}; // socket.id -> имя

io.on('connection', function(socket) {

    // Пользователь вошёл в чат
    socket.on('user:join', function(username) {
        users[socket.id] = username;
        io.emit('user:joined', { id: socket.id, name: username });
        io.emit('users:update', Object.values(users));
        console.log(username + ' подключился');
    });

    // Текстовое сообщение
    socket.on('message:text', function(text) {
        const name = users[socket.id] || 'Аноним';
        io.emit('message:text', {
            from: name,
            text: text,
            time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        });
    });

    // Файл (передаётся как base64)
    socket.on('message:file', function(data) {
        const name = users[socket.id] || 'Аноним';
        io.emit('message:file', {
            from: name,
            filename: data.filename,
            mime:     data.mime,
            base64:   data.base64,
            time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        });
    });

    // Пользователь отключился
    socket.on('disconnect', function() {
        const name = users[socket.id];
        if (name) {
            delete users[socket.id];
            io.emit('user:left', { id: socket.id, name: name });
            io.emit('users:update', Object.values(users));
            console.log(name + ' отключился');
        }
    });
});

// ── Запуск ────────────────────────────────────────────────
server.listen(PORT, function() {
    console.log('Сервер запущен: http://localhost:' + PORT);
    console.log('');
    console.log('Страницы:');
    console.log('  GET  http://localhost:' + PORT + '/');
    console.log('  GET  http://localhost:' + PORT + '/about');
    console.log('  GET  http://localhost:' + PORT + '/chat');
    console.log('');
    console.log('REST API:');
    console.log('  GET    http://localhost:' + PORT + '/items');
    console.log('  GET    http://localhost:' + PORT + '/items/:id');
    console.log('  POST   http://localhost:' + PORT + '/items');
    console.log('  PUT    http://localhost:' + PORT + '/items/:id');
    console.log('  DELETE http://localhost:' + PORT + '/items/:id');
});
