# standardize deployment script for AI Career Guide
# This script verifies the build, deploys Firebase rules, and optionally triggers a git-based rollout.

$PORTABLE_GIT_EXE = "C:\Users\csali\AppData\Local\OpenClaw\deps\portable-git\bin\git.exe"

function Log-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Log-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Resolve-GitExe {
    $gitCommand = Get-Command git -ErrorAction SilentlyContinue
    if ($gitCommand) {
        return $gitCommand.Source
    }

    if (Test-Path $PORTABLE_GIT_EXE) {
        return $PORTABLE_GIT_EXE
    }

    return $null
}

function Test-GitCheckout {
    param([string]$GitExe)

    if (-not $GitExe) {
        return $false
    }

    & $GitExe rev-parse --is-inside-work-tree 1>$null 2>$null
    return $LASTEXITCODE -eq 0
}

Log-Info "Starting deployment process..."

# 1. Verification Build
Log-Info "Running verification build..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Log-Error "Build failed! Aborting deployment."
    exit 1
}

# 2. Deploy Security Rules
Log-Info "Deploying Firebase Security Rules (Firestore & Storage)..."
npx -y firebase-tools deploy --only firestore,storage
if ($LASTEXITCODE -ne 0) {
    Log-Error "Security rules deployment failed!"
    exit 1
}

$gitExe = Resolve-GitExe
if (-not (Test-GitCheckout $gitExe)) {
    Log-Info "No git checkout detected. Skipping git rollout trigger and leaving the manual deployment flow untouched."
    Log-Info "Verification build and Firebase rules deployment completed successfully."
    exit 0
}

# 3. Git Push (Triggers App Hosting Rollout)
Log-Info "Pushing changes to Git to trigger App Hosting rollout..."
& $gitExe add .
& $gitExe commit -m "chore: deployment update via AI agent [$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')]"
if ($LASTEXITCODE -ne 0) {
    Log-Error "Git commit failed. Check for commit requirements or an unchanged working tree."
    exit 1
}

& $gitExe push origin main
if ($LASTEXITCODE -ne 0) {
    Log-Error "Git push failed! Please check authentication or remote configuration."
    exit 1
}

Log-Info "Deployment triggered successfully! Monitor the rollout at aicareerguide.uk."
