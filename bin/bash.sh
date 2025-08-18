#!/bin/bash
# dev-scripts.sh - Development helper scripts

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if docker-compose is available
check_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE="docker-compose"
    elif docker compose version &> /dev/null; then
        DOCKER_COMPOSE="docker compose"
    else
        print_error "Docker Compose not found. Please install Docker Compose."
        exit 1
    fi
}

# Create network if it doesn't exist
create_network() {
    print_status "Checking microservices network..."
    if ! docker network inspect microservices-network &> /dev/null; then
        print_status "Creating microservices-network..."
        docker network create microservices-network
        print_success "Network created successfully"
    else
        print_success "Network already exists"
    fi
}

# Build and start development environment
dev_start() {
    print_status "Starting development environment..."
    check_docker_compose
    create_network
    
    # Create logs directory
    mkdir -p logs/nginx
    
    # Build and start
    $DOCKER_COMPOSE -f docker-compose.dev.yml up --build -d
    
    if [ $? -eq 0 ]; then
        print_success "Development environment started successfully"
        print_status "Frontend available at: http://localhost:3000"
        print_status "Health check: http://localhost:3000/health"
        print_status "Debug info: http://localhost:3000/debug"
        echo ""
        print_status "To view logs: ./dev-scripts.sh logs"
        print_status "To stop: ./dev-scripts.sh stop"
    else
        print_error "Failed to start development environment"
        exit 1
    fi
}

# Stop development environment
dev_stop() {
    print_status "Stopping development environment..."
    check_docker_compose
    $DOCKER_COMPOSE -f docker-compose.dev.yml down
    print_success "Development environment stopped"
}

# View logs
dev_logs() {
    check_docker_compose
    if [ -z "$1" ]; then
        $DOCKER_COMPOSE -f docker-compose.dev.yml logs -f
    else
        $DOCKER_COMPOSE -f docker-compose.dev.yml logs -f "$1"
    fi
}

# Restart services
dev_restart() {
    print_status "Restarting development environment..."
    dev_stop
    sleep 2
    dev_start
}

# Clean up (remove containers, images, volumes)
dev_clean() {
    print_warning "This will remove all containers, images, and volumes. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        check_docker_compose
        print_status "Cleaning up development environment..."
        $DOCKER_COMPOSE -f docker-compose.dev.yml down -v --rmi all --remove-orphans
        docker system prune -f
        print_success "Cleanup completed"
    else
        print_status "Cleanup cancelled"
    fi
}

# Check service status
dev_status() {
    check_docker_compose
    print_status "Development environment status:"
    $DOCKER_COMPOSE -f docker-compose.dev.yml ps
    
    echo ""
    print_status "Testing services:"
    
    # Test frontend
    if curl -f -s http://localhost:3000/health > /dev/null; then
        print_success "Frontend: OK"
    else
        print_error "Frontend: FAILED"
    fi
    
    # Test debug endpoint
    if curl -f -s http://localhost:3000/debug > /dev/null; then
        print_success "Debug endpoint: OK"
    else
        print_error "Debug endpoint: FAILED"
    fi
}

# Execute command in container
dev_exec() {
    if [ -z "$1" ]; then
        print_error "Please provide a command to execute"
        echo "Usage: $0 exec <command>"
        echo "Example: $0 exec bash"
        exit 1
    fi
    
    check_docker_compose
    $DOCKER_COMPOSE -f docker-compose.dev.yml exec frontend "$@"
}

# Show nginx configuration
dev_nginx_config() {
    check_docker_compose
    print_status "Current nginx configuration:"
    $DOCKER_COMPOSE -f docker-compose.dev.yml exec frontend cat /etc/nginx/conf.d/default.conf
}

# Test nginx configuration
dev_nginx_test() {
    check_docker_compose
    print_status "Testing nginx configuration..."
    $DOCKER_COMPOSE -f docker-compose.dev.yml exec frontend nginx -t
}

# Reload nginx configuration
dev_nginx_reload() {
    check_docker_compose
    print_status "Reloading nginx configuration..."
    $DOCKER_COMPOSE -f docker-compose.dev.yml exec frontend nginx -s reload
    if [ $? -eq 0 ]; then
        print_success "Nginx configuration reloaded"
    else
        print_error "Failed to reload nginx configuration"
    fi
}

# Show usage
show_usage() {
    echo "Development Environment Helper Script"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  start           Start development environment"
    echo "  stop            Stop development environment"
    echo "  restart         Restart development environment"
    echo "  logs [service]  View logs (optionally for specific service)"
    echo "  status          Check service status"
    echo "  clean           Clean up containers, images, and volumes"
    echo "  exec <cmd>      Execute command in frontend container"
    echo "  nginx-config    Show nginx configuration"
    echo "  nginx-test      Test nginx configuration"
    echo "  nginx-reload    Reload nginx configuration"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 logs frontend"
    echo "  $0 exec bash"
    echo "  $0 status"
}

# Main script logic
case "$1" in
    start)
        dev_start
        ;;
    stop)
        dev_stop
        ;;
    restart)
        dev_restart
        ;;
    logs)
        dev_logs "$2"
        ;;
    status)
        dev_status
        ;;
    clean)
        dev_clean
        ;;
    exec)
        shift
        dev_exec "$@"
        ;;
    nginx-config)
        dev_nginx_config
        ;;
    nginx-test)
        dev_nginx_test
        ;;
    nginx-reload)
        dev_nginx_reload
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac