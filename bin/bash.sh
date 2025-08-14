#!/bin/bash

echo "🔍 DEBUGGING FRONTEND-BACKEND CONNECTION ISSUES"
echo "=============================================="

echo -e "\n1️⃣ Check if frontend container is on the same network as backend:"
echo "docker network inspect microservices-network | grep -A 10 'Containers'"

echo -e "\n2️⃣ Check if API Gateway is accessible from frontend container:"
echo "docker exec restaurant-frontend curl -v http://api-gateway:8080/actuator/health"

echo -e "\n3️⃣ Test direct backend service from frontend container:"
echo "docker exec restaurant-frontend curl -v http://user-service:8081/actuator/health"

echo -e "\n4️⃣ Check DNS resolution from frontend:"
echo "docker exec restaurant-frontend nslookup api-gateway"
echo "docker exec restaurant-frontend nslookup user-service"

echo -e "\n5️⃣ Check if all backend services are running:"
echo "docker-compose -f docker-compose_backend.yml ps"

echo -e "\n6️⃣ Test API Gateway routing:"
echo "docker exec restaurant-frontend curl -v http://api-gateway:8080/users/api/v1/home/popular-dishes"

echo -e "\n7️⃣ Check nginx error logs:"
echo "docker logs restaurant-frontend | grep -i error"

echo -e "\n8️⃣ Test from host machine (should work like Postman):"
echo "curl -v http://localhost:8080/users/api/v1/home/popular-dishes"

echo -e "\n9️⃣ Check if frontend container has network connectivity:"
echo "docker exec restaurant-frontend ping -c 3 api-gateway"

echo -e "\n🔟 Check nginx upstream status:"
echo "docker exec restaurant-frontend cat /etc/nginx/conf.d/default.conf | grep -A 5 upstream"