let token = '';

async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const res = await fetch('/api/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) return (document.getElementById('loginStatus').textContent = data.message);
  token = data.token;
  document.getElementById('loginStatus').textContent = `Logged in as ${data.user.username} (${data.user.role})`;
}

async function loadProducts() {
  const res = await fetch('/api/products');
  const products = await res.json();
  const list = document.getElementById('productList');
  list.innerHTML = '';
  products.forEach((p) => {
    const li = document.createElement('li');
    li.innerHTML = `${p.name} - $${p.price} (stock: ${p.stock}) <button onclick="addToCart('${p.id}')">Add</button>`;
    list.appendChild(li);
  });
}

async function addToCart(productId) {
  if (!token) return alert('Login first');
  const res = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ productId, quantity: 1 }),
  });
  if (!res.ok) return alert('Unable to add to cart');
  loadCart();
}

async function loadCart() {
  if (!token) return;
  const res = await fetch('/api/cart', { headers: { Authorization: `Bearer ${token}` } });
  const cart = await res.json();
  const list = document.getElementById('cartList');
  list.innerHTML = '';
  cart.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = `${item.productId} x ${item.quantity}`;
    list.appendChild(li);
  });
}

async function checkout() {
  if (!token) return alert('Login first');
  const res = await fetch('/api/checkout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!res.ok) return alert(data.message);
  alert(`Order placed: ${data.id}`);
  loadCart();
  loadOrders();
  loadProducts();
}

async function loadOrders() {
  if (!token) return;
  const res = await fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } });
  const orders = await res.json();
  const list = document.getElementById('ordersList');
  list.innerHTML = '';
  orders.forEach((o) => {
    const li = document.createElement('li');
    li.textContent = `${o.id} | total: $${o.total} | status: ${o.status}`;
    list.appendChild(li);
  });
}

loadProducts();
