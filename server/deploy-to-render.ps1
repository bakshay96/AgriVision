# ============================================
# AgriVision Backend - Automated Deployment Script
# This script automates the entire deployment process to Render
# ============================================

Write-Host "🚀 AgriVision Backend - Automated Deployment to Render" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Function to display success message
function Show-Success {
    param([string]$message)
    Write-Host "✅ $message" -ForegroundColor Green
}

# Function to display error message
function Show-Error {
    param([string]$message)
    Write-Host "❌ $message" -ForegroundColor Red
}

# Function to display info message
function Show-Info {
    param([string]$message)
    Write-Host "ℹ️  $message" -ForegroundColor Yellow
}

# Function to display step header
function Show-Step {
    param([string]$step, [string]$message)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
    Write-Host "STEP $step`: $message" -ForegroundColor Magenta
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
    Write-Host ""
}

# Step 0: Check prerequisites
Show-Step "0" "Checking Prerequisites"

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Show-Success "Node.js is installed: $nodeVersion"
} catch {
    Show-Error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Show-Success "npm is installed: v$npmVersion"
} catch {
    Show-Error "npm is not installed."
    exit 1
}

# Check if Git is installed
try {
    $gitVersion = git --version
    Show-Success "Git is installed: $gitVersion"
} catch {
    Show-Error "Git is not installed. Please install Git first."
    exit 1
}

# Step 1: Validate project structure
Show-Step "1" "Validating Project Structure"

$requiredFiles = @(
    "package.json",
    "tsconfig.json",
    "render.yaml",
    ".renderignore",
    "src/app.ts",
    "src/server.ts"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Show-Success "Found: $file"
    } else {
        Show-Error "Missing: $file"
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Show-Error "Project structure validation failed. Cannot proceed with deployment."
    exit 1
}

Show-Success "All required files are present!"

# Step 2: Install dependencies
Show-Step "2" "Installing Dependencies"

Show-Info "Running npm install..."
try {
    npm install
    Show-Success "Dependencies installed successfully!"
} catch {
    Show-Error "Failed to install dependencies."
    exit 1
}

# Step 3: Build TypeScript
Show-Step "3" "Building TypeScript Project"

Show-Info "Compiling TypeScript..."
try {
    npm run build
    Show-Success "TypeScript build completed successfully!"
} catch {
    Show-Error "TypeScript build failed. Please fix compilation errors."
    exit 1
}

# Verify dist folder exists
if (Test-Path "dist/server.js") {
    Show-Success "Build output verified: dist/server.js exists"
} else {
    Show-Error "Build output not found: dist/server.js"
    exit 1
}

# Step 4: Initialize Git repository
Show-Step "4" "Setting Up Git Repository"

if (-not (Test-Path ".git")) {
    Show-Info "Initializing Git repository..."
    try {
        git init
        Show-Success "Git repository initialized!"
    } catch {
        Show-Error "Failed to initialize Git repository."
        exit 1
    }
} else {
    Show-Success "Git repository already exists"
}

# Configure Git user if not configured
$currentEmail = git config user.email
if (-not $currentEmail) {
    Show-Info "Please enter your Git email:"
    $gitEmail = Read-Host "Email"
    git config user.email $gitEmail
    
    Show-Info "Please enter your Git name:"
    $gitName = Read-Host "Name"
    git config user.name $gitName
    Show-Success "Git user configured!"
}

# Step 5: Add all files and commit
Show-Step "5" "Committing Changes"

Show-Info "Adding files to Git..."
git add .

Show-Info "Creating commit..."
$commitMessage = "Deploy to Render - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
git commit -m $commitMessage
Show-Success "Changes committed!"

# Step 6: Check for remote repository
Show-Step "6" "Configuring Remote Repository"

