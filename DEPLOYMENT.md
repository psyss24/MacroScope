# MacroScope Deployment Guide

This guide covers how to deploy MacroScope both locally and to production.

## 🏗️ Architecture

- **Frontend**: React app deployed to GitHub Pages
- **Backend**: Flask API deployed to Railway
- **Development**: Both services run locally

## 🚀 Local Development

### Prerequisites
- Node.js (v16+)
- Python 3.8+
- npm/yarn

### Quick Start
```bash
# Start both backend and frontend
./restart_macroscope.sh

# Or start individually:
# Backend only
cd backend && python3 api/api_server.py

# Frontend only  
cd frontend && npm start
```

### Local URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api

## 🌐 Production Deployment

### Backend (Railway)

**Note**: Backend is deployed from a separate repository connected to Railway.

1. **Deploy from Backend Repository**:
   ```bash
   cd /path/to/backend-repository
   railway up
   ```

2. **Configure Environment Variables** (in Railway dashboard):
   - `FLASK_ENV=production`
   - `PORT=8080` (or as configured in Railway)

3. **Backend URL**:
   - `https://macroscope-backend-production.up.railway.app:8080`

### Frontend (GitHub Pages)

1. **Build and Deploy**:
   ```bash
   cd frontend
   npm run build
   npm run deploy
   ```

2. **Configure GitHub Pages**:
   - Go to repository Settings > Pages
   - Set source to "Deploy from a branch"
   - Select `gh-pages` branch

### Using the Deployment Script

```bash
# Deploy everything
./deploy.sh all

# Deploy only backend
./deploy.sh backend

# Deploy only frontend  
./deploy.sh frontend

# Check deployment status
./deploy.sh status
```

## 🔧 Configuration

### Environment-Specific Settings

The app automatically detects the environment:

- **Development**: Uses `http://localhost:8000/api`
- **Production**: Uses `https://macroscope-backend-production.up.railway.app:8080/api`

### CORS Configuration

The backend allows requests from:
- `https://saadsaqib.dev`
- `https://www.saadsaqib.dev` 
- `https://psyss24.github.io`
- `http://localhost:3000` (development)
- `http://localhost:3001` (development)

## 📊 Monitoring

### Health Checks
- **Backend**: `https://macroscope-backend-production.up.railway.app:8080/api/health`
- **Frontend**: `https://saadsaqib.dev/macroscope`

### Railway Monitoring
- Check Railway dashboard for logs and metrics
- Set up alerts for downtime

## 🔄 Development Workflow

1. **Local Development**:
   ```bash
   ./restart_macroscope.sh
   # Make changes
   # Test locally
   ```

2. **Deploy Backend**:
   ```bash
   ./deploy.sh backend
   ```

3. **Deploy Frontend**:
   ```bash
   ./deploy.sh frontend
   ```

4. **Verify Deployment**:
   ```bash
   ./deploy.sh status
   ```

## 🐛 Troubleshooting

### Backend Issues
- Check Railway logs: `railway logs`
- Verify environment variables in Railway dashboard
- Test health endpoint: `curl https://macroscope-backend-production.up.railway.app:8080/api/health`

### Frontend Issues
- Check build output: `npm run build`
- Verify GitHub Pages deployment in repository settings
- Check browser console for API errors

### CORS Issues
- Verify backend CORS settings in `backend/api/api_server.py`
- Check that your frontend domain is in the allowed origins list

## 📝 Environment Variables

### Backend (Railway)
- `FLASK_ENV=production`
- `PORT=8000` (auto-set)

### Frontend (Build-time)
- `REACT_APP_API_BASE_URL` (auto-detected)
- `NODE_ENV=production` (auto-set)

## 🔗 URLs

- **Production Frontend**: https://saadsaqib.dev/macroscope
- **Production Backend**: https://macroscope-backend-production.up.railway.app:8080
- **Local Development**: http://localhost:3000
- **Local API**: http://localhost:8000 