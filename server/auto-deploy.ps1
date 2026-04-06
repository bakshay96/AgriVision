# ============================================
# AgriVision Backend - Complete Automated Deployment
# Runs all checks and automates the entire deployment process
# ============================================

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   AgriVision Backend - Auto Deploy to Render  " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will automate your entire deployment process!" -ForegroundColor Yellow
Write-Host ""

# Function to pause and show progress
function Show-Pause {
    param([string]$message)
    Write-Host ""
    Write-Host "Press Enter to continue with: $message" -ForegroundColor Yellow
    Read-Host
}

# Function to run a script and check result
function Run-Script {
    param([string]$scriptPath, [string]$description)
    
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "  Running: $description" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    
    if (Test-Path $scriptPath) {
        & $scriptPath
        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "[ERROR] Script failed: $description" -ForegroundColor Red
            $continue = Read-Host "Continue anyway? (Y/N)"
            if ($continue -ne "Y" -and $continue -ne "y") {
                exit 1
            }
        }
    } else {
        Write-Host "[ERROR] Script not found: $scriptPath" -ForegroundColor Red
        exit 1
    }
}

# Menu for user to choose deployment mode
Write-Host "Choose deployment mode:" -ForegroundColor Cyan
Write-Host "  1. Full Automation (recommended) - runs all checks and prepares everything" -ForegroundColor White
Write-Host "  2. Quick Deploy - skip checks and go straight to deployment" -ForegroundColor White
Write-Host "  3. Run Specific Check - run individual verification scripts" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1/2/3)"

if ($choice -eq "1") {
    # Full Automation Mode
    Write-Host ""
    Write-Host "[STARTING] Full Automation Mode..." -ForegroundColor Green
    Write-Host ""
    
    # Step 1: Environment Validation
    Show-Pause "Environment Validation"
    Run-Script ".\validate-env.ps1" "Environment Validation"
    
    # Step 2: Pre-deployment Verification
    Show-Pause "Pre-Deployment Verification"
    Run-Script ".\verify-deployment.ps1" "Pre-Deployment Verification"
    
    # Step 3: Git Setup (if needed)
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "  Git Repository Setup" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    
    if (Test-Path ".git") {
        Write-Host "Git repository already exists." -ForegroundColor Green
        $setupGit = Read-Host "Re-run Git setup? (Y/N)"
        if ($setupGit -eq "Y" -or $setupGit -eq "y") {
            Run-Script ".\setup-git.ps1" "Git Setup"
        }
    } else {
        Show-Pause "Git Repository Setup"
        Run-Script ".\setup-git.ps1" "Git Setup"
    }
    
    # Step 4: Deploy to Render
    Show-Pause "Render Deployment Preparation"
    Run-Script ".\deploy-to-render.ps1" "Render Deployment"
    
    # Completion message
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "       AUTOMATION COMPLETE!                    " -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your code is ready for Render deployment!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Final steps on Render dashboard:" -ForegroundColor Yellow
    Write-Host "  1. Go to https://dashboard.render.com" -ForegroundColor White
    Write-Host "  2. Create new Web Service" -ForegroundColor White
    Write-Host "  3. Connect your repository" -ForegroundColor White
    Write-Host "  4. Add environment variables from ENV_VARIABLES_RENDER.txt" -ForegroundColor White
    Write-Host "  5. Click 'Create Web Service'" -ForegroundColor White
    Write-Host ""

} elseif ($choice -eq "2") {
    # Quick Deploy Mode
    Write-Host ""
    Write-Host "[STARTING] Quick Deploy Mode..." -ForegroundColor Green
    Write-Host ""
    Write-Host "Note: This skips validation checks. Use only if you're confident everything is ready." -ForegroundColor Yellow
    Write-Host ""
    
    $confirm = Read-Host "Continue with quick deploy? (Y/N)"
    if ($confirm -eq "Y" -or $confirm -eq "y") {
        Run-Script ".\deploy-to-render.ps1" "Quick Deploy"
    } else {
        Write-Host "Quick deploy cancelled." -ForegroundColor Yellow
    }

} elseif ($choice -eq "3") {
    # Run Specific Check
    Write-Host ""
    Write-Host "[INFO] Available verification scripts:" -ForegroundColor Cyan
    Write-Host "  1. validate-env.ps1 - Check environment variables" -ForegroundColor White
    Write-Host "  2. verify-deployment.ps1 - Full pre-deployment verification" -ForegroundColor White
    Write-Host "  3. setup-git.ps1 - Git repository setup" -ForegroundColor White
    Write-Host "  4. deploy-to-render.ps1 - Render deployment preparation" -ForegroundColor White
    Write-Host ""
    
    $scriptChoice = Read-Host "Enter script number (1-4)"
    
    if ($scriptChoice -eq "1") {
        Run-Script ".\validate-env.ps1" "Environment Validation"
    } elseif ($scriptChoice -eq "2") {
        Run-Script ".\verify-deployment.ps1" "Pre-Deployment Verification"
    } elseif ($scriptChoice -eq "3") {
        Run-Script ".\setup-git.ps1" "Git Setup"
    } elseif ($scriptChoice -eq "4") {
        Run-Script ".\deploy-to-render.ps1" "Render Deployment"
    } else {
        Write-Host "Invalid choice." -ForegroundColor Red
    }

} else {
    Write-Host "Invalid choice. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Thank you for using AgriVision Auto Deploy!" -ForegroundColor Green
Write-Host ""