$remoteExists = git remote get-url origin 2>$null
if ($remoteExists) {
    Show-Success "Remote repository already configured: $remoteExists"
} else {
    Show-Info "No remote repository configured."
    Write-Host ""
    Write-Host "Please create a repository on GitHub/GitLab/Bitbucket first." -ForegroundColor Yellow
    Write-Host "Then enter the repository URL below:" -ForegroundColor Yellow
    Write-Host ""
    $repoUrl = Read-Host "Repository URL (e.g., https://github.com/username/agrivision-backend.git)"
    
    if ($repoUrl) {
        git remote add origin $repoUrl
        Show-Success "Remote repository added: $repoUrl"
        
        Show-Info "Pushing to remote repository..."
        git branch -M main
        git push -u origin main
        Show-Success "Code pushed to remote repository!"
    } else {
        Show-Error "No repository URL provided. Cannot proceed with deployment."
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Create a repository on GitHub/GitLab" -ForegroundColor White
        Write-Host "2. Run: git remote add origin <your-repo-url>" -ForegroundColor White
        Write-Host "3. Run: git push -u origin main" -ForegroundColor White
        Write-Host "4. Then deploy on Render manually" -ForegroundColor White
        exit 0
    }
}

# Step 7: Generate deployment summary
Show-Step "7" "Generating Deployment Summary"

Write-Host ""
Write-Host "════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  🎉 DEPLOYMENT PREPARATION COMPLETE! 🎉" -ForegroundColor Green
Write-Host "════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "Your code is now ready for Render deployment!" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to Render Dashboard:" -ForegroundColor White
Write-Host "   👉 https://dashboard.render.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Create New Web Service:" -ForegroundColor White
Write-Host "   • Click 'New +' → 'Web Service'" -ForegroundColor Gray
Write-Host "   • Connect your Git repository" -ForegroundColor Gray
Write-Host "   • Select branch: main" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Configure Service:" -ForegroundColor White
Write-Host "   • Build Command: npm install && npm run build" -ForegroundColor Gray
Write-Host "   • Start Command: npm start" -ForegroundColor Gray
Write-Host "   • Plan: Free (or Starter for production)" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Add Environment Variables:" -ForegroundColor White
Write-Host "   Copy variables from: ENV_VARIABLES_RENDER.txt" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Deploy!" -ForegroundColor White
Write-Host "   Click 'Create Web Service' and wait 5-10 minutes" -ForegroundColor Gray
Write-Host ""

Write-Host "════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Display environment variables reminder
Write-Host "⚠️  IMPORTANT: Environment Variables Required" -ForegroundColor Yellow
Write-Host ""
Write-Host "You'll need to add these on Render:" -ForegroundColor White
Write-Host "  • NODE_ENV=production" -ForegroundColor Gray
Write-Host "  • PORT=10000" -ForegroundColor Gray
Write-Host "  • MONGO_URI=<your-mongodb-uri>" -ForegroundColor Gray
Write-Host "  • JWT_SECRET=<your-jwt-secret>" -ForegroundColor Gray
Write-Host "  • GEMINI_API_KEY=<your-gemini-key>" -ForegroundColor Gray
Write-Host "  • AWS_ACCESS_KEY_ID=<your-aws-key>" -ForegroundColor Gray
Write-Host "  • AWS_SECRET_ACCESS_KEY=<your-aws-secret>" -ForegroundColor Gray
Write-Host "  • AWS_S3_BUCKET_NAME=<your-bucket>" -ForegroundColor Gray
Write-Host "  • AWS_REGION=ap-south-1" -ForegroundColor Gray
Write-Host "  • CLIENT_URL=<your-frontend-url>" -ForegroundColor Gray
Write-Host ""
Write-Host "See ENV_VARIABLES_RENDER.txt for complete list" -ForegroundColor Cyan
Write-Host ""

# Offer to open documentation
Write-Host "Would you like to open the deployment guide? (Y/N)" -ForegroundColor Yellow
$openDocs = Read-Host
if ($openDocs -eq "Y" -or $openDocs -eq "y") {
    try {
        Invoke-Item "QUICK_DEPLOY.md"
        Show-Success "Opened QUICK_DEPLOY.md"
    } catch {
        Show-Info "You can manually open QUICK_DEPLOY.md for detailed instructions"
    }
}

Write-Host ""
Write-Host "Good luck with your deployment! 🚀🌱" -ForegroundColor Green
Write-Host ""
