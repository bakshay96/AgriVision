# 🚀 Quick Start - Deploy AgriVision Backend to Render

## ⚡ Fastest Way to Deploy (5 Minutes)

### Step 1: Push Code to GitHub
```bash
cd d:\MASAI\AgriVision\server
git init
git add .
git commit -m "Ready for Render deployment"
git remote add origin https://github.com/YOUR_USERNAME/agrivision-backend.git
git push -u origin main
```

### Step 2: Deploy on Render
1. Go to: https://render.com
2. Sign up/Login
3. Click **New +** → **Web Service**
4. Connect your GitHub repository
5. Fill in:
   - **Name**: `agrivision-backend`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Step 3: Add Environment Variables
Copy and paste these into Render's Environment tab:

```
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://akshaymaliedu_db_user:akshay@cluster0.o9hauwk.mongodb.net/agrivision_pro?appName=agri_vision_pro&retryWrites=true&w=majority
JWT_SECRET=agrivision_dev_secret_key_2026_change_in_production
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=AIzaSyDVuyWGLmUkmlExGpkcDq7st8dJcQFsaPU
AWS_ACCESS_KEY_ID=AKIAQTTVYSGOXLSWJXKT
AWS_SECRET_ACCESS_KEY=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
AWS_S3_BUCKET_NAME=agrivision-uploads-042122908061-ap-south-1-an
AWS_REGION=ap-south-1
CLIENT_URL=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Step 4: Click "Create Web Service"
Wait 5-10 minutes for deployment. Done! ✅

### Step 5: Test Your Deployment
Visit: `https://agrivision-backend.onrender.com/`

You should see the beautiful API documentation page!

---

## 📋 What's Already Configured

✅ TypeScript compilation  
✅ Home route with full API documentation  
✅ Health check endpoint  
✅ All environment variables documented  
✅ Build and start scripts  
✅ CORS configuration  
✅ Rate limiting  
✅ AWS S3 integration  
✅ MongoDB connection  
✅ Google Gemini AI integration  

## 🔗 After Deployment

1. **Test API**: Visit `https://your-app.onrender.com/api/health`
2. **Update Frontend**: Change API URL in frontend `.env` file
3. **Monitor Logs**: Check Render dashboard for any issues
4. **Upgrade Plan**: Consider Starter plan ($7/mo) to avoid cold starts

## 📚 Full Documentation

For detailed instructions, see:
- [`RENDER_DEPLOYMENT.md`](./RENDER_DEPLOYMENT.md) - Complete deployment guide
- [`DEPLOYMENT_CHECKLIST.md`](./DEPLOYMENT_CHECKLIST.md) - Step-by-step checklist
- [`ENV_VARIABLES_RENDER.txt`](./ENV_VARIABLES_RENDER.txt) - All environment variables

## 🆘 Need Help?

Common issues and solutions are in [`RENDER_DEPLOYMENT.md`](./RENDER_DEPLOYMENT.md) under "Troubleshooting" section.

---

**That's it!** Your AgriVision backend will be live and accessible worldwide! 🌍🌱
