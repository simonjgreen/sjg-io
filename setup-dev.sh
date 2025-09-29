#!/bin/bash

# Development Environment Setup Script for sjg.io
# This script activates the proper development environment

echo "🚀 Setting up sjg.io development environment..."

# Load Node.js via nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Activate Python virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "✅ Python virtual environment activated"
else
    echo "⚠️  Python virtual environment not found. Run: python3 -m venv venv"
fi

# Verify Node.js is available
if command -v node &> /dev/null; then
    echo "✅ Node.js $(node --version) is available"
else
    echo "❌ Node.js not found. Make sure nvm is properly installed."
    exit 1
fi

# Verify npm is available
if command -v npm &> /dev/null; then
    echo "✅ npm $(npm --version) is available"
else
    echo "❌ npm not found."
    exit 1
fi

echo ""
echo "🎉 Development environment ready!"
echo ""
echo "Available commands:"
echo "  npm run dev     - Start development server"
echo "  npm run build   - Build for production"
echo "  npm run preview - Preview production build"
echo "  npm run lint    - Run ESLint"
echo "  npm run typecheck - Run TypeScript checks"
echo ""
echo "To start developing: npm run dev"
