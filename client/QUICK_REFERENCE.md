# ⚡ Quick Reference - Netlify Deployment

## 🔑 Critical Steps (Don't Skip!)

### 1. Set Environment Variables in Netlify Dashboard
```
NEXT_PUBLIC_API_URL=https://your-backend.com/api
NEXT_PUBLIC_SOCKET_URL=https://your-backend.com
```

### 2. Update Backend CORS
Add your Netlify URL to `server/src/app.ts`:
```typescript
origin: ['https://your-site.netlify.app', ...]
```

### 3. Configure S3 Bucket CORS
See: `server/S3_CORS_CONFIGURATION.md`

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `netlify.toml` | Build configuration |
| `.gitignore` | Git exclusions |
| `.env.production.example` | Env template |
| `DEPLOYMENT_SUMMARY.md` | Complete overview |
| `DEPLOYMENT_CHECKLIST.md` | Step-by-step checklist |
| `NETLIFY_DEPLOYMENT.md` | Detailed guide |

---

## 🚀 Deploy in 3 Steps

1. **Push code to GitHub**
2. **Connect repo to Netlify** (base dir: `client`)
3. **Set env vars** in Netlify dashboard

---

## 🧪 Test Checklist

- [ ] Site loads
- [ ] Login works
- [ ] API calls succeed
- [ ] Images display
- [ ] No console errors

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| Build fails | Check logs, run build locally |
| CORS error | Add Netlify domain to backend |
| Images broken | Configure S3 CORS |
| API fails | Check env vars in Netlify |

---

## 📞 Support

- Build logs: Netlify dashboard
- Docs: `NETLIFY_DEPLOYMENT.md`
- Checklist: `DEPLOYMENT_CHECKLIST.md`

---

**Full Guide**: See `DEPLOYMENT_SUMMARY.md`
