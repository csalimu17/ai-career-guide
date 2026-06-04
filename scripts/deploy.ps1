# AI Career Guide - Manual Deployment Helper
# This script verifies the build and deploys rules/hosting to Firebase.

$ProjectID = "studio-3704831244-a5638"

Write-Host "Starting Manual Deployment for AI Career Guide..."

# 1. Quality Check & Build
Write-Host "Step 1: Running production build..."
npm.cmd run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed. Deployment aborted." -ForegroundColor Red
    exit $LASTEXITCODE
}

# 2. Deploy Rules & Rollout
Write-Host "Step 2: Deploying to Firebase ($ProjectID)..."
# Using the local firebase-tools version
.\node_modules\.bin\firebase.cmd deploy --project $ProjectID --non-interactive

if ($LASTEXITCODE -ne 0) {
    Write-Host "Deployment failed. Please ensure you are logged in by running 'firebase login' in your terminal." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Deployment Successful! Check your console for the new rollout." -ForegroundColor Green
Write-Host "URL: https://console.firebase.google.com/project/$ProjectID/apphosting/backends/studio/locations/us-central1/rollouts"
