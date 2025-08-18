@echo off
REM dev-scripts.bat - Windows batch development helper

setlocal enabledelayedexpansion

set "COMPOSE_FILE=docker-compose.dev.yml"
set "PROJECT_NAME=restaurant-frontend"

REM Colors (limited in batch, using echo for simple output)
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
if "%1"=="exec" call :dev_exec %2 %3 %4 %5
if "%1"=="nginx-config" call :dev_nginx_config
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

:dev_start
call :print_status "Starting development environment..."
call :create_network
if errorlevel 1 exit /b 1

REM Create logs directory
if not exist "logs\nginx" mkdir logs\nginx

REM Build and start
docker-compose -f %COMPOSE_FILE% up --build -d
if errorlevel 1 (
    call :print_error "Failed to start development environment"
    exit /b 1
)

call :print_success "Development environment started successfully"
call :print_status "Frontend available at: http://localhost:3000"
call :print_status "Health check: http://localhost:3000/health"
call :print_status "Debug info: http://localhost:3000/debug"
echo.
call :print_status "To view logs: dev-scripts.bat logs"
call :print_status "To stop: dev-scripts.bat stop"
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
    docker-compose -f %COMPOSE_FILE% logs -f
) else (
    docker-compose -f %COMPOSE_FILE% logs -f %~1
)
exit /b

:dev_status
call :print_status "Development environment status:"
docker-compose -f %COMPOSE_FILE% ps
echo.
call :print_status "Testing services:"

REM Test frontend
curl -f -s http://localhost:3000/health >nul 2>&1
if errorlevel 1 (
    call :print_error "Frontend: FAILED"
) else (
    call :print_success "Frontend: OK"
)

REM Test debug endpoint
curl -f -s http://localhost:3000/debug >nul 2>&1
if errorlevel 1 (
    call :print_error "Debug endpoint: FAILED"
) else (
    call :print_success "Debug endpoint: OK"
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

:dev_nginx_config
call :print_status "Current nginx configuration:"
docker-compose -f %COMPOSE_FILE% exec frontend cat /etc/nginx/conf.d/default.conf
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
echo Development Environment Helper Script (Windows)
echo.
echo Usage: dev-scripts.bat ^<command^>
echo.
echo Commands:
echo   start           Start development environment
echo   stop            Stop development environment
echo   restart         Restart development environment
echo   logs [service]  View logs (optionally for specific service)
echo   status          Check service status
echo   clean           Clean up containers, images, and volumes
echo   exec ^<cmd^>      Execute command in frontend container
echo   nginx-config    Show nginx configuration
echo   nginx-test      Test nginx configuration
echo   nginx-reload    Reload nginx configuration
echo   help            Show this help message
echo.
echo Examples:
echo   dev-scripts.bat start
echo   dev-scripts.bat logs frontend
echo   dev-scripts.bat exec bash
echo   dev-scripts.bat status
exit /b