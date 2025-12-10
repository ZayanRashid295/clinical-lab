#!/bin/bash

echo "🧪 Testing image accessibility..."
echo ""

# Test if image file exists
echo "1️⃣ Checking if image file exists locally:"
IMAGE_FILE="1762971131844-qbvyic056oi.png"
if [ -f "public/uploads/$IMAGE_FILE" ]; then
    echo "   ✅ File exists: public/uploads/$IMAGE_FILE"
    ls -lh "public/uploads/$IMAGE_FILE"
else
    echo "   ❌ File NOT found: public/uploads/$IMAGE_FILE"
fi

echo ""
echo "2️⃣ Testing HTTP access to image:"
curl -I "https://uworld-zayan.org/uploads/$IMAGE_FILE" 2>&1 | head -5

echo ""
echo "3️⃣ Testing direct backend access (bypassing Nginx):"
curl -I "http://localhost:3000/uploads/$IMAGE_FILE" 2>&1 | head -5

echo ""
echo "4️⃣ Checking Nginx config for /uploads/ location:"
if grep -q "location /uploads/" /etc/nginx/sites-available/uworld; then
    echo "   ✅ Nginx has /uploads/ location block"
    grep -A 5 "location /uploads/" /etc/nginx/sites-available/uworld
else
    echo "   ❌ Nginx does NOT have /uploads/ location block"
fi







