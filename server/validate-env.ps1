# ============================================
# AgriVision Backend - Environment Validation Script
# Validates all environment variables before deployment
# ============================================

Write-Host "🔍 AgriVision Backend - Environment Validation" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
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

function Show-Warning {
    param([string]$message)
    Write-Host "[WARNING] $message" -ForegroundColor Yellow
}

function Show-Info {
    param([string]$message)
    Write-Host "[INFO] $message" -ForegroundColor Blue
}

# Load environment variables from .env file
$envFile = ".env"
if (Test-Path $envFile) {
    Show-Info "Loading environment variables from $envFile..."
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Show-Success "Environment variables loaded!"
} else {
    Show-Warning ".env file not found. Checking system environment variables..."
}

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "  Validating Environment Variables" -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

# Define required variables and their validation
$requiredVars = @{
    "NODE_ENV" = @{
        required = $true
        pattern = "^(production|development|test)$"
        description = "Node environment"
    }
    "PORT" = @{
        required = $true
        pattern = "^\d+$"
        description = "Server port"
    }
    "MONGO_URI" = @{
        required = $true
        pattern = "^mongodb\+srv://"
        description = "MongoDB connection string"
    }
    "JWT_SECRET" = @{
        required = $true
        minLength = 32
        description = "JWT secret key"
    }
    "JWT_EXPIRES_IN" = @{
        required = $false
        pattern = "^\d+[dhms]$"
        description = "JWT expiration time"
    }
    "GEMINI_API_KEY" = @{
        required = $true
        pattern = "^AIza"
        description = "Google Gemini API key"
    }
    "AWS_ACCESS_KEY_ID" = @{
        required = $true
        pattern = "^AKIA"
        description = "AWS access key ID"
    }
    "AWS_SECRET_ACCESS_KEY" = @{
        required = $true
        minLength = 40
        description = "AWS secret access key"
    }
    "AWS_S3_BUCKET_NAME" = @{
        required = $true
        pattern = "^.+$"
        description = "AWS S3 bucket name"
    }
    "AWS_REGION" = @{
        required = $true
        pattern = "^[a-z]{2}-[a-z]+-\d+$"
        description = "AWS region"
    }
    "CLIENT_URL" = @{
        required = $true
        pattern = "^https?://"
        description = "Frontend client URL"
    }
    "RATE_LIMIT_WINDOW_MS" = @{
        required = $false
        pattern = "^\d+$"
        description = "Rate limit window in milliseconds"
    }
    "RATE_LIMIT_MAX" = @{
        required = $false
        pattern = "^\d+$"
        description = "Maximum requests per window"
    }
}

$validationErrors = @()
$validationWarnings = @()
$validatedCount = 0

foreach ($varName in $requiredVars.Keys) {
    $config = $requiredVars[$varName]
    $value = [Environment]::GetEnvironmentVariable($varName, "Process")
    
    Write-Host "Checking: $varName" -NoNewline
    
    # Check if variable exists
    if (-not $value) {
        if ($config.required) {
            Write-Host " - MISSING" -ForegroundColor Red
            $validationErrors += "$varName is required but not set"
        } else {
            Write-Host " - NOT SET (optional)" -ForegroundColor Yellow
            $validationWarnings += "$varName is not set (optional)"
        }
        continue
    }
    
    # Validate pattern if specified
    if ($config.pattern -and $value -notmatch $config.pattern) {
        Write-Host " - INVALID FORMAT" -ForegroundColor Red
        $validationErrors += "$varName has invalid format: $value"
        continue
    }
    
    # Validate minimum length if specified
    if ($config.minLength -and $value.Length -lt $config.minLength) {
        Write-Host " - TOO SHORT (min: $($config.minLength))" -ForegroundColor Red
        $validationErrors += "$varName is too short (minimum $($config.minLength) characters)"
        continue
    }
    
    # Mask sensitive values for display
    $displayValue = $value
    if ($varName -match "SECRET|KEY|PASSWORD|URI") {
        $displayValue = $value.Substring(0, [Math]::Min(8, $value.Length)) + "..."
    }
    
    Write-Host " - OK ($displayValue)" -ForegroundColor Green
    $validatedCount++
}

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "  Validation Summary" -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

Show-Info "Validated: $validatedCount variables"

if ($validationErrors.Count -gt 0) {
    Write-Host ""
    Show-Error "VALIDATION FAILED - $($validationErrors.Count) error(s) found:"
    Write-Host ""
    foreach ($error in $validationErrors) {
        Write-Host "  • $error" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please fix these errors before deploying." -ForegroundColor Yellow
    exit 1
}

if ($validationWarnings.Count -gt 0) {
    Write-Host ""
    Show-Warning "WARNINGS - $($validationWarnings.Count) warning(s):"
    Write-Host ""
    foreach ($warning in $validationWarnings) {
        Write-Host "  • $warning" -ForegroundColor Yellow
    }
}

Write-Host ""
Show-Success "All required environment variables are valid!"

# Additional checks
Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "  Additional Checks" -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

# Check if PORT is 10000 for Render
$port = [Environment]::GetEnvironmentVariable("PORT", "Process")
if ($port -ne "10000") {
    Show-Warning "PORT is set to $port, but Render requires PORT=10000"
    Show-Info "This will be overridden by render.yaml during deployment"
} else {
    Show-Success "PORT is correctly set to 10000 for Render"
}

# Check NODE_ENV
$nodeEnv = [Environment]::GetEnvironmentVariable("NODE_ENV", "Process")
if ($nodeEnv -eq "production") {
    Show-Success "NODE_ENV is set to production"
} else {
    Show-Warning "NODE_ENV is '$nodeEnv'. It will be set to 'production' on Render"
}

# Check CLIENT_URL
$clientUrl = [Environment]::GetEnvironmentVariable("CLIENT_URL", "Process")
if ($clientUrl -match "localhost") {
    Show-Warning "CLIENT_URL points to localhost. Remember to update this after frontend deployment!"
} else {
    Show-Success "CLIENT_URL is configured"
}

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ Environment Validation Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Your environment is ready for deployment!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run: .\setup-git.ps1 (if not done)" -ForegroundColor White
Write-Host "  2. Run: .\deploy-to-render.ps1" -ForegroundColor White
Write-Host ""
