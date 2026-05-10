const store = require('./store');

function getAll(req, res) {
    const items = store.readAll();
    res.json(items);
}

function getById(req, res) {
    const item = store.findById(req.params.id);

    if (!item) {
        return res.status(404).json({ error: 'Запись не найдена' });
    }
    res.json(item);
}

function create(req, res) {
    const { name, description, price } = req.body;

    if (!name || !description || !price) {
        return res.status(400).json({ error: 'Поля name, description и price обязательны' });
    }

    const newItem = {
        id: store.generateId(),
        name: name,
        description: description,
        price: Number(price)
    };

    const items = store.readAll();
    items.push(newItem);
    store.saveAll(items);

    res.status(201).json(newItem);
}

function update(req, res) {
    const items = store.readAll();
    const index = items.findIndex(function (item) {
        return item.id === parseInt(req.params.id);
    });

    if (index === -1) {
        return res.status(404).json({ error: 'Запись не найдена' });
    }

    const { name, description, price } = req.body;

    if (name) items[index].name = name;
    if (description) items[index].description = description;
    if (price) items[index].price = Number(price);

    store.saveAll(items);

    res.json(items[index]);
}

function remove(req, res) {
    const items = store.readAll();
    const index = items.findIndex(function (item) {
        return item.id === parseInt(req.params.id);
    });

    if (index === -1) {
        return res.status(404).json({ error: 'Запись не найдена' });
    }

    const deleted = items.splice(index, 1);
    store.saveAll(items);

    res.json(deleted[0]);
}

module.exports = { getAll, getById, create, update, remove };
