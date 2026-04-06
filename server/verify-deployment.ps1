# ============================================
# AgriVision Backend - Pre-Deployment Verification
# Comprehensive verification before deployment
# ============================================

$ErrorActionPreference = "Continue"

Write-Host "AgriVision Backend - Pre-Deployment Verification" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

$allChecksPassed = $true

# Function to display messages
function Show-Success {
    param([string]$message)
    Write-Host "[OK] $message" -ForegroundColor Green
}

function Show-Error {
    param([string]$message)
    Write-Host "[ERROR] $message" -ForegroundColor Red
    $script:allChecksPassed = $false
}

function Show-Warning {
    param([string]$message)
    Write-Host "[WAIT] $message" -ForegroundColor Yellow
}

function Show-Info {
    param([string]$message)
    Write-Host "[INFO] $message" -ForegroundColor Blue
}

function Show-Step {
    param([string]$step_num, [string]$message)
    Write-Host ""
    Write-Host "----------------------------------------" -ForegroundColor Magenta
    Write-Host "CHECK $step_num : $message" -ForegroundColor Magenta
    Write-Host "----------------------------------------" -ForegroundColor Magenta
    Write-Host ""
}

# Check 1: Node.js and npm versions
Show-Step "1" "Checking Node.js and npm"

try {
    $nodeVersion = node --version
    $nodeMajor = [int]($nodeVersion -replace 'v', '').Split('.')[0]
    
    if ($nodeMajor -ge 18) {
        Show-Success "Node.js version: $nodeVersion (Pass >= 18.0.0)"
    } else {
        Show-Error "Node.js version: $nodeVersion (Fail requires >= 18.0.0)"
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
    "src/app.ts" = "Main application file"
    "src/server.ts" = "Server entry point"
}

foreach ($item in $requiredFiles.GetEnumerator()) {
    if (Test-Path $item.Key) {
        Show-Success "$($item.Value): $($item.Key)"
    } else {
        Show-Error "Missing: $($item.Value) ($($item.Key))"
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
    $requiredVars = @("MONGO_URI", "JWT_SECRET", "GEMINI_API_KEY")
    
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

# Final summary
Write-Host ""
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "-------" -ForegroundColor Cyan
Write-Host ""

if ($allChecksPassed) {
    Show-Success "ALL CHECKS PASSED! Ready for deployment."
} else {
    Show-Error "SOME CHECKS FAILED. Fix issues above."
}

Write-Host ""
