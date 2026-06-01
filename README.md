# Ethara Inventory & Order Management System

A production-ready, containerized, full-stack Inventory & Order Management System. The project includes a React frontend, a FastAPI Python backend, and a PostgreSQL database. The entire stack is containerized using Docker and orchestrated with Docker Compose.

---

## Technical Stack

- **Frontend**: React (JS), Vite, Vanilla CSS with custom slate-dark/neon-accent styles, Lucide Icons.
- **Backend**: Python 3.11, FastAPI, SQLAlchemy ORM, Pydantic data validation.
- **Database**: PostgreSQL 15 (Alpine).
- **Containerization**: Docker, Docker Compose, Nginx (as reverse proxy).

---

## File Structure

```
Ethara Ai assessment/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI application & routers
│   │   ├── config.py        # Settings & environment variables loaders
│   │   ├── database.py      # SQLAlchemy connection & session pools
│   │   ├── models.py        # Database tables schemas (Products, Customers, Orders, Items)
│   │   ├── schemas.py       # Pydantic schemas for endpoint validation
│   │   └── crud.py          # Database operations & stock safety transactions
│   ├── tests/
│   │   └── verify_api.py    # Automated test suite
│   ├── Dockerfile           # Backend container build instructions
│   ├── .dockerignore
│   └── requirements.txt     # Python libraries list
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx  # Metrics summary and inventory alerts
│   │   │   ├── Products.jsx   # Product CRUD page
│   │   │   ├── Customers.jsx  # Customer list and registration
│   │   │   ├── Orders.jsx     # Order creation wizard and receipts view
│   │   │   └── Layout.jsx     # Sidebar shell structure
│   │   ├── App.jsx            # State management and API synchronizer
│   │   ├── index.css          # Slate dark mode/neon styling system
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js         # Proxy dev configuration
│   ├── nginx.conf             # Production Nginx reverse proxy configuration
│   ├── Dockerfile             # Multi-stage production container build
│   └── .dockerignore
├── docker-compose.yml         # Container orchestration
├── .env.example               # Config template
├── .env                       # Active runtime variables
└── README.md                  # System instruction sheet
```

---

## Getting Started

### Prerequisites

Make sure you have the following installed on your host machine:
- [Docker](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- [Git](https://git-scm.com/)

---

### Running the Application (Docker Compose)

1. Clone or download the repository into your workspace.
2. Navigate to the project root directory.
3. Build and launch all container services:
   ```bash
   docker compose up --build
   ```
4. Once the build completes and services start, open your browser and navigate to:
   - **React Frontend Application**: [http://localhost](http://localhost) (runs on default port 80)
   - **FastAPI Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **PostgreSQL Database Service**: Running on port `5432`

---

## Business Logic & API Validations

The backend enforces strict constraints:
- **SKU Uniqueness**: Creating or updating a product to a SKU that already exists returns `400 Bad Request`.
- **Email Uniqueness**: Registering a customer with an email address already in the database returns `400 Bad Request`.
- **Negative Stock Block**: Product quantities in stock must be non-negative (`quantity >= 0`). Price must be positive (`price > 0`).
- **Transactional Stock Deduction**: Placing an order containing multiple items will deduct stock from the database in a single ACID transaction. If any product has insufficient stock, the transaction is completely rolled back and a `400 Bad Request` explaining the issue is returned.
- **Stock Restoration**: Cancelling (deleting) an order automatically restores all purchased item quantities back to the products in stock.

---

## API Endpoints

### 1. Product Endpoints
- `POST /api/products` - Create a new product.
- `GET /api/products` - List all products.
- `GET /api/products/{id}` - Retrieve a product.
- `PUT /api/products/{id}` - Update product attributes.
- `DELETE /api/products/{id}` - Delete a product (cascades to order histories).

### 2. Customer Endpoints
- `POST /api/customers` - Register a customer.
- `GET /api/customers` - List customers.
- `GET /api/customers/{id}` - Retrieve customer profiles.
- `DELETE /api/customers/{id}` - Delete customer profiles (cascades to orders).

### 3. Order Endpoints
- `POST /api/orders` - Place an order (deducts stock).
- `GET /api/orders` - List all orders.
- `GET /api/orders/{id}` - View order invoice (includes items, prices, customer details).
- `DELETE /api/orders/{id}` - Cancel/refund an order (restores stock).

### 4. Dashboard Endpoints
- `GET /api/dashboard/summary` - Fetch dashboard KPIs (counters, low stock products).

---

## Running the Automated Test Suite

To verify backend constraints and transaction behaviors locally, you can run the test suite:

1. Setup a local virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/Scripts/activate # On Windows: venv\Scripts\activate
   pip install -r requirements.txt httpx pytest
   ```
2. Execute the verification tests:
   ```bash
   python tests/verify_api.py
   ```
   This will run unit tests for product lifecycles, duplicate validations, stock deductions, and refund restorations.

---

## Production Deployment Guide

### Backend Deployment (e.g. Render / Railway)
1. Link your GitHub repository.
2. Setup a **PostgreSQL Database** on Render or Railway.
3. Deploy the backend container (using the `backend/Dockerfile` subdirectory) or run as a Python service.
4. Set the Environment Variable:
   - `DATABASE_URL`: Set to the connection string of your PostgreSQL database (e.g. `postgresql://user:pass@host:5432/dbname`).
5. Expose port `8000`.

### Frontend Deployment (e.g. Vercel / Netlify)
1. Deploy the frontend folder.
2. In Vercel, configure a serverless rewrite or set the production environment variable `VITE_API_URL` to point to your live backend endpoint. Or build it statically and deploy.
