const socket = io();

// ── DOM-элементы ─────────────────────────────────────────
const joinScreen    = document.getElementById('joinScreen');
const chatLayout    = document.getElementById('chatLayout');
const usernameInput = document.getElementById('usernameInput');
const joinBtn       = document.getElementById('joinBtn');
const chatMessages  = document.getElementById('chatMessages');
const messageInput  = document.getElementById('messageInput');
const sendBtn       = document.getElementById('sendBtn');
const fileInput     = document.getElementById('fileInput');
const usersList     = document.getElementById('usersList');

let myName = '';

// ── Вход в чат ───────────────────────────────────────────
function join() {
    const name = usernameInput.value.trim();
    if (!name) { usernameInput.focus(); return; }
    myName = name;
    socket.emit('user:join', name);
    joinScreen.classList.add('hidden');
    chatLayout.classList.remove('hidden');
    messageInput.focus();
}

joinBtn.addEventListener('click', join);
usernameInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') join(); });

// ── Отправка текста ──────────────────────────────────────
function sendText() {
    const text = messageInput.value.trim();
    if (!text) return;
    socket.emit('message:text', text);
    messageInput.value = '';
    messageInput.focus();
}

sendBtn.addEventListener('click', sendText);
messageInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') sendText(); });

// ── Отправка файла ───────────────────────────────────────
fileInput.addEventListener('change', function() {
    const file = fileInput.files[0];
    if (!file) return;

    const MAX = 5 * 1024 * 1024; // 5 МБ
    if (file.size > MAX) {
        alert('Файл слишком большой. Максимум 5 МБ.');
        fileInput.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result.split(',')[1];
        socket.emit('message:file', {
            filename: file.name,
            mime:     file.type,
            base64:   base64
        });
    };
    reader.readAsDataURL(file);
    fileInput.value = '';
});

// ── Получение событий от сервера ─────────────────────────

// Кто-то вошёл
socket.on('user:joined', function(data) {
    appendSystem(data.name + ' присоединился к чату');
});

// Кто-то вышел
socket.on('user:left', function(data) {
    appendSystem(data.name + ' покинул чат');
});

// Обновление списка участников
socket.on('users:update', function(names) {
    usersList.innerHTML = names.map(function(n) {
        return '<li class="users-list__item' + (n === myName ? ' users-list__item--me' : '') + '">' + escHtml(n) + '</li>';
    }).join('');
});

// Входящее текстовое сообщение
socket.on('message:text', function(data) {
    const isMine = data.from === myName;
    appendMessage(data.from, data.time, isMine,
        '<div class="msg__text">' + escHtml(data.text) + '</div>');
});

// Входящий файл
socket.on('message:file', function(data) {
    const isMine = data.from === myName;
    const src = 'data:' + data.mime + ';base64,' + data.base64;
    let content;

    if (data.mime.startsWith('image/')) {
        // Изображение
        content = '<img class="msg__image" src="' + src + '" alt="' + escHtml(data.filename) + '" ' +
                  'onclick="openFullscreen(this)" />';
    } else {
        // Документ — ссылка на скачивание
        content = '<a class="msg__file-link" href="' + src + '" download="' + escHtml(data.filename) + '">' +
                  '📄 ' + escHtml(data.filename) + '</a>';
    }

    appendMessage(data.from, data.time, isMine, content);
});

// ── Вспомогательные функции ───────────────────────────────

function appendMessage(from, time, isMine, contentHtml) {
    const div = document.createElement('div');
    div.className = 'msg' + (isMine ? ' msg--mine' : '');
    div.innerHTML =
        '<div class="msg__meta"><span class="msg__author">' + escHtml(from) + '</span>' +
        '<span class="msg__time">' + time + '</span></div>' +
        contentHtml;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendSystem(text) {
    const div = document.createElement('div');
    div.className = 'msg msg--system';
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Просмотр изображения в полный экран
window.openFullscreen = function(img) {
    const overlay = document.createElement('div');
    overlay.className = 'fs-overlay';
    overlay.innerHTML = '<img src="' + img.src + '" class="fs-img" /><span class="fs-close">✕</span>';
    overlay.addEventListener('click', function() { document.body.removeChild(overlay); });
    document.body.appendChild(overlay);
};
