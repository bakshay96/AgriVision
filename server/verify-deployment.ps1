# ============================================
# AgriVision Backend - Pre-Deployment Verification
# Comprehensive verification before deployment
# ============================================

Write-Host "🔍 AgriVision Backend - Pre-Deployment Verification" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

$allChecksPassed = $true

# Function to display messages
function Show-Success {
    param([string]$message)
    Write-Host "✅ $message" -ForegroundColor Green
}

function Show-Error {
    param([string]$message)
    Write-Host "❌ $message" -ForegroundColor Red
    $script:allChecksPassed = $false
}

function Show-Warning {
    param([string]$message)
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

function Show-Info {
    param([string]$message)
    Write-Host "ℹ️  $message" -ForegroundColor Blue
}

function Show-Step {
    param([string]$step, [string]$message)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
    Write-Host "CHECK $step`: $message" -ForegroundColor Magenta
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
    Write-Host ""
}

# Check 1: Node.js and npm versions
Show-Step "1" "Checking Node.js and npm"

try {
    $nodeVersion = node --version
    $nodeMajor = [int]($nodeVersion -replace 'v', '').Split('.')[0]
    
    if ($nodeMajor -ge 18) {
        Show-Success "Node.js version: $nodeVersion (✓ >= 18.0.0)"
    } else {
        Show-Error "Node.js version: $nodeVersion (✗ requires >= 18.0.0)"
    }
} catch {
    Show-Error "Node.js is not installed or not in PATH"
}

try {
    $npmVersion = npm --version
    Show-Success "npm version: v$npmVersion"
} catch {
    Show-Error "npm is not installed or not in PATH"
}

# Check 2: Project structure
Show-Step "2" "Verifying Project Structure"

$requiredFiles = @{
    "package.json" = "Package configuration"
    "tsconfig.json" = "TypeScript configuration"
    "render.yaml" = "Render deployment config"
    ".renderignore" = "Render ignore file"
    "src/app.ts" = "Main application file"
    "src/server.ts" = "Server entry point"
    "src/controllers/homeController.ts" = "Home route controller"
}

foreach ($file in $requiredFiles.Keys) {
    if (Test-Path $file) {
        Show-Success "$($requiredFiles[$file]): $file"
    } else {
        Show-Error "Missing: $($requiredFiles[$file]) ($file)"
    }
}

# Check 3: Dependencies
Show-Step "3" "Checking Dependencies"

if (Test-Path "node_modules") {
    Show-Success "node_modules directory exists"
    
    # Check critical dependencies
    $criticalDeps = @("express", "mongoose", "cors", "helmet", "dotenv")
    foreach ($dep in $criticalDeps) {
        $depPath = "node_modules\$dep"
        if (Test-Path $depPath) {
            Show-Success "Dependency installed: $dep"
        } else {
            Show-Error "Missing dependency: $dep (run npm install)"
        }
    }
} else {
    Show-Error "node_modules not found. Run: npm install"
}

# Check 4: TypeScript compilation
Show-Step "4" "Testing TypeScript Compilation"

if (Test-Path "dist") {
    Show-Info "dist folder exists from previous build"
    $buildAge = (Get-Date) - (Get-Item "dist").LastWriteTime
    
    if ($buildage.TotalMinutes -gt 60) {
        Show-Warning "Build is older than 1 hour. Consider rebuilding."
    } else {
        Show-Success "Recent build found ($([math]::Round($buildAge.TotalMinutes)) minutes ago)"
    }
} else {
    Show-Info "No dist folder found. A fresh build will be created during deployment."
}

# Test compilation without emitting
Show-Info "Testing TypeScript compilation..."
try {
    $compileResult = npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -eq 0) {
        Show-Success "TypeScript compilation successful (no errors)"
    } else {
        Show-Error "TypeScript compilation failed"
        Write-Host $compileResult -ForegroundColor Red
    }
} catch {
    Show-Error "TypeScript compilation check failed"
}

# Check 5: Environment variables
Show-Step "5" "Validating Environment Variables"

