#!/bin/bash

echo "🚀 Starting Control Core Signup Service..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt --quiet

# Run the service
echo "🌐 Starting service on port 8002..."
echo "Access at: http://localhost:8002"
python run_on_8002.py

