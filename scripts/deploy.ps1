# Standardized deployment script for AI Career Guide
# This script verifies the build, deploys Firebase rules, and triggers a direct CLI rollout.
# Method: "Deployed from the Firebase CLI" (Manual rollout via local source upload)

function Log-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Log-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

Log-Info "Starting standardized deployment process..."

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

# 3. Direct App Hosting Rollout
# Note: This method result in "Deployed from the Firebase CLI" in the console history.
Log-Info "Triggering manual App Hosting rollout via CLI..."
npx -y firebase-tools deploy --only apphosting
if ($LASTEXITCODE -ne 0) {
    Log-Error "App Hosting rollout failed! Please check authentication or firebase.json configuration."
    exit 1
}

Log-Info "Standardized deployment completed successfully! Monitor the rollout at aicareerguide.uk."