$envFile = ".env"
if (Test-Path $envFile) {
    Show-Success ".env file exists"
    
    # Load and check required variables
    $envContent = Get-Content $envFile
    $requiredVars = @("MONGO_URI", "JWT_SECRET", "GEMINI_API_KEY", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_S3_BUCKET_NAME")
    
    foreach ($var in $requiredVars) {
        if ($envContent -match "^$var=.+") {
            Show-Success "Environment variable set: $var"
        } else {
            Show-Error "Missing environment variable: $var"
        }
    }
} else {
    Show-Error ".env file not found"
}

# Check 6: Git repository
Show-Step "6" "Checking Git Repository"

if (Test-Path ".git") {
    Show-Success "Git repository initialized"
    
    try {
        $remoteUrl = git remote get-url origin 2>$null
        if ($remoteUrl) {
            Show-Success "Remote repository configured: $remoteUrl"
        } else {
            Show-Warning "No remote repository configured"
            Show-Info "Run .\setup-git.ps1 to set up Git"
        }
    } catch {
        Show-Warning "Remote repository not configured"
    }
    
    # Check for uncommitted changes
    $status = git status --porcelain
    if ($status) {
        Show-Warning "You have uncommitted changes"
        Show-Info "Run: git add . && git commit -m 'Your message'"
    } else {
        Show-Success "Working directory is clean"
    }
} else {
    Show-Warning "Git repository not initialized"
    Show-Info "Run .\setup-git.ps1 to initialize Git"
}

# Check 7: Configuration files
Show-Step "7" "Verifying Configuration Files"

# Check render.yaml
if (Test-Path "render.yaml") {
    $renderYaml = Get-Content "render.yaml" -Raw
    if ($renderYaml -match "buildCommand:" -and $renderYaml -match "startCommand:") {
        Show-Success "render.yaml is properly configured"
    } else {
        Show-Error "render.yaml is missing build or start commands"
    }
}

# Check package.json scripts
if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    
    if ($packageJson.scripts.build) {
        Show-Success "Build script defined: $($packageJson.scripts.build)"
    } else {
        Show-Error "Build script not found in package.json"
    }
    
    if ($packageJson.scripts.start) {
        Show-Success "Start script defined: $($packageJson.scripts.start)"
    } else {
        Show-Error "Start script not found in package.json"
    }
    
    if ($packageJson.engines) {
        Show-Success "Engine versions specified"
    } else {
        Show-Warning "No engine versions specified in package.json"
    }
}

# Check 8: Port configuration
Show-Step "8" "Checking Port Configuration"

$port = $env:PORT
if (-not $port) {
    # Try to get from .env file
    if (Test-Path ".env") {
        $envContent = Get-Content ".env"
        $portMatch = $envContent | Where-Object { $_ -match "^PORT=" }
        if ($portMatch) {
            $port = $portMatch.Split('=')[1]
        }
    }
}

if ($port -eq "10000") {
    Show-Success "PORT is set to 10000 (correct for Render)"
} elseif ($port) {
    Show-Warning "PORT is set to $port (Render will override to 10000)"
} else {
    Show-Info "PORT not set locally (Render will set it to 10000)"
}

# Check 9: Home route
Show-Step "9" "Verifying Home Route"

if (Test-Path "src/controllers/homeController.ts") {
    Show-Success "Home controller exists"
    
    $homeController = Get-Content "src/controllers/homeController.ts" -Raw
    if ($homeController -match "getHomeInfo") {
        Show-Success "Home route handler defined"
    } else {
        Show-Error "Home route handler not found"
    }
} else {
    Show-Error "Home controller file missing"
}

# Check app.ts includes home route
if (Test-Path "src/app.ts") {
    $appTs = Get-Content "src/app.ts" -Raw
    if ($appTs -match "homeController" -and $appTs -match "app.get\('/',") {
        Show-Success "Home route registered in app.ts"
    } else {
        Show-Error "Home route not registered in app.ts"
    }
}

# Final summary
Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Verification Summary" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($allChecksPassed) {
    Write-Host ""
    Show-Success "ALL CHECKS PASSED! ✅"
    Write-Host ""
    Write-Host "Your application is ready for deployment!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Review the checks above" -ForegroundColor White
    Write-Host "  2. Run: .\deploy-to-render.ps1" -ForegroundColor White
    Write-Host "  3. Deploy on Render dashboard" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Show-Error "SOME CHECKS FAILED ❌"
    Write-Host ""
    Write-Host "Please fix the errors above before deploying." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Cyan
    Write-Host "  • Run: npm install (if dependencies missing)" -ForegroundColor White
    Write-Host "  • Run: npm run build (if build needed)" -ForegroundColor White
    Write-Host "  • Check .env file (if env vars missing)" -ForegroundColor White
    Write-Host "  • Run: .\setup-git.ps1 (if Git not configured)" -ForegroundColor White
    Write-Host ""
}

Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
