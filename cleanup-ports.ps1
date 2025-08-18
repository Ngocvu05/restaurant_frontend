# cleanup-ports.ps1 - Clean up Docker containers and check ports

Write-Host "Cleaning up Docker containers and checking ports..." -ForegroundColor Green

# Stop and remove all containers for this project
Write-Host "Stopping all project containers..." -ForegroundColor Blue
docker-compose -f docker-compose.dev.yml down --remove-orphans 2>$null
docker-compose -f docker-compose.yml down --remove-orphans 2>$null

# Remove any containers with the project name
Write-Host "Removing project containers..." -ForegroundColor Blue
$containers = docker ps -aq --filter "name=restaurant-frontend"
if ($containers) {
    docker rm -f $containers
    Write-Host "Removed containers: $($containers -join ', ')" -ForegroundColor Yellow
} else {
    Write-Host "No containers to remove" -ForegroundColor Green
}

# Check what's using the ports
Write-Host "`nChecking port usage..." -ForegroundColor Blue

# Function to check port
function Check-Port($port) {
    try {
        $connections = netstat -ano | Select-String ":$port\s"
        if ($connections) {
            Write-Host "Port $port is in use:" -ForegroundColor Red
            $connections | ForEach-Object {
                $line = $_.Line.Trim()
                $parts = $line -split '\s+'
                if ($parts.Length -ge 5) {
                    $pid = $parts[4]
                    try {
                        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                        if ($process) {
                            Write-Host "  PID $pid - $($process.ProcessName)" -ForegroundColor Yellow
                        } else {
                            Write-Host "  PID $pid - Unknown process" -ForegroundColor Yellow
                        }
                    } catch {
                        Write-Host "  PID $pid - Cannot get process info" -ForegroundColor Yellow
                    }
                }
            }
            return $true
        } else {
            Write-Host "Port $port is free" -ForegroundColor Green
            return $false
        }
    } catch {
        Write-Host "Error checking port $port" -ForegroundColor Red
        return $false
    }
}

# Check ports 3000, 3001, 80, 443
$portsInUse = @()
@(3000, 3001, 80, 443) | ForEach-Object {
    if (Check-Port $_) {
        $portsInUse += $_
    }
}

if ($portsInUse.Count -gt 0) {
    Write-Host "`nPorts in use: $($portsInUse -join ', ')" -ForegroundColor Red
    Write-Host "To kill processes using these ports, run:" -ForegroundColor Yellow
    $portsInUse | ForEach-Object {
        Write-Host "  netstat -ano | findstr :$_ | for /f `"tokens=5`" %a in ('more') do taskkill /PID %a /F" -ForegroundColor Cyan
    }
} else {
    Write-Host "`nAll required ports are free!" -ForegroundColor Green
}

# Clean Docker networks if needed
Write-Host "`nCleaning up Docker networks..." -ForegroundColor Blue
$networks = docker network ls --filter "name=microservices-network" --format "{{.ID}}"
if ($networks) {
    Write-Host "Network exists, that's good" -ForegroundColor Green
} else {
    Write-Host "Creating microservices-network..." -ForegroundColor Blue
    docker network create microservices-network
}

# Clean Docker build cache if needed
Write-Host "`nCleaning Docker build cache..." -ForegroundColor Blue
docker builder prune -f | Out-Null

Write-Host "`nCleanup completed! Try running docker:dev again." -ForegroundColor Green