const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = path.join(__dirname, 'data');
const sessions = new Map();
const carts = new Map();

const readJson = (file) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
const writeJson = (file, data) => fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));

const authRequired = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  req.user = sessions.get(token);
  next();
};

const adminRequired = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = readJson('users.json');
  const user = users.find((u) => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = uuidv4();
  const safeUser = { id: user.id, username: user.username, role: user.role };
  sessions.set(token, safeUser);
  if (!carts.has(user.id)) carts.set(user.id, []);

  res.json({ token, user: safeUser });
});

app.get('/api/products', (req, res) => {
  res.json(readJson('products.json'));
});

app.post('/api/products', authRequired, adminRequired, (req, res) => {
  const { name, description, price, stock } = req.body;
  const products = readJson('products.json');

  const newProduct = { id: uuidv4(), name, description, price: Number(price), stock: Number(stock) };
  products.push(newProduct);
  writeJson('products.json', products);

  res.status(201).json(newProduct);
});

app.put('/api/products/:id', authRequired, adminRequired, (req, res) => {
  const products = readJson('products.json');
  const idx = products.findIndex((p) => p.id === req.params.id);

  if (idx === -1) return res.status(404).json({ message: 'Product not found' });

  products[idx] = { ...products[idx], ...req.body };
  writeJson('products.json', products);
  res.json(products[idx]);
});

app.delete('/api/products/:id', authRequired, adminRequired, (req, res) => {
  const products = readJson('products.json');
  const filtered = products.filter((p) => p.id !== req.params.id);

  if (products.length === filtered.length) {
    return res.status(404).json({ message: 'Product not found' });
  }

  writeJson('products.json', filtered);
  res.json({ message: 'Product deleted' });
});

app.get('/api/cart', authRequired, (req, res) => {
  res.json(carts.get(req.user.id) || []);
});

app.post('/api/cart', authRequired, (req, res) => {
  const { productId, quantity } = req.body;
  const qty = Number(quantity) || 1;
  const products = readJson('products.json');
  const product = products.find((p) => p.id === productId);

  if (!product) return res.status(404).json({ message: 'Product not found' });

  const userCart = carts.get(req.user.id) || [];
  const existing = userCart.find((item) => item.productId === productId);
  if (existing) existing.quantity += qty;
  else userCart.push({ productId, quantity: qty });

  carts.set(req.user.id, userCart);
  res.status(201).json(userCart);
});

app.post('/api/checkout', authRequired, (req, res) => {
  const products = readJson('products.json');
  const orders = readJson('orders.json');
  const userCart = carts.get(req.user.id) || [];

  if (!userCart.length) return res.status(400).json({ message: 'Cart is empty' });

  const orderItems = [];
  let total = 0;

  for (const cartItem of userCart) {
    const product = products.find((p) => p.id === cartItem.productId);
    if (!product) return res.status(400).json({ message: `Product ${cartItem.productId} missing` });
    if (product.stock < cartItem.quantity) {
      return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
    }
    product.stock -= cartItem.quantity;
    const lineTotal = product.price * cartItem.quantity;
    total += lineTotal;
    orderItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: cartItem.quantity,
      lineTotal,
    });
  }

  const order = {
    id: uuidv4(),
    userId: req.user.id,
    items: orderItems,
    total: Number(total.toFixed(2)),
    status: 'placed',
    createdAt: new Date().toISOString(),
  };

  orders.push(order);
  writeJson('orders.json', orders);
  writeJson('products.json', products);
  carts.set(req.user.id, []);

  res.status(201).json(order);
});

app.get('/api/orders', authRequired, (req, res) => {
  const orders = readJson('orders.json');
  if (req.user.role === 'admin') return res.json(orders);
  return res.json(orders.filter((o) => o.userId === req.user.id));
});

app.patch('/api/orders/:id/status', authRequired, adminRequired, (req, res) => {
  const orders = readJson('orders.json');
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  order.status = req.body.status || order.status;
  writeJson('orders.json', orders);
  res.json(order);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
