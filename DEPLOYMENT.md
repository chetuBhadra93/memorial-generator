# 🚀 Memorial Generator Deployment Guide

## Deployment Architecture
- **Backend**: Railway.app (free tier)
- **Frontend**: Vercel.com (free tier)
- **Database**: SQLite (included in backend)

## Backend Deployment (Railway)

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Deploy to Railway**:
   - Go to https://railway.app
   - Sign up/login with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select this repository
   - Railway will auto-detect the Node.js app

3. **Configure Environment Variables**:
   - In Railway dashboard, go to your project
   - Click "Variables" tab
   - Add: `GOOGLE_API_KEY=your_actual_api_key`
   - Add: `NODE_ENV=production`

4. **Set Root Directory**:
   - In Railway settings, set "Root Directory" to `backend`
   - Or use Railway's auto-detection

## Frontend Deployment (Vercel)

1. **Deploy to Vercel**:
   - Go to https://vercel.com
   - Sign up/login with GitHub  
   - Click "New Project"
   - Import this repository
   - Set "Root Directory" to `frontend/memorial-generator`

2. **Configure Build Settings**:
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`

3. **Environment Variables**:
   - Add: `REACT_APP_API_URL=https://your-railway-backend-url.railway.app`

## Quick Deploy Commands

### For Backend:
```bash
cd backend
npm install
npm start
```

### For Frontend:
```bash
cd frontend/memorial-generator
npm install
npm run build
```

## Environment Variables Needed

### Backend (.env):
```
GOOGLE_API_KEY=your_google_gemini_api_key
PORT=3001
NODE_ENV=production
```

### Frontend (.env):
```
REACT_APP_API_URL=https://your-backend-url.railway.app
```

## Testing the Deployment

1. Backend health check: `https://your-backend-url.railway.app/health`
2. Frontend: `https://your-frontend-url.vercel.app`

## Troubleshooting

- **CORS Issues**: Make sure your frontend URL is included in backend CORS config
- **API Key Issues**: Verify GOOGLE_API_KEY is correctly set in Railway
- **Build Failures**: Check Node.js version compatibility (>=18.0.0)