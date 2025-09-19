# Boutique POS Backend

A FastAPI backend for the Boutique POS system with CSV-based data storage.

## Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── models/              # Pydantic models
│   │   ├── __init__.py
│   │   ├── product.py
│   │   ├── customer.py
│   │   ├── sales.py
│   │   └── user.py
│   ├── api/                 # API endpoints
│   │   ├── __init__.py
│   │   ├── products.py
│   │   ├── customers.py
│   │   ├── sales.py
│   │   └── auth.py
│   ├── database/            # CSV database handlers
│   │   ├── __init__.py
│   │   ├── csv_handler.py
│   │   └── schemas.py
│   └── core/                # Core functionality
│       ├── __init__.py
│       ├── config.py
│       └── security.py
├── data/                    # CSV data files
│   ├── products.csv
│   ├── customers.csv
│   ├── sales.csv
│   └── users.csv
├── requirements.txt
└── run.py
```

## Installation

```bash
cd backend
pip install -r requirements.txt
python run.py
```

## API Endpoints

### Products
- GET /api/products - List all products
- POST /api/products - Create new product
- GET /api/products/{id} - Get product by ID
- PUT /api/products/{id} - Update product
- DELETE /api/products/{id} - Delete product

### Customers
- GET /api/customers - List all customers
- POST /api/customers - Create new customer
- GET /api/customers/{id} - Get customer by ID
- PUT /api/customers/{id} - Update customer

### Sales
- GET /api/sales - List all sales
- POST /api/sales - Create new sale
- GET /api/sales/analytics - Get sales analytics

### Auth
- POST /api/auth/login - User login
- GET /api/auth/me - Get current user