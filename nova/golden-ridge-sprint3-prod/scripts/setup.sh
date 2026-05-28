#!/bin/bash

# Golden Ridge Apartments - Local Setup Script
# Sprint 0

set -e

echo "🏔️ Golden Ridge Apartments - Local Setup"
echo "========================================="

# Check prerequisites
echo ""
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version must be 20 or higher. Current: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v)"

if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing..."
    npm install -g pnpm
fi
echo "✅ pnpm $(pnpm -v)"

if ! command -v psql &> /dev/null; then
    echo "⚠️ PostgreSQL CLI not found. Make sure PostgreSQL is running."
else
    echo "✅ PostgreSQL CLI available"
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
pnpm install

# Check for .env.local
if [ ! -f ".env.local" ]; then
    echo ""
    echo "Creating .env.local from template..."
    cp .env.example .env.local
    echo "⚠️ Please edit .env.local with your database credentials."
fi

# Generate Prisma client
echo ""
echo "Generating Prisma client..."
pnpm --filter web prisma generate

echo ""
echo "========================================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your database credentials"
echo "2. Create the database: createdb goldenridge"
echo "3. Run migrations: pnpm --filter web prisma migrate dev"
echo "4. Start dev server: pnpm dev"
echo ""
