# fix-packages.ps1 - Fix package lock sync issues

Write-Host "Fixing package lock synchronization..." -ForegroundColor Green

# Stop any running containers first
Write-Host "Stopping existing containers..." -ForegroundColor Blue
docker-compose -f docker-compose.dev.yml down 2>$null

# Remove existing node_modules and lock file
Write-Host "Cleaning up existing dependencies..." -ForegroundColor Blue
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "Removed node_modules" -ForegroundColor Yellow
}

if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
    Write-Host "Removed package-lock.json" -ForegroundColor Yellow
}

# Reinstall dependencies to create fresh lock file
Write-Host "Reinstalling dependencies..." -ForegroundColor Blue
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
    Write-Host "New package-lock.json created" -ForegroundColor Green
    
    # Clean Docker build cache
    Write-Host "Cleaning Docker build cache..." -ForegroundColor Blue
    docker builder prune -f
    
    Write-Host "Ready to build! Run: npm run docker:dev" -ForegroundColor Green
} else {
    Write-Host "Failed to install dependencies. Please check package.json" -ForegroundColor Red
    exit 1
}