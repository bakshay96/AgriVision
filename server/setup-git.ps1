# ============================================
# AgriVision Backend - Git Setup Automation
# Automates Git repository initialization and configuration
# ============================================

Write-Host "AgriVision Backend - Git Repository Setup" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Function to display messages
function Show-Success {
    param([string]$message)
    Write-Host "[OK] $message" -ForegroundColor Green
}

function Show-Error {
    param([string]$message)
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

function Show-Info {
    param([string]$message)
    Write-Host "[INFO] $message" -ForegroundColor Yellow
}

# Check if Git is installed
try {
    $gitVersion = git --version
    Show-Success "Git is installed: $gitVersion"
} catch {
    Show-Error "Git is not installed. Please install Git from https://git-scm.com/"
    exit 1
}

# Check if already in a Git repository
if (Test-Path ".git") {
    Show-Info "Git repository already exists"
    $reinit = Read-Host "Do you want to reinitialize? (Y/N)"
    if ($reinit -ne "Y" -and $reinit -ne "y") {
        Show-Info "Keeping existing Git repository"
    } else {
        Remove-Item -Recurse -Force .git
        Show-Success "Removed existing Git repository"
    }
}

# Initialize Git repository
if (-not (Test-Path ".git")) {
    Show-Info "Initializing new Git repository..."
    git init
    Show-Success "Git repository initialized!"
}

# Configure Git user
$currentEmail = git config user.email
$currentName = git config user.name

if (-not $currentEmail -or -not $currentName) {
    Write-Host ""
    Show-Info "Git user not configured. Let's set it up:"
    Write-Host ""
    
    if (-not $currentEmail) {
        $gitEmail = Read-Host "Enter your Git email"
        git config user.email $gitEmail
        Show-Success "Email configured: $gitEmail"
    }
    
    if (-not $currentName) {
        $gitName = Read-Host "Enter your Git name"
        git config user.name $gitName
        Show-Success "Name configured: $gitName"
    }
} else {
    Show-Success "Git user already configured: $currentName <$currentEmail>"
}

# Create or update .gitignore
$gitignoreContent = @"
# Dependencies
node_modules/

# Build output
dist/

# Environment files
.env
.env.local
.env.production

# Logs
logs/
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Uploads (optional - uncomment if you don't want to track uploads)
# uploads/

# Test coverage
coverage/

# Temporary files
tmp/
temp/
"@

if (Test-Path ".gitignore") {
    Show-Info ".gitignore already exists"
} else {
    Set-Content -Path ".gitignore" -Value $gitignoreContent
    Show-Success "Created .gitignore file"
}

# Add all files
Show-Info "Adding files to Git..."
git add .
Show-Success "All files staged!"

# Initial commit
Show-Info "Creating initial commit..."
$commitMessage = "Initial commit - AgriVision Backend ready for Render deployment"
git commit -m $commitMessage
Show-Success "Initial commit created!"

# Check for remote repository
$remoteExists = git remote get-url origin 2>$null
if ($remoteExists) {
    Show-Success "Remote repository already configured: $remoteExists"
} else {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "  Remote Repository Setup" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "You need to create a repository on GitHub/GitLab/Bitbucket first." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Quick steps:" -ForegroundColor White
    Write-Host "1. Go to https://github.com/new" -ForegroundColor Gray
    Write-Host "2. Create a new repository (name it 'agrivision-backend')" -ForegroundColor Gray
    Write-Host "3. Copy the repository URL" -ForegroundColor Gray
    Write-Host "4. Paste it below" -ForegroundColor Gray
    Write-Host ""
    
    $setupRemote = Read-Host "Do you want to set up remote now? (Y/N)"
    
    if ($setupRemote -eq "Y" -or $setupRemote -eq "y") {
        $repoUrl = Read-Host "Enter repository URL"
        
        if ($repoUrl) {
            git remote add origin $repoUrl
            Show-Success "Remote added: $repoUrl"
            
            # Push to remote
            Show-Info "Setting main branch..."
            git branch -M main
            
            Show-Info "Pushing to remote..."
            git push -u origin main
            Show-Success "Code pushed to remote repository!"
            
            Write-Host ""
            Show-Success "Git setup complete! Your code is now on GitHub/GitLab."
            Write-Host ""
            Write-Host "Next: Deploy to Render using deploy-to-render.ps1" -ForegroundColor Cyan
        } else {
            Show-Error "No repository URL provided."
            Write-Host ""
            Write-Host "To add remote later:" -ForegroundColor Yellow
            Write-Host "  git remote add origin <your-repo-url>" -ForegroundColor Gray
            Write-Host "  git push -u origin main" -ForegroundColor Gray
        }
    } else {
        Write-Host ""
        Show-Info "Skipping remote setup for now."
        Write-Host ""
        Write-Host "To add remote later:" -ForegroundColor Yellow
        Write-Host "  git remote add origin <your-repo-url>" -ForegroundColor Gray
        Write-Host "  git push -u origin main" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  Git Setup Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your repository is ready for deployment!" -ForegroundColor Cyan
Write-Host ""
