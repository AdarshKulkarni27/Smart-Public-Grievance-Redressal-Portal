#!/bin/bash
# Smart Grievance Portal - Start Script
# Usage: bash start.sh

echo "🚀 Starting Smart Grievance Portal..."

# Check Python
if ! command -v python3 &>/dev/null; then
  echo "❌ Python3 not found. Please install Python 3.8+"
  exit 1
fi

# Check Node
if ! command -v node &>/dev/null; then
  echo "❌ Node.js not found. Please install Node.js 16+"
  exit 1
fi

# Install Python deps
echo "📦 Installing Python dependencies..."
cd backend
pip install -r requirements.txt -q
cd ..

# Init DB (safe - skips if users already exist)
echo "🗄️  Initializing database..."
python3 database/init_db.py

# Install frontend deps if needed
if [ ! -d "frontend/node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  cd frontend && npm install && cd ..
fi

# Start Flask backend in background
echo "⚙️  Starting Flask backend on port 5000..."
cd backend
python3 app.py &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 2

# Start React frontend
echo "🌐 Starting React frontend on port 5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Portal is running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:5000"
echo ""
echo "📋 LOGIN CREDENTIALS:"
echo "   Citizen:  citizen@example.com   / citizen123"
echo "   Officer:  officer@grievance.gov / officer123"
echo "   Admin:    admin@grievance.gov   / admin123"
echo ""
echo "Press Ctrl+C to stop both servers."

# Wait and clean up on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Servers stopped.'" EXIT
wait
