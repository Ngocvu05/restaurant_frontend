# setup-windows.ps1 - Windows PowerShell setup script

Write-Host "Setting up Restaurant Frontend Development Environment..." -ForegroundColor Green

# Function to check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Create directories
Write-Host "Creating directories..." -ForegroundColor Blue
New-Item -ItemType Directory -Path "logs" -Force | Out-Null
New-Item -ItemType Directory -Path "logs/nginx" -Force | Out-Null

# Create network if doesn't exist
Write-Host "Creating Docker network..." -ForegroundColor Blue
try {
    docker network create microservices-network 2>$null
    Write-Host "Network 'microservices-network' created successfully" -ForegroundColor Green
} catch {
    Write-Host "Network 'microservices-network' already exists" -ForegroundColor Yellow
}

# Check if required files exist
$requiredFiles = @(
    "nginx.conf",
    "default.conf", 
    "healthcheck.sh",
    "docker-compose.yml",
    "Dockerfile.dev"
)

Write-Host "Checking required files..." -ForegroundColor Blue
$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (!(Test-Path $file)) {
        $missingFiles += $file
        Write-Host "Missing: $file" -ForegroundColor Red
    } else {
        Write-Host "Found: $file" -ForegroundColor Green
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "`nMissing files detected. Please create them first." -ForegroundColor Red
    Write-Host "Missing files: $($missingFiles -join ', ')" -ForegroundColor Red
    exit 1
}

# Make dev-scripts.sh executable (if on WSL/Git Bash)
if (Test-Path "dev-scripts.sh") {
    if (Get-Command "wsl" -ErrorAction SilentlyContinue) {
        wsl chmod +x dev-scripts.sh
        Write-Host "Made dev-scripts.sh executable via WSL" -ForegroundColor Green
    } elseif (Get-Command "bash" -ErrorAction SilentlyContinue) {
        bash -c "chmod +x dev-scripts.sh"
        Write-Host "Made dev-scripts.sh executable via bash" -ForegroundColor Green
    } else {
        Write-Host "Cannot make dev-scripts.sh executable. Please use WSL or Git Bash for full functionality." -ForegroundColor Yellow
    }
}

Write-Host "`nSetup completed successfully!" -ForegroundColor Green
Write-Host "You can now use the Windows development commands in package.json" -ForegroundColor Blue