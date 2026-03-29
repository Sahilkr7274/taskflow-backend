# Render Deployment — Already configured via render.yaml

# This backend is ready to deploy on Render.
# GitHub repo: https://github.com/Sahilkr7274/taskflow-backend
# Frontend URL: https://frontend-eight-gamma-24.vercel.app

## Steps to deploy on Render:
# 1. Go to https://render.com and sign in
# 2. Click "New" → "Web Service"
# 3. Connect GitHub → select "Sahilkr7274/taskflow-backend"
# 4. Settings:
#    - Name: taskflow-backend
#    - Branch: main
#    - Build Command: npm install
#    - Start Command: node server.js
# 5. Add Environment Variables:
#    DATABASE_URL = postgresql://postgres:Sahil%4072747274@db.zbecqhtlhihakteooqzs.supabase.co:5432/postgres
#    NODE_ENV     = production
#    FRONTEND_URL = https://frontend-eight-gamma-24.vercel.app
#    PORT         = 5001
# 6. Click "Create Web Service"
# 7. After deploy, open Render Shell and run: node src/config/seed.js
