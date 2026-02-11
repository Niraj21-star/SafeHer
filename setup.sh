#!/bin/bash

# SafeHer MVP - Quick Start Setup Script
# This script helps you set up the development environment quickly

echo "🛡️  SafeHer MVP - Quick Start Setup"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Check for .env files
echo "📝 Checking environment files..."
if [ ! -f ".env" ]; then
    echo "⚠️  Frontend .env not found. Creating from template..."
    cp .env.example .env
    echo "✅ Created .env - Please fill in your Firebase credentials"
    ENV_NEEDS_CONFIG=true
fi

if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend .env not found. Creating from template..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env - Please fill in your configuration"
    ENV_NEEDS_CONFIG=true
fi

if [ "$ENV_NEEDS_CONFIG" = true ]; then
    echo ""
    echo "⚠️  IMPORTANT: Environment files created but need configuration!"
    echo "   1. Edit .env with your Firebase credentials"
    echo "   2. Edit backend/.env with your service account and API keys"
    echo "   3. See README.md for detailed setup instructions"
    echo ""
    read -p "Press Enter to continue once you've configured the .env files..."
fi

echo ""
echo "📦 Installing dependencies..."
echo ""

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Frontend dependency installation failed"
    exit 1
fi
echo "✅ Frontend dependencies installed"

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Backend dependency installation failed"
    exit 1
fi
cd ..
echo "✅ Backend dependencies installed"

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the development servers:"
echo ""
echo "   Option 1 - Run both servers together:"
echo "   $ npm run dev:all"
echo ""
echo "   Option 2 - Run servers separately:"
echo "   Terminal 1: cd backend && npm run dev"
echo "   Terminal 2: npm run dev"
echo ""
echo "📖 For detailed setup instructions, see README.md"
echo "🐛 For troubleshooting, see README.md -> Troubleshooting section"
echo ""
echo "🎯 Access the app at: http://localhost:5173"
echo "🔧 Backend API at: http://localhost:5000"
echo ""
