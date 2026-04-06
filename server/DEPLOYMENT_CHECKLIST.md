# ✅ AgriVision Backend - Render Deployment Checklist

## Pre-Deployment Verification

### ✅ Code & Configuration
- [x] Home route implemented (`/` endpoint)
- [x] Health check endpoint working (`/api/health`)
- [x] TypeScript compilation successful
- [x] `render.yaml` configuration created
- [x] `.renderignore` file created
- [x] `package.json` updated with engines and scripts
- [x] All API routes documented in home page

### ✅ Environment Variables Ready
All environment variables are configured and ready:

| Variable | Status | Value Source |
|----------|--------|--------------|
| NODE_ENV | ✅ Ready | `production` |
| PORT | ✅ Ready | `10000` |
| MONGO_URI | ✅ Ready | MongoDB Atlas |
| JWT_SECRET | ✅ Ready | Configured |
| JWT_EXPIRES_IN | ✅ Ready | `7d` |
| GEMINI_API_KEY | ✅ Ready | Google AI Studio |
| AWS_ACCESS_KEY_ID | ✅ Ready | AWS IAM |
| AWS_SECRET_ACCESS_KEY | ✅ Ready | AWS IAM |
| AWS_S3_BUCKET_NAME | ✅ Ready | AWS S3 |
| AWS_REGION | ✅ Ready | `ap-south-1` |
| CLIENT_URL | ⚠️ Update | Update after frontend deploy |
| RATE_LIMIT_WINDOW_MS | ✅ Ready | `900000` |
| RATE_LIMIT_MAX | ✅ Ready | `100` |

### ✅ External Services
- [x] MongoDB Atlas cluster accessible
- [x] AWS S3 bucket configured with CORS
- [x] Google Gemini API key active
- [x] Database connection tested locally

## Deployment Steps

### Step 1: Initialize Git Repository (if not done)
```bash
cd d:\MASAI\AgriVision\server
git init
git add .
git commit -m "Initial commit with Render deployment configuration"
```

### Step 2: Push to Remote Repository
```bash
# Add your GitHub/GitLab repository
git remote add origin https://github.com/yourusername/agrivision-backend.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Render

#### Option A: Manual Deployment via Dashboard
1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Connect your Git repository
4. Configure:
   - **Name**: `agrivision-backend`
   - **Region**: Oregon (or closest to users)
   - **Branch**: `main`
   - **Root Directory**: Leave blank or `AgriVision/server`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (testing) or Starter $7/mo (production)

5. Add Environment Variables (copy from `ENV_VARIABLES_RENDER.txt`):
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

6. Click **Create Web Service**
7. Wait for deployment to complete (5-10 minutes)

#### Option B: Blueprint Deployment (Automatic)
1. Go to https://dashboard.render.com
2. Click **New +** → **Blueprint**
3. Connect your repository
4. Render auto-detects `render.yaml`
5. Review configuration
6. Click **Apply**

### Step 4: Verify Deployment

After deployment completes, test these endpoints:

```bash
# 1. Home Page (API Documentation)
curl https://agrivision-backend.onrender.com/

# Expected: Beautiful HTML page with all API documentation

# 2. Health Check
curl https://agrivision-backend.onrender.com/api/health

# Expected: {"success":true,"message":"AgriVision Pro API is running",...}

# 3. Test Registration
curl -X POST https://agrivision-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test@123"}'

# Expected: User registration response with token
```

### Step 5: Update Frontend Configuration

Once backend is deployed, update your frontend:

```env
# In AgriVision/client/.env.local or .env.production
NEXT_PUBLIC_API_URL=https://agrivision-backend.onrender.com/api
```

Then update the backend's `CLIENT_URL` environment variable on Render:
```
CLIENT_URL=https://your-frontend-domain.com
```

## Post-Deployment Tasks

### Immediate Actions
- [ ] Test all API endpoints
- [ ] Verify database connectivity
- [ ] Test file upload functionality (S3)
- [ ] Test AI features (Gemini integration)
- [ ] Check CORS configuration with frontend
- [ ] Monitor logs for errors

### Security Enhancements
- [ ] Generate a new strong `JWT_SECRET` (don't use dev secret in production)
- [ ] Enable MongoDB Atlas IP whitelist restrictions
- [ ] Set up AWS S3 bucket policies
- [ ] Rotate API keys periodically
- [ ] Enable Render's automatic HTTPS (automatic)

### Monitoring Setup
- [ ] Bookmark Render dashboard logs
- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Configure error tracking (e.g., Sentry)
- [ ] Set up alerts for service downtime

## Troubleshooting Common Issues

### Issue: Build Fails
**Solution:**
```bash
# Check logs in Render dashboard
# Common fixes:
npm install           # Ensure all dependencies installed
npm run build         # Test build locally first
npx tsc --noEmit     # Check for TypeScript errors
```

### Issue: Service Won't Start
**Solution:**
- Verify `PORT=10000` is set
- Check all environment variables
- Review runtime logs in Render dashboard
- Ensure `npm start` command works locally

### Issue: CORS Errors
**Solution:**
- Update `CLIENT_URL` to match your frontend domain exactly
- Include protocol: `https://your-domain.com`
- Redeploy after changing environment variable

### Issue: Database Connection Failed
**Solution:**
- Verify `MONGO_URI` is correct
- Check MongoDB Atlas network access (allow all IPs: `0.0.0.0/0`)
- Ensure database user has read/write permissions
- Test connection string locally

### Issue: File Upload Fails
**Solution:**
- Verify AWS credentials are correct
- Check S3 bucket CORS configuration
- Ensure bucket exists and is accessible
- Review S3 service logs

### Issue: Cold Starts (Free Tier)
**Symptom:** First request takes 30-60 seconds
**Solution:** Upgrade to Starter plan ($7/month) for always-on service

## Success Criteria

Your deployment is successful when:
- ✅ Home page loads: `https://agrivision-backend.onrender.com/`
- ✅ Health check passes: `/api/health` returns 200
- ✅ User registration works
- ✅ Login/authentication works
- ✅ Crop management APIs work
- ✅ File uploads to S3 work
- ✅ AI analysis features work
- ✅ Frontend can connect without CORS errors
- ✅ All API endpoints documented on home page

## Useful Commands

```bash
# Test build locally
npm run build

# Check TypeScript errors
npx tsc --noEmit

# Start production server locally
npm start

# View Render logs (via dashboard)
# https://dashboard.render.com > Your Service > Logs

# Test endpoints
curl https://agrivision-backend.onrender.com/api/health
```

## Support Resources

- **Render Docs**: https://render.com/docs
- **Node.js on Render**: https://render.com/docs/node
- **Environment Variables**: https://render.com/docs/environment-variables
- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
- **AWS S3**: https://aws.amazon.com/s3/

## Next Steps After Deployment

1. **Monitor Performance**: Watch response times and error rates
2. **Set Up CI/CD**: Automate deployments on git push
3. **Add Custom Domain**: Configure custom domain in Render
4. **Enable Backups**: Set up MongoDB automated backups
5. **Scale Up**: Upgrade plan based on usage
6. **Add CDN**: Use Cloudflare for better performance
7. **Implement Logging**: Integrate structured logging service

---

**Status**: ✅ Ready to Deploy!

All configuration files are created and verified. Follow the steps above to deploy your AgriVision backend to Render.
