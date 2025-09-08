# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Product Image Search Engine** - an AI-powered e-commerce system that combines image search capabilities with order management functionality. The system enables users to search for products using images and manage customers, orders, and inventory.

## Architecture

### Backend (Flask + Python)
- **Framework**: Flask with SQLAlchemy ORM
- **Database**: MySQL (production) / SQLite (testing)
- **AI Components**: 
  - DashScope API for image embeddings (1024-dim vectors)
  - FAISS vector search for similarity matching
  - OpenAI/DeepSeek APIs for additional AI features
- **File Storage**: Aliyun OSS + local uploads
- **Structure**: 
  - `app.py` - Main Flask application factory
  - `blueprints/` - API endpoints (products, orders, customers, oss, product_search)
  - `models/` - SQLAlchemy models (Product, Order, Customer, BalanceTransaction)
  - `product_search.py` - Core vector search functionality
  - `services/` - Business logic services

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Ant Design + Tailwind CSS
- **Key Components**:
  - `ProductSearch.tsx` - Image-based product search
  - `ProductUpload.tsx` - Bulk product import via CSV
  - `OrderManagement.tsx` - Order CRUD operations
  - `CustomerManagement.tsx` - Customer management with pinyin search
  - `ProductDetails.tsx` - Product detail views

## Common Development Commands

### Backend
```bash
# Development server
cd backend
python app.py

# Run tests
python -m pytest test/
python test/test.py  # OSS connection test

# Database setup
python init_db.py
python migrate_db.py

# Code quality
black .          # Format code
flake8 .         # Lint code
mypy .           # Type check
```

### Frontend
```bash
# Development server
cd frontend
npm run dev      # Starts on localhost:5173

# Build and deploy
npm run build    # TypeScript compile + Vite build
npm run lint     # ESLint
npm run preview  # Preview production build
```

### Docker Development
```bash
# Full stack development
docker-compose up --build

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

## Key Environment Variables

Required for backend operation:
- `DASHSCOPE_API_KEY` - Aliyun DashScope API for image embeddings
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - MySQL connection
- `OSS_ACCESS_KEY_ID`, `OSS_ACCESS_KEY_SECRET`, `OSS_ENDPOINT`, `OSS_BUCKET_NAME` - Aliyun OSS
- `OPENAI_API_KEY`, `DEEPSEEK_API_KEY` - Optional AI APIs

## Database Schema

Core entities:
- **Product** - Basic product info with image paths
- **ProductImage** - Product images with vector embeddings
- **Customer** - Customer info with pinyin search support
- **Order** - Orders linking customers and products
- **BalanceTransaction** - Customer balance/payment tracking

## AI/ML Pipeline

1. **Image Upload** → DashScope embedding → FAISS index storage
2. **Image Search** → Query embedding → FAISS similarity search → Product results
3. **Vector Management** → Automatic index rebuilding on product changes

## Testing

- Backend tests in `backend/test/` using pytest
- Test database uses SQLite in-memory
- OSS connection testing via `test/test.py`
- No frontend tests currently configured

## Development Notes

- Chinese/pinyin search supported for customers using `pypinyin` library
- Image processing handles multiple formats (jpg, png, webp, etc.)
- CORS configured for localhost:5173 development
- File uploads stored in `backend/uploads/` with size limits (16MB)
- Vector indexes stored in `backend/data/product_search/`
- Production uses Gunicorn + Nginx for deployment
