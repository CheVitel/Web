const API = '/items';
const PER_PAGE = 3; 


const catalog = document.getElementById('catalog');
const pagination = document.getElementById('pagination');
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const fieldName = document.getElementById('fieldName');
const fieldDesc = document.getElementById('fieldDesc');
const fieldPrice = document.getElementById('fieldPrice');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');


let allItems = []; 
let editingId = null;
let currentPage = 1;

async function loadItems() {
    catalog.innerHTML = '<div class="catalog__loading">Загрузка…</div>';
    try {
        const res = await fetch(API);
        allItems = await res.json();
        currentPage = 1;
        render();
    } catch (err) {
        catalog.innerHTML = '<div class="catalog__loading">Ошибка загрузки.</div>';
    }
}


function render() {
    let items = allItems.slice(); 

    // Поиск по названию
    const query = searchInput.value.trim().toLowerCase();
    if (query) {
        items = items.filter(function (item) {
            return item.name.toLowerCase().includes(query);
        });
    }

    // Сортировка по названию
    const sort = sortSelect.value;
    if (sort === 'asc') {
        items.sort(function (a, b) { return a.name.localeCompare(b.name, 'ru'); });
    } else if (sort === 'desc') {
        items.sort(function (a, b) { return b.name.localeCompare(a.name, 'ru'); });
    }

    // Пагинация
    const totalPages = Math.ceil(items.length / PER_PAGE) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PER_PAGE;
    const pagItems = items.slice(start, start + PER_PAGE);

    if (!items.length) {
        catalog.innerHTML = '<div class="catalog__loading">Ничего не найдено.</div>';
    } else {
        catalog.innerHTML = pagItems.map(function (item) {
            return '<div class="item-card">' +
                '<div class="item-card__body">' +
                '<div class="item-card__name">' + escHtml(item.name) + '</div>' +
                '<div class="item-card__desc">' + escHtml(item.description) + '</div>' +
                '<div class="item-card__price">$' + item.price + '</div>' +
                '</div>' +
                '<div class="item-card__actions">' +
                '<button class="icon-btn" onclick="openEdit(' + item.id + ')">✏️</button>' +
                '<button class="icon-btn" onclick="deleteItem(' + item.id + ')">✖️</button>' +
                '</div>' +
                '</div>';
        }).join('');
    }


    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        const active = i === currentPage ? ' class="page-btn page-btn--active"' : ' class="page-btn"';
        html += '<button' + active + ' onclick="goToPage(' + i + ')">' + i + '</button>';
    }
    pagination.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    render();
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function openCreate() {
    editingId = null;
    modalTitle.textContent = 'Добавить игрушку';
    fieldName.value = fieldDesc.value = fieldPrice.value = '';
    modalOverlay.classList.remove('hidden');
    fieldName.focus();
}

async function openEdit(id) {
    try {
        const res = await fetch(API + '/' + id);
        const item = await res.json();
        editingId = id;
        modalTitle.textContent = 'Редактировать игрушку';
        fieldName.value = item.name;
        fieldDesc.value = item.description;
        fieldPrice.value = item.price;
        modalOverlay.classList.remove('hidden');
        fieldName.focus();
    } catch (err) {
        alert('Не удалось загрузить запись.');
    }
}

function closeModal() {
    modalOverlay.classList.add('hidden');
    editingId = null;
}

async function saveItem() {
    const name = fieldName.value.trim();
    const description = fieldDesc.value.trim();
    const price = fieldPrice.value.trim();

    if (!name || !description || !price) {
        alert('Заполните все поля.');
        return;
    }

    const body = { name, description, price: Number(price) };

    try {
        if (editingId === null) {
            await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } else {
            await fetch(API + '/' + editingId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        }
        closeModal();
        loadItems();
    } catch (err) {
        alert('Ошибка сохранения.');
    }
}

async function deleteItem(id) {
    if (!confirm('Удалить эту игрушку?')) return;
    try {
        await fetch(API + '/' + id, { method: 'DELETE' });
        loadItems();
    } catch (err) {
        alert('Ошибка удаления.');
    }
}

document.getElementById('addBtn').addEventListener('click', openCreate);
document.getElementById('cancelBtn').addEventListener('click', closeModal);
document.getElementById('saveBtn').addEventListener('click', saveItem);
modalOverlay.addEventListener('click', function (e) { if (e.target === modalOverlay) closeModal(); });

searchInput.addEventListener('input', function () { currentPage = 1; render(); });
sortSelect.addEventListener('change', function () { currentPage = 1; render(); });

loadItems();
