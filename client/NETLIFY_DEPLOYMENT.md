# Netlify Deployment Guide for AgriVision Pro Frontend

## Prerequisites

1. **Netlify Account**: Sign up at https://www.netlify.com
2. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)
3. **Backend API URL**: Your backend server must be deployed and accessible

## Step-by-Step Deployment

### Step 1: Prepare Environment Variables

Create a `.env.production` file in the `client` directory (DO NOT commit this to Git):

```env
NEXT_PUBLIC_API_URL=https://your-backend-server.com/api
NEXT_PUBLIC_SOCKET_URL=https://your-backend-server.com
```

**Important**: Replace `https://your-backend-server.com` with your actual backend URL.

### Step 2: Configure Backend CORS

Make sure your backend allows requests from Netlify. In your backend's CORS configuration (`server/src/app.ts`), add your Netlify domain:

```typescript
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://your-netlify-site.netlify.app', // Add your Netlify domain
      process.env.CLIENT_URL
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
```

### Step 3: Deploy to Netlify

#### Option A: Deploy via Netlify Dashboard (Recommended)

1. **Login to Netlify**: https://app.netlify.com
2. **Click "Add new site"** → **"Import an existing project"**
3. **Connect to Git**: Choose GitHub/GitLab/Bitbucket
4. **Select Repository**: Choose your AgriVision Pro repository
5. **Configure Build Settings**:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
6. **Set Environment Variables**:
   - Click "Show advanced" → "New variable"
   - Add `NEXT_PUBLIC_API_URL` = `https://your-backend-server.com/api`
   - Add `NEXT_PUBLIC_SOCKET_URL` = `https://your-backend-server.com`
7. **Click "Deploy site"**

#### Option B: Deploy via Netlify CLI

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Initialize Netlify** (from client directory):
   ```bash
   cd client
   netlify init
   ```

4. **Set Environment Variables**:
   ```bash
   netlify env:set NEXT_PUBLIC_API_URL https://your-backend-server.com/api
   netlify env:set NEXT_PUBLIC_SOCKET_URL https://your-backend-server.com
   ```

5. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

### Step 4: Verify Deployment

1. **Check Build Logs**: Ensure no errors during build
2. **Test the Site**: Visit your Netlify URL (e.g., `https://agrivision-pro.netlify.app`)
3. **Verify API Connection**: Check browser console for any CORS errors
4. **Test Features**:
   - Login/Register
   - Crop scanning
   - Image uploads
   - Real-time updates (Socket.io)

## Important Configuration Files

### ✅ Already Created:
- `netlify.toml` - Netlify build configuration
- `next.config.ts` - Next.js configuration with S3 image domains

### 🔧 May Need Updates:

#### 1. Backend CORS Configuration
File: `server/src/app.ts`

Add your Netlify domain to the CORS origins:
```typescript
origin: [
  'http://localhost:3000',
  'https://your-site.netlify.app', // Your Netlify domain
  process.env.CLIENT_URL
],
```

#### 2. Socket.io Configuration
If using Socket.io, ensure your backend supports WebSocket connections from Netlify.

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API endpoint | `https://api.example.com/api` |
| `NEXT_PUBLIC_SOCKET_URL` | WebSocket server URL | `https://api.example.com` |

**Note**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Troubleshooting

### Issue: Build Fails
**Solution**:
- Check build logs in Netlify dashboard
- Ensure Node version is 18+ (configured in `netlify.toml`)
- Verify all dependencies are in `package.json`

### Issue: CORS Errors
**Solution**:
- Add your Netlify domain to backend CORS configuration
- Redeploy backend after updating CORS
- Clear browser cache

### Issue: Images Not Loading
**Solution**:
- Verify S3 bucket CORS is configured (see `S3_CORS_CONFIGURATION.md`)
- Check `next.config.ts` has `*.amazonaws.com` in remotePatterns
- Ensure presigned URLs are being generated correctly

### Issue: API Calls Fail
**Solution**:
- Verify `NEXT_PUBLIC_API_URL` is set correctly in Netlify
- Check backend is running and accessible
- Test API endpoint directly in browser

### Issue: WebSocket Connection Fails
**Solution**:
- Ensure backend supports WebSocket connections
- Verify `NEXT_PUBLIC_SOCKET_URL` is correct
- Check firewall/proxy settings on backend

## Post-Deployment Checklist

- [ ] Site loads without errors
- [ ] Login/Registration works
- [ ] API calls succeed (check Network tab)
- [ ] Images load correctly (including S3 images)
- [ ] Real-time features work (Socket.io)
- [ ] No CORS errors in console
- [ ] Mobile responsive design works
- [ ] All routes are accessible (no 404s)

## Custom Domain (Optional)

1. Go to **Site settings** → **Domain management**
2. Click **Add custom domain**
3. Enter your domain (e.g., `app.agrivision.com`)
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning (automatic)

## Continuous Deployment

Netlify automatically deploys when you push to your connected Git branch:
- **Production**: Push to `main` or `master` branch
- **Preview Deployments**: Push to any other branch creates a preview URL

## Monitoring & Analytics

1. **Build Logs**: Netlify dashboard → Deploys tab
2. **Function Logs**: If using Netlify Functions
3. **Analytics**: Enable Netlify Analytics in dashboard
4. **Error Tracking**: Consider integrating Sentry or similar

## Performance Optimization

The `netlify.toml` already includes:
- ✅ Static asset caching
- ✅ Image caching
- ✅ Security headers
- ✅ Next.js optimizations

Additional tips:
- Use Next.js Image component for automatic optimization
- Implement code splitting (automatic with Next.js)
- Minimize bundle size

## Support Resources

- **Netlify Docs**: https://docs.netlify.com
- **Next.js on Netlify**: https://docs.netlify.com/frameworks/next-js/overview/
- **Community Forum**: https://answers.netlify.com

---

**Need Help?**
- Check the troubleshooting section above
- Review Netlify build logs
- Verify environment variables are set correctly
- Ensure backend CORS includes your Netlify domain
