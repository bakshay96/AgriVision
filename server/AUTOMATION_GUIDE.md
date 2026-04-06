# AgriVision Backend - Deployment Automation Guide

## Automated Deployment Scripts

We've created powerful automation scripts to streamline your Render deployment!

## Quick Start

### Option 1: Full Automation (Recommended)
Run the master automation script that handles everything:

```powershell
cd d:\MASAI\AgriVision\server
.\auto-deploy.ps1
```

This will:
- Validate all environment variables
- Run pre-deployment checks
- Set up Git repository (if needed)
- Prepare code for Render deployment
- Guide you through the final steps

### Option 2: Individual Scripts

You can run each script separately:

#### 1. Environment Validation
Checks if all required environment variables are set correctly:
```powershell
.\validate-env.ps1
```

#### 2. Pre-Deployment Verification
Comprehensive checks before deployment:
```powershell
.\verify-deployment.ps1
```

#### 3. Git Setup
Initialize and configure Git repository:
```powershell
.\setup-git.ps1
```

#### 4. Deploy to Render
Prepare and deploy to Render:
```powershell
.\deploy-to-render.ps1
```

## What Each Script Does

### auto-deploy.ps1 (Master Script)
- Interactive menu with 3 modes:
  - **Full Automation**: Runs all checks and prepares everything
  - **Quick Deploy**: Skips checks, goes straight to deployment
  - **Specific Check**: Run individual verification scripts
- Guides you through each step
- Shows progress and results

### validate-env.ps1
- Loads environment variables from `.env` file
- Validates all required variables:
  - NODE_ENV
  - PORT
  - MONGO_URI
  - JWT_SECRET
  - GEMINI_API_KEY
  - AWS credentials
  - CLIENT_URL
  - Rate limiting settings
- Checks variable formats and lengths
- Reports missing or invalid variables

### verify-deployment.ps1
Runs 9 comprehensive checks:
1. Node.js and npm versions
2. Project structure validation
3. Dependencies installation
4. TypeScript compilation
5. Environment variables
6. Git repository status
7. Configuration files
8. Port configuration
9. Home route verification

### setup-git.ps1
- Initializes Git repository
- Configures Git user (email & name)
- Creates `.gitignore` file
- Adds all files
- Creates initial commit
- Sets up remote repository (optional)
- Pushes to GitHub/GitLab

### deploy-to-render.ps1
- Checks prerequisites (Node, npm, Git)
- Validates project structure
- Installs dependencies
- Builds TypeScript project
- Initializes Git (if needed)
- Commits changes
- Sets up remote repository
- Provides deployment summary
- Shows next steps for Render dashboard

## Troubleshooting

### PowerShell Execution Policy
If you get an execution policy error:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Script Not Found
Make sure you're in the correct directory:
```powershell
cd d:\MASAI\AgriVision\server
```

### Permission Denied
Run PowerShell as Administrator, or:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\auto-deploy.ps1
```

## Manual Deployment (Alternative)

If you prefer manual deployment, follow these steps:

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Ready for deployment"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy on Render:**
   - Go to https://dashboard.render.com
   - Create new Web Service
   - Connect repository
   - Add environment variables (from `ENV_VARIABLES_RENDER.txt`)
   - Click "Create Web Service"

## Environment Variables

All required environment variables are documented in:
- `ENV_VARIABLES_RENDER.txt` - Copy-paste ready format
- `.env` - Your local development configuration

## After Deployment

1. Test your deployed API:
   ```
   https://your-app.onrender.com/
   https://your-app.onrender.com/api/health
   ```

2. Update frontend API URL

3. Monitor logs in Render dashboard

4. Consider upgrading to Starter plan ($7/mo) to avoid cold starts

## Support

For detailed deployment instructions, see:
- `QUICK_DEPLOY.md` - 5-minute quick start
- `RENDER_DEPLOYMENT.md` - Complete guide
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist

---

**Happy Deploying!** 🚀🌱
