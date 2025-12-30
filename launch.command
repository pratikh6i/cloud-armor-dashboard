#!/bin/bash

# Cloud Armor Command Center Launch Script
# Double-click this file to start the dashboard

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     ${GREEN}Cloud Armor Command Center${BLUE}                           ║${NC}"
echo -e "${BLUE}║     ${NC}Starting Security Dashboard...${BLUE}                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Change to the project directory
cd "$SCRIPT_DIR"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed.${NC}"
    echo "Please install npm (comes with Node.js)"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

echo -e "${GREEN}✓${NC} npm version: $(npm --version)"

# Check if node_modules exists, if not run npm install
if [ ! -d "node_modules" ]; then
    echo ""
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to install dependencies.${NC}"
        read -p "Press Enter to exit..."
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Dependencies installed successfully!"
fi

# Kill any existing process on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null

echo ""
echo -e "${BLUE}Starting development server...${NC}"
echo -e "${NC}The dashboard will open automatically in your browser.${NC}"
echo ""

# Wait a moment for the server to start, then open browser
(sleep 3 && open "http://localhost:3000") &

# Start the development server
npm run dev

# If npm run dev exits, wait for user input
echo ""
echo -e "${YELLOW}Server stopped. Press Enter to exit...${NC}"
read
