# ⚡ Quick Reference - AgriVision Backend Deployment

## One-Command Deployment

```powershell
cd d:\MASAI\AgriVision\server && .\auto-deploy.ps1
```

---

## Script Quick Reference

| Command | What It Does |
|---------|--------------|
| `.\auto-deploy.ps1` | Full automation (recommended) |
| `.\validate-env.ps1` | Check environment variables |
| `.\verify-deployment.ps1` | Run all pre-deployment checks |
| `.\setup-git.ps1` | Initialize Git repository |
| `.\deploy-to-render.ps1` | Prepare for Render deployment |

---

## Environment Variables (Copy to Render)

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

Full list: `ENV_VARIABLES_RENDER.txt`

---

## Render Dashboard Steps

1. Go to: https://dashboard.render.com
2. Click: **New +** → **Web Service**
3. Connect: Your GitHub repository
4. Configure:
   - Build: `npm install && npm run build`
   - Start: `npm start`
   - Plan: Free or Starter ($7/mo)
5. Add: Environment variables (above)
6. Click: **Create Web Service**
7. Wait: 5-10 minutes

---

## Test Your Deployment

```bash
# Home page (API documentation)
curl https://your-app.onrender.com/

# Health check
curl https://your-app.onrender.com/api/health

# Test registration
curl -X POST https://your-app.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"Test@123"}'
```

---

## Common Issues & Fixes

### PowerShell Execution Policy
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Missing Dependencies
```powershell
npm install
npm run build
```

### Git Not Configured
```powershell
.\setup-git.ps1
```

### TypeScript Errors
```powershell
npx tsc --noEmit
```

---

## Documentation Quick Links

| Need | Read This |
|------|-----------|
| How to use scripts | `AUTOMATION_GUIDE.md` |
| Fast deployment | `QUICK_DEPLOY.md` |
| Complete guide | `RENDER_DEPLOYMENT.md` |
| Track progress | `DEPLOYMENT_CHECKLIST.md` |
| Overview | `DEPLOYMENT_COMPLETE.md` |

---

## After Deployment

1. ✅ Test: `https://your-app.onrender.com/`
2. ✅ Update: Frontend API URL
3. ✅ Monitor: Render dashboard logs
4. ✅ Consider: Upgrade to Starter plan

---

## Support

- Check Render logs in dashboard
- Review error messages in scripts
- Test locally: `npm run dev`
- Read troubleshooting in docs

---

**That's it!** Run `.\auto-deploy.ps1` and follow the prompts! 🚀
