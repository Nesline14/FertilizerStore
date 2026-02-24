# FertiStore – Online Fertilizer Store

Full-stack demo application for an online fertilizer store with product catalog, authentication, cart, wishlist, orders, admin inventory management, and user settings.

## Stack

- **Backend**: Node.js, Express, SQLite (via `better-sqlite3`), JWT auth
- **Frontend**: React, React Router, Webpack + Babel

## Folder structure

- `server/`
  - `package.json`
  - `src/`
    - `db.js` – database connection and schema (SQLite)
    - `seed.js` – seeds users and sample products
    - `authMiddleware.js` – JWT auth and admin guard
    - `server.js` – Express app and REST APIs
- `client/`
  - `package.json`
  - `webpack.config.js` – bundler configuration
  - `.babelrc` – Babel presets
  - `public/index.html` – root HTML
  - `src/`
    - `index.jsx` – React entry point
    - `App.jsx` – layout and routing
    - `authContext.jsx` – auth state + helper fetch
    - `styles.css` – global styles and layout
    - `pages/`
      - `ProductsPage.jsx` – catalog with search/filter, subsidies/discounts, add-to-cart/wishlist
      - `CartPage.jsx` – cart management and order placement
      - `WishlistPage.jsx` – wishlist listing and removal
      - `OrdersPage.jsx` – customer order history
      - `AdminInventoryPage.jsx` – admin CRUD for products and stock
      - `AdminOrdersPage.jsx` – admin view of all orders
      - `SettingsPage.jsx` – profile, addresses, payment methods
      - `LoginPage.jsx` – login for admin/customer
      - `RegisterPage.jsx` – customer registration

## Database schema (SQLite)

Defined in `server/src/db.js` and created automatically on first run:

- `users`
  - `id` INTEGER PK
  - `name` TEXT
  - `email` TEXT UNIQUE
  - `password_hash` TEXT
  - `role` TEXT (`admin` or `customer`)
  - `created_at` TEXT
- `addresses`
  - `id` INTEGER PK
  - `user_id` INTEGER FK → `users.id`
  - `label`, `line1`, `line2`, `city`, `state`, `postal_code`, `country`
  - `is_default` INTEGER
- `payment_methods`
  - `id` INTEGER PK
  - `user_id` INTEGER FK → `users.id`
  - `label`, `card_last4`, `provider`
  - `is_default` INTEGER
- `products`
  - `id` INTEGER PK
  - `name`, `description`
  - `price` REAL
  - `stock_quantity` INTEGER
  - `type`, `brand`, `category`
  - `subsidy_percent` REAL
  - `discount_percent` REAL
  - `created_at` TEXT
- `cart_items`
  - `id` INTEGER PK
  - `user_id` INTEGER FK → `users.id`
  - `product_id` INTEGER FK → `products.id`
  - `quantity` INTEGER
- `wishlist_items`
  - `id` INTEGER PK
  - `user_id` INTEGER FK → `users.id`
  - `product_id` INTEGER FK → `products.id`
- `orders`
  - `id` INTEGER PK
  - `user_id` INTEGER FK → `users.id`
  - `status` TEXT
  - `total_amount` REAL
  - `created_at` TEXT
- `order_items`
  - `id` INTEGER PK
  - `order_id` INTEGER FK → `orders.id`
  - `product_id` INTEGER FK → `products.id`
  - `quantity` INTEGER
  - `unit_price` REAL
  - `subsidy_percent` REAL
  - `discount_percent` REAL

## Sample data

Seeded via `server/src/seed.js`:

- Users:
  - Admin: `admin@fertistore.local` / `admin123` (role: `admin`)
  - Customer: `john@farm.local` / `customer123` (role: `customer`)
- Products (examples):
  - **NitroBoost Urea 46%** – nitrogen fertilizer with 15% subsidy
  - **GreenRoot NPK 10-26-26** – NPK fertilizer with 10% discount
  - **Organic Compost Mix** – organic fertilizer with 5% subsidy
  - **Potash K2O 60%** – out-of-stock example (not shown to customers)

## Running the backend

```bash
cd server
npm install
npm run seed   # creates SQLite DB and seeds users/products
npm run dev    # starts Express API on http://localhost:4000
```

Key REST endpoints (all JSON):

- Auth:
  - `POST /api/auth/register` – `{ name, email, password }`
  - `POST /api/auth/login` – `{ email, password }`
  - `GET /api/auth/me` – current user (JWT)
- Products:
  - `GET /api/products?search=&type=&brand=&category=` – only in-stock by default
  - `GET /api/products/:id`
  - `POST /api/products` (admin)
  - `PUT /api/products/:id` (admin)
  - `DELETE /api/products/:id` (admin)
  - `GET /api/admin/inventory` (admin)
- Cart:
  - `GET /api/cart`
  - `POST /api/cart` – `{ productId, quantity }`
  - `PUT /api/cart/:itemId` – `{ quantity }`
  - `DELETE /api/cart/:itemId`
- Wishlist:
  - `GET /api/wishlist`
  - `POST /api/wishlist` – `{ productId }`
  - `DELETE /api/wishlist/:itemId`
- Orders:
  - `POST /api/orders` – places order from current cart, adjusts stock
  - `GET /api/orders` – customer’s order history
  - `GET /api/admin/orders` (admin) – all orders with items
- User settings:
  - `GET /api/users/me` – profile, addresses, payment methods
  - `PUT /api/users/me` – update name
  - `POST/PUT/DELETE /api/users/me/addresses[...]`
  - `POST/PUT/DELETE /api/users/me/payment-methods[...]`

All protected endpoints expect `Authorization: Bearer <jwt>` header.

## Running the frontend

```bash
cd client
npm install        # if not already done
npm run dev        # starts webpack dev server on http://localhost:5173
```

The dev server proxies `/api/*` calls to `http://localhost:4000`, so run backend and frontend together.

## Features overview

- **Product catalog**
  - Lists only products with `stock_quantity > 0`
  - Filters by text search, type, brand, category
  - Shows **original price**, **final price** after subsidy/discount, and badges for subsidy/discount
- **Authentication & roles**
  - Registration and login via JWT
  - Roles: `admin` and `customer`, enforced server-side
- **Shopping**
  - Cart with quantity editing and order placement
  - Wishlist with add/remove
  - Customer order history view
  - Admin global order list
- **Inventory management (admin)**
  - Create, update, delete products
  - Adjust stock, subsidies, and discounts
  - Inventory table with current stock levels
- **User settings**
  - Update display name
  - Manage multiple addresses (with default)
  - Manage payment methods (with default)

