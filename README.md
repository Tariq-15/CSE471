# Clothing Store E-Commerce Platform

A full-stack e-commerce platform for a clothing store with admin dashboard, customer frontend, and AI-powered features including virtual try-on and product recommendations.

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Frontend Applications](#frontend-applications)
- [Database Schema](#database-schema)
- [Deployment](#deployment)

## 🛠 Tech Stack

### Backend
- **Python 3.x** - Programming language
- **Flask 3.0.0** - Web framework
- **Flask-CORS 4.0.0** - Cross-origin resource sharing
- **Supabase 2.0.3** - Backend as a Service (Database, Authentication, Storage)
- **Google Gemini API** - AI for virtual try-on and recommendations
- **python-dotenv 1.0.0** - Environment variable management

### Frontend
- **Next.js 16** - React framework (Customer Frontend)
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite 6** - Build tool (Admin Dashboard)
- **Radix UI** - Component library
- **Supabase Client** - Database and auth client

### Database & Services
- **Supabase PostgreSQL** - Primary database
- **Supabase Storage** - Image storage
- **Google Gemini 2.5 Flash Image** - AI image generation

## 📁 Project Structure

```
CSE471/
├── app.py                      # Main Flask application (40 lines)
├── config.py                  # Configuration settings
├── requirements.txt            # Python dependencies
├── README.md                   # This file
│
├── routes/                     # Feature-based route modules
│   ├── __init__.py            # Blueprint exports
│   ├── products.py            # Product routes (14 endpoints)
│   ├── cart.py                # Shopping cart routes (4 endpoints)
│   ├── orders.py              # Order management routes (3 endpoints)
│   ├── user.py                # User profile routes (5 endpoints)
│   ├── admin.py               # Admin management routes (15+ endpoints)
│   ├── recommendations.py     # AI recommendation route (1 endpoint)
│   ├── virtual_try_on.py      # Virtual try-on routes (2 endpoints)
│   ├── upload.py              # Image upload routes (3 endpoints)
│   ├── size_charts.py         # Size chart management (7 endpoints)
│   └── test.py                # Test endpoint (1 endpoint)
│
├── utils/                      # Shared utilities
│   ├── __init__.py            # Utility exports
│   ├── supabase_client.py    # Supabase client initialization
│   └── image_utils.py         # Image processing utilities
│
├── frontend/                    # Customer-facing Next.js app
│   ├── app/                   # Next.js app directory
│   ├── components/            # React components
│   ├── lib/                   # Utilities and API clients
│   └── package.json           # Frontend dependencies
│
├── Admin/                       # Admin dashboard (Vite + React)
│   ├── src/                   # Source code
│   │   ├── components/       # React components
│   │   └── lib/              # API clients
│   └── package.json          # Admin dependencies
│
└── Backup/                     # Backup files (old versions, docs)
    ├── app_old_backup.py      # Original monolithic app.py
    └── *.md                   # Old documentation files
```

## ✨ Features

### Customer Features
- 🛍️ **Product Browsing** - Browse products with filters (category, price, color, tags)
- 🔍 **Product Search** - Real-time product search
- 🛒 **Shopping Cart** - Add, update, and remove items
- 📦 **Order Management** - Place orders and track order history
- 👤 **User Profiles** - Manage profile and addresses
- ❤️ **Wishlist** - Save favorite products
- 🎨 **Virtual Try-On** - AI-powered virtual try-on using Gemini
- 🤖 **AI Recommendations** - Personalized product recommendations
- ⭐ **Product Reviews** - View and submit product reviews
- 📏 **Size Charts** - Dynamic size chart system

### Admin Features
- 📊 **Dashboard** - Sales analytics, order statistics, low stock alerts
- 📦 **Product Management** - CRUD operations for products
- 📋 **Order Management** - View and update order status
- 👥 **Customer Management** - View customer details and statistics
- 🎫 **Discount Management** - Create and manage discount codes
- 📸 **Image Upload** - Upload single or multiple product images
- 📏 **Size Chart Builder** - Create and manage size chart templates
- 📈 **Analytics** - Sales charts, best-selling products, revenue tracking

## 🚀 Installation

### Prerequisites
- Python 3.8 or higher
- Node.js 18 or higher
- npm or pnpm
- Supabase account
- Google Gemini API key

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CSE471
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create `.env` file**
   ```bash
   # Copy example if available, or create new
   # Add the following variables:
   
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_IMAGE_API=your_gemini_api_key
   FLASK_DEBUG=True
   FLASK_PORT=1581
   ```

5. **Run the backend**
   ```bash
   python app.py
   ```
   
   Backend will run on `http://localhost:1581`

### Frontend Setup (Customer App)

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Create `.env.local` file**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_API_URL=http://localhost:1581
   ```

4. **Run development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```
   
   Frontend will run on `http://localhost:3000`

### Admin Dashboard Setup

1. **Navigate to Admin directory**
   ```bash
   cd Admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file**
   ```bash
   VITE_API_URL=http://localhost:1581
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   
   Admin dashboard will run on `http://localhost:5173`

## ⚙️ Configuration

### Environment Variables

**Backend (.env)**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
GEMINI_IMAGE_API=your_gemini_api_key
FLASK_DEBUG=True
FLASK_PORT=1581
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=http://localhost:1581
```

**Admin (.env)**
```env
VITE_API_URL=http://localhost:1581
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Default Configuration

The application uses default values in `config.py` if environment variables are not set:
- Supabase URL: `https://lcwwwlfzpiwovrhhmwib.supabase.co`
- Default Port: `1581`
- Gemini Model: `gemini-2.5-flash-image`

## 🏃 Running the Application

### Development Mode

**Terminal 1 - Backend**
```bash
python app.py
```

**Terminal 2 - Frontend**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Admin Dashboard**
```bash
cd Admin
npm run dev
```

### Production Mode

**Backend**
```bash
# Use a production WSGI server
gunicorn app:app -w 4 -b 0.0.0.0:1581
```

**Frontend**
```bash
cd frontend
npm run build
npm start
```

**Admin Dashboard**
```bash
cd Admin
npm run build
# Serve the dist folder with a static server
```

## 📡 API Documentation

### Base URL
```
http://localhost:1581/api
```

### Main Endpoints

#### Products
- `GET /api/products` - Get all products with filters
- `GET /api/products/filter` - Filter products with sorting
- `GET /api/products/<id>` - Get product details
- `GET /api/products/<id>/size-chart` - Get product size chart
- `GET /api/products/<id>/reviews` - Get product reviews
- `POST /api/products/<id>/reviews` - Add product review
- `GET /api/products/<id>/related` - Get related products
- `GET /api/products/new-arrivals` - Get new arrivals
- `GET /api/products/best-selling` - Get best sellers
- `GET /api/products/featured` - Get featured products
- `GET /api/products/categories` - Get all categories
- `GET /api/products/search?q=query` - Search products
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/<id>` - Update product (Admin)

#### Cart
- `GET /api/cart?session_id=xxx` - Get cart items
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/<id>` - Update cart item
- `DELETE /api/cart/<id>` - Remove cart item

#### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get all orders
- `GET /api/orders/<id>` - Get order details

#### User
- `GET /api/user/profile?user_id=xxx` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/addresses?user_id=xxx` - Get addresses
- `POST /api/user/addresses` - Add address
- `PUT /api/user/addresses/<id>` - Update address
- `DELETE /api/user/addresses/<id>` - Delete address
- `GET /api/user/orders?user_id=xxx` - Get user orders
- `GET /api/user/wishlist?user_id=xxx` - Get wishlist
- `POST /api/user/wishlist` - Add to wishlist
- `DELETE /api/user/wishlist?user_id=xxx&product_id=xxx` - Remove from wishlist

#### Admin
- `GET /api/admin/products` - Get all products (Admin)
- `POST /api/admin/products` - Create product (Admin)
- `GET /api/admin/products/<id>` - Get product details (Admin)
- `PUT /api/admin/products/<id>` - Update product (Admin)
- `DELETE /api/admin/products/<id>` - Delete product (Admin)
- `GET /api/admin/orders` - Get all orders (Admin)
- `GET /api/admin/orders/stats` - Get order statistics
- `PUT /api/admin/orders/<id>/status` - Update order status
- `GET /api/admin/customers` - Get all customers
- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/admin/dashboard/sales` - Get sales data
- `GET /api/admin/discounts` - Get all discounts
- `POST /api/admin/discounts` - Create discount

#### Virtual Try-On
- `POST /api/virtual-try-on` - Generate try-on image
- `POST /api/virtual-try-on/download` - Download try-on image

#### Recommendations
- `POST /api/recommendations` - Get AI recommendations

#### Upload
- `POST /api/admin/upload/image` - Upload single image
- `POST /api/admin/upload/images` - Upload multiple images
- `DELETE /api/admin/upload/delete` - Delete image

#### Size Charts
- `GET /api/admin/size-charts/templates` - Get all templates
- `POST /api/admin/size-charts/templates` - Create template
- `GET /api/admin/size-charts/templates/<id>` - Get template
- `PUT /api/admin/size-charts/templates/<id>` - Update template
- `DELETE /api/admin/size-charts/templates/<id>` - Delete template

## 🗄️ Database Schema

The application uses Supabase PostgreSQL. Key tables include:

- **products** - Product information
- **cart_items** - Shopping cart items
- **orders** - Order records
- **order_items** - Order line items
- **customers** - Customer information
- **user_profiles** - User profile data
- **user_addresses** - User shipping addresses
- **wishlist_items** - Wishlist entries
- **reviews** - Product reviews
- **discounts** - Discount codes
- **size_chart_templates** - Size chart templates
- **size_chart_rows** - Size chart rows
- **size_chart_columns** - Size chart columns
- **size_chart_values** - Size chart values
- **product_sizes** - Product size mappings
- **product_size_stock** - Size-specific stock

## 🚢 Deployment

### Backend Deployment

1. **Using Heroku**
   ```bash
   heroku create your-app-name
   heroku config:set SUPABASE_URL=your_url
   heroku config:set SUPABASE_ANON_KEY=your_key
   heroku config:set GEMINI_IMAGE_API=your_key
   git push heroku main
   ```

2. **Using Railway**
   - Connect GitHub repository
   - Set environment variables
   - Deploy automatically

3. **Using Docker**
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   COPY . .
   CMD ["gunicorn", "app:app", "-w", "4", "-b", "0.0.0.0:1581"]
   ```

### Frontend Deployment

1. **Vercel (Recommended for Next.js)**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Netlify**
   - Connect GitHub
   - Set build command: `npm run build`
   - Set publish directory: `.next`

### Admin Dashboard Deployment

1. **Vercel**
   ```bash
   cd Admin
   vercel
   ```

2. **Netlify**
   - Build command: `npm run build`
   - Publish directory: `dist`

## 🔧 Troubleshooting

### Common Issues

1. **Import Errors**
   - Ensure virtual environment is activated
   - Run `pip install -r requirements.txt` again

2. **Supabase Connection Issues**
   - Verify SUPABASE_URL and SUPABASE_ANON_KEY in .env
   - Check Supabase project status

3. **CORS Errors**
   - Ensure Flask-CORS is installed
   - Check CORS configuration in app.py

4. **Port Already in Use**
   - Change FLASK_PORT in .env
   - Or kill the process using port 1581

## 📝 Notes

- The application uses Flask Blueprints for modular route organization
- All routes are feature-based and located in the `routes/` directory
- Utilities are centralized in the `utils/` directory
- Configuration is managed through `config.py` and environment variables
- Backup files and old documentation are stored in the `Backup/` folder

## 📄 License

[Your License Here]

## 👥 Contributors

[Your Contributors Here]

---

**Last Updated**: 2024



