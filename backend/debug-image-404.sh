#!/bin/bash

echo "🔍 Debugging image 404 error..."
echo ""

IMAGE_FILE="1763496045810-34rh0byx9ik.png"

# 1. Check if file exists
echo "1️⃣ Checking if file exists:"
if [ -f "public/uploads/$IMAGE_FILE" ]; then
    echo "   ✅ File exists: public/uploads/$IMAGE_FILE"
    ls -lh "public/uploads/$IMAGE_FILE"
else
    echo "   ❌ File NOT found: public/uploads/$IMAGE_FILE"
    echo "   📋 Available files:"
    ls public/uploads/ | head -5
fi

echo ""
echo "2️⃣ Testing backend direct access (port 3000):"
curl -I "http://localhost:3000/uploads/$IMAGE_FILE" 2>&1 | head -3

echo ""
echo "3️⃣ Testing via Nginx:"
curl -I "https://uworld-zayan.org/uploads/$IMAGE_FILE" 2>&1 | head -5

echo ""
echo "4️⃣ Checking Nginx config for /uploads/:"
if sudo grep -q "location /uploads/" /etc/nginx/sites-available/uworld; then
    echo "   ✅ Found /uploads/ location block:"
    sudo grep -A 8 "location /uploads/" /etc/nginx/sites-available/uworld
else
    echo "   ❌ /uploads/ location block NOT FOUND in Nginx config!"
fi

echo ""
echo "5️⃣ Checking if backend is serving static files:"
pm2 logs clinical-lab-backend --lines 5 --nostream | grep -i "static\|uploads" || echo "   (No relevant logs)"







