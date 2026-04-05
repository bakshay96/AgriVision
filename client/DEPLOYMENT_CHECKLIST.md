# 🚀 Quick Deployment Checklist - AgriVision Pro Frontend to Netlify

## Pre-Deployment (Do This First!)

### 1. Backend Configuration ✅
- [ ] Backend is deployed and accessible (Render/Railway/Heroku)
- [ ] Backend URL noted: `https://your-backend.com`
- [ ] Backend CORS updated to include Netlify domain (see below)

**Update Backend CORS** (`server/src/app.ts`):
```typescript
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://your-site.netlify.app', // ← Add your Netlify domain here
      process.env.CLIENT_URL || 'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
```

### 2. S3 Configuration ✅
- [ ] S3 bucket CORS configured (see `server/S3_CORS_CONFIGURATION.md`)
- [ ] AWS credentials working
- [ ] Images uploading successfully in local development

### 3. Git Repository ✅
- [ ] Code pushed to GitHub/GitLab/Bitbucket
- [ ] Latest changes committed
- [ ] No sensitive data in repository (.env files are gitignored)

## Environment Variables to Set in Netlify

Go to: **Netlify Dashboard** → **Site settings** → **Environment variables**

| Variable | Value | Example |
|----------|-------|---------|
| `NEXT_PUBLIC_API_URL` | Your backend API URL | `https://api.agrivision.com/api` |
| `NEXT_PUBLIC_SOCKET_URL` | Your backend WebSocket URL | `https://api.agrivision.com` |

⚠️ **Important**: These MUST be set in Netlify dashboard, NOT in code!

## Deployment Steps

### Option A: Via Netlify Dashboard (Easiest)

1. **Login**: https://app.netlify.com
2. **Add new site** → **Import existing project**
3. **Connect Git**: Choose your repository
4. **Configure**:
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `.next`
5. **Set environment variables** (see table above)
6. **Deploy!**

### Option B: Via Netlify CLI

```bash
# Install CLI
npm install -g netlify-cli

# Login
netlify login

# Navigate to client folder
cd client

# Initialize
netlify init

# Set environment variables
netlify env:set NEXT_PUBLIC_API_URL https://your-backend.com/api
netlify env:set NEXT_PUBLIC_SOCKET_URL https://your-backend.com

# Deploy
netlify deploy --prod
```

## Post-Deployment Verification

### Test These Features:
- [ ] Site loads without errors
- [ ] Login/Register works
- [ ] Dashboard displays correctly
- [ ] Crop scanning works
- [ ] Images upload and display (S3)
- [ ] Real-time updates work (Socket.io)
- [ ] No CORS errors in browser console
- [ ] Mobile responsive

### Check Browser Console:
```javascript
// Should see NO errors like:
// ❌ Access to fetch blocked by CORS policy
// ❌ Failed to load resource
// ❌ Mixed Content warnings
```

### Check Network Tab:
- [ ] API calls return 200 status
- [ ] Images load from S3 (amazonaws.com)
- [ ] WebSocket connection established

## Common Issues & Fixes

### ❌ Build Fails
**Fix**: Check Netlify build logs, ensure Node 18+ is used

### ❌ CORS Errors
**Fix**: Add Netlify domain to backend CORS, redeploy backend

### ❌ Images Not Loading
**Fix**: Verify S3 CORS configuration, check presigned URLs

### ❌ API Calls Fail
**Fix**: Verify environment variables in Netlify dashboard

### ❌ WebSocket Connection Fails
**Fix**: Ensure backend supports WS, check SOCKET_URL variable

## Files Created for Deployment

✅ `client/netlify.toml` - Netlify build config
✅ `client/NETLIFY_DEPLOYMENT.md` - Detailed guide
✅ `client/.gitignore` - Proper gitignore
✅ `client/DEPLOYMENT_CHECKLIST.md` - This file

## Next Steps After Successful Deployment

1. **Custom Domain** (Optional):
   - Go to Netlify → Site settings → Domain management
   - Add your custom domain
   - Configure DNS as instructed

2. **Enable Analytics** (Optional):
   - Netlify Analytics in dashboard
   - Or integrate Google Analytics

3. **Set Up Monitoring**:
   - Enable deploy notifications
   - Set up error tracking (Sentry, etc.)

4. **Continuous Deployment**:
   - Automatic on push to main branch
   - Preview deployments for PRs

## Support

- **Netlify Docs**: https://docs.netlify.com
- **Next.js on Netlify**: https://docs.netlify.com/frameworks/next-js/
- **Issues**: Check build logs first, then troubleshooting section

---

**Status Tracker:**
- [ ] Pre-deployment tasks completed
- [ ] Environment variables set
- [ ] First deployment successful
- [ ] All features tested
- [ ] No errors in console
- [ ] Ready for production! 🎉
