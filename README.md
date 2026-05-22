# E-Commerce Web Application

A basic full-stack online store with role-based authentication, product management, cart operations, checkout flow, and order tracking.

## Features
- Product catalog listing
- Add to cart and checkout
- User login with roles (`admin`, `user`)
- Admin APIs for product and order status management
- JSON file-based storage for products, users, and orders

## Demo Users
- Admin: `admin` / `admin123`
- User: `user` / `user123`

## Setup
```bash
npm install
npm start
```
Open `http://localhost:3000`.

## API Overview
- `POST /api/login`
- `GET /api/products`
- `POST /api/products` (admin)
- `PUT /api/products/:id` (admin)
- `DELETE /api/products/:id` (admin)
- `GET /api/cart`
- `POST /api/cart`
- `POST /api/checkout`
- `GET /api/orders`
- `PATCH /api/orders/:id/status` (admin)
