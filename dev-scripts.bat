@echo off
REM dev-scripts.bat - Improved Windows development helper

setlocal enabledelayedexpansion

set "COMPOSE_FILE=docker-compose.yml"
set "PROJECT_NAME=restaurant-frontend"

REM Colors for output
set "COLOR_RED=[91m"
set "COLOR_GREEN=[92m"
set "COLOR_YELLOW=[93m"
set "COLOR_BLUE=[94m"
set "COLOR_RESET=[0m"

if "%1"=="" (
    call :show_usage
    exit /b 1
)

if "%1"=="start" call :dev_start
if "%1"=="stop" call :dev_stop
if "%1"=="restart" call :dev_restart
if "%1"=="logs" call :dev_logs %2
if "%1"=="status" call :dev_status
if "%1"=="clean" call :dev_clean
if "%1"=="test" call :dev_test
if "%1"=="exec" call :dev_exec %2 %3 %4 %5
if "%1"=="nginx-test" call :dev_nginx_test
if "%1"=="nginx-reload" call :dev_nginx_reload
if "%1"=="help" call :show_usage

exit /b 0

:print_status
echo %COLOR_BLUE%[INFO]%COLOR_RESET% %~1
exit /b

:print_success
echo %COLOR_GREEN%[SUCCESS]%COLOR_RESET% %~1
exit /b

:print_warning
echo %COLOR_YELLOW%[WARNING]%COLOR_RESET% %~1
exit /b

:print_error
echo %COLOR_RED%[ERROR]%COLOR_RESET% %~1
exit /b

:create_network
call :print_status "Checking microservices network..."
docker network inspect microservices-network >nul 2>&1
if errorlevel 1 (
    call :print_status "Creating microservices-network..."
    docker network create microservices-network
    if errorlevel 1 (
        call :print_error "Failed to create network"
        exit /b 1
    )
    call :print_success "Network created successfully"
) else (
    call :print_success "Network already exists"
)
exit /b

:check_port
call :print_status "Checking if port 3000 is available..."
netstat -ano | findstr :3000 >nul 2>&1
if not errorlevel 1 (
    call :print_warning "Port 3000 is in use. Attempting to find processes..."
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
        call :print_warning "Process using port 3000: %%a"
        call :print_status "You may need to stop this process manually"
    )
    set /p continue="Continue anyway? (y/N): "
    if /i not "!continue!"=="y" (
        call :print_status "Startup cancelled"
        exit /b 1
    )
)
exit /b

:dev_start
call :print_status "Starting frontend development environment..."
call :create_network
if errorlevel 1 exit /b 1

call :check_port

REM Create logs directory if not exists
if not exist "logs" mkdir logs
if not exist "logs\nginx" mkdir logs\nginx

REM Stop any existing containers with same name
call :print_status "Stopping any existing containers..."
docker-compose -f %COMPOSE_FILE% down >nul 2>&1

REM Build and start
call :print_status "Building and starting containers..."
docker-compose -f %COMPOSE_FILE% up --build -d
if errorlevel 1 (
    call :print_error "Failed to start development environment"
    call :print_status "Check logs with: dev-scripts.bat logs"
    exit /b 1
)

REM Wait a moment for services to start
timeout /t 3 /nobreak >nul

REM Test the services
call :dev_test

call :print_success "Frontend development environment started!"
echo.
call :print_status "Available services:"
call :print_status "  Frontend: http://localhost:3000"
call :print_status "  Health:   http://localhost:3000/health" 
call :print_status "  Debug:    http://localhost:3000/debug"
echo.
call :print_status "Useful commands:"
call :print_status "  Logs:     dev-scripts.bat logs"
call :print_status "  Status:   dev-scripts.bat status"
call :print_status "  Stop:     dev-scripts.bat stop"
exit /b

:dev_stop
call :print_status "Stopping development environment..."
docker-compose -f %COMPOSE_FILE% down
call :print_success "Development environment stopped"
exit /b

:dev_restart
call :print_status "Restarting development environment..."
call :dev_stop
timeout /t 2 /nobreak >nul
call :dev_start
exit /b

:dev_logs
if "%~1"=="" (
    docker-compose -f %COMPOSE_FILE% logs -f --tail=100
) else (
    docker-compose -f %COMPOSE_FILE% logs -f --tail=100 %~1
)
exit /b

:dev_status
call :print_status "Development environment status:"
docker-compose -f %COMPOSE_FILE% ps
echo.
call :dev_test
exit /b

:dev_test
call :print_status "Testing services..."

REM Test frontend health
curl -f -s --connect-timeout 5 http://localhost:3000/health >nul 2>&1
if errorlevel 1 (
    call :print_error "Frontend health check: FAILED"
    call :print_status "Container may still be starting. Check logs with: dev-scripts.bat logs"
) else (
    call :print_success "Frontend health check: OK"
)

REM Test debug endpoint
curl -f -s --connect-timeout 5 http://localhost:3000/debug >nul 2>&1
if errorlevel 1 (
    call :print_warning "Frontend debug endpoint: FAILED"
) else (
    call :print_success "Frontend debug endpoint: OK"
)

REM Test main page
curl -f -s --connect-timeout 5 http://localhost:3000/ >nul 2>&1
if errorlevel 1 (
    call :print_warning "Frontend main page: FAILED"
) else (
    call :print_success "Frontend main page: OK"
)
exit /b

:dev_clean
set /p confirm="This will remove all containers, images, and volumes. Are you sure? (y/N): "
if /i "%confirm%"=="y" (
    call :print_status "Cleaning up development environment..."
    docker-compose -f %COMPOSE_FILE% down -v --rmi all --remove-orphans
    docker system prune -f
    call :print_success "Cleanup completed"
) else (
    call :print_status "Cleanup cancelled"
)
exit /b

:dev_exec
if "%~1"=="" (
    call :print_error "Please provide a command to execute"
    echo Usage: dev-scripts.bat exec ^<command^>
    echo Example: dev-scripts.bat exec bash
    exit /b 1
)
docker-compose -f %COMPOSE_FILE% exec frontend %*
exit /b

:dev_nginx_test
call :print_status "Testing nginx configuration..."
docker-compose -f %COMPOSE_FILE% exec frontend nginx -t
exit /b

:dev_nginx_reload
call :print_status "Reloading nginx configuration..."
docker-compose -f %COMPOSE_FILE% exec frontend nginx -s reload
if errorlevel 1 (
    call :print_error "Failed to reload nginx configuration"
) else (
    call :print_success "Nginx configuration reloaded"
)
exit /b

:show_usage
echo.
echo Restaurant Frontend Development Helper
echo =====================================
echo.
echo Usage: dev-scripts.bat ^<command^>
echo.
echo Commands:
echo   start           Start the frontend development environment
echo   stop            Stop the development environment  
echo   restart         Restart the development environment
echo   logs [service]  View logs (all services or specific service)
echo   status          Check service status and run tests
echo   test            Test all service endpoints
echo   clean           Clean up containers, images, and volumes
echo   exec ^<cmd^>      Execute command in frontend container
echo   nginx-test      Test nginx configuration
echo   nginx-reload    Reload nginx configuration  
echo   help            Show this help message
echo.
echo Examples:
echo   dev-scripts.bat start
echo   dev-scripts.bat logs frontend
echo   dev-scripts.bat exec bash
echo   dev-scripts.bat status
echo.
echo The frontend will be available at: http://localhost:3000
echo.
exit /b