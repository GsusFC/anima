#!/bin/bash

# AnimaGen Fresh Repository Migration Script
# Creates a completely clean repository by replacing the entire GitHub repo

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/GsusFC/anima.git"
BACKUP_DIR="animagen-backup-$(date +%Y%m%d-%H%M%S)"
CURRENT_DIR=$(pwd)

echo -e "${BOLD}${BLUE}🚀 AnimaGen Fresh Repository Migration${NC}"
echo -e "${BOLD}${BLUE}=====================================${NC}"
echo ""
echo -e "${YELLOW}⚠️  WARNING: This will completely replace the GitHub repository!${NC}"
echo -e "${YELLOW}⚠️  All previous history and branches will be lost!${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "This script must be run from the AnimaGen root directory"
    exit 1
fi

# Check if git is available
if ! command -v git &> /dev/null; then
    print_error "Git is not installed or not in PATH"
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_error "This is not a git repository"
    exit 1
fi

echo -e "${BOLD}📋 Migration Plan:${NC}"
echo "1. Create local backup of current repository"
echo "2. Create fresh git repository with clean code"
echo "3. Replace remote repository completely"
echo "4. Verify the migration"
echo ""

# Confirmation
echo -e "${BOLD}${RED}🚨 FINAL WARNING:${NC}"
echo -e "${RED}This will PERMANENTLY DELETE all history from:${NC}"
echo -e "${RED}https://github.com/GsusFC/anima${NC}"
echo ""
echo -e "${YELLOW}The repository will be replaced with only the clean code.${NC}"
echo -e "${YELLOW}All previous commits, branches, and history will be lost.${NC}"
echo ""
read -p "Are you ABSOLUTELY SURE you want to proceed? Type 'YES' to continue: " -r
echo
if [[ ! $REPLY == "YES" ]]; then
    print_warning "Migration cancelled by user"
    exit 0
fi

# Step 1: Create local backup
echo -e "${BLUE}📦 Step 1: Creating local backup${NC}"
cd ..
if [ -d "$BACKUP_DIR" ]; then
    print_error "Backup directory already exists: $BACKUP_DIR"
    exit 1
fi

cp -r "$(basename "$CURRENT_DIR")" "$BACKUP_DIR"
print_status "Local backup created: ../$BACKUP_DIR"
cd "$CURRENT_DIR"

# Step 2: Verify clean state
echo -e "${BLUE}🧹 Step 2: Verifying clean state${NC}"

# Check that cleanup has been done
UNWANTED_PATTERNS=(
    "AGENT.md"
    "test-*.js"
    "debug-*.js"
    "*_SUMMARY.md"
    "railway.*"
)

echo "Checking for unwanted files..."
FOUND_UNWANTED=false
for pattern in "${UNWANTED_PATTERNS[@]}"; do
    if ls $pattern 1> /dev/null 2>&1; then
        print_warning "Found unwanted files: $pattern"
        FOUND_UNWANTED=true
    fi
done

if [ "$FOUND_UNWANTED" = true ]; then
    print_error "Please run the cleanup first before migration"
    exit 1
fi

# Check for large temp directories
if [ -d "backend/output" ] && [ "$(ls -A backend/output)" ]; then
    print_warning "backend/output is not empty"
    du -sh backend/output
fi

print_status "Clean state verified"

# Step 3: Create fresh repository
echo -e "${BLUE}🆕 Step 3: Creating fresh repository${NC}"

# Remove current git history
rm -rf .git

# Initialize new git repository
git init
git branch -M main

# Configure git (use existing config)
git config user.name "$(git config --global user.name || echo 'GsusFC')"
git config user.email "$(git config --global user.email || echo '98390545+GsusFC@users.noreply.github.com')"

print_status "Fresh git repository initialized"

# Step 4: Add all clean files
echo -e "${BLUE}📝 Step 4: Adding clean files${NC}"

# Add all files
git add .

# Show what will be committed
echo "Files to be committed:"
git diff --cached --name-status | head -20
if [ $(git diff --cached --name-status | wc -l) -gt 20 ]; then
    echo "... and $(( $(git diff --cached --name-status | wc -l) - 20 )) more files"
fi

echo ""
echo "Repository statistics:"
echo "- Total files: $(git diff --cached --name-status | wc -l)"
echo "- Documentation files: $(git diff --cached --name-status | grep -E '\.(md|txt)$' | wc -l)"
echo "- Source files: $(git diff --cached --name-status | grep -E '\.(js|ts|tsx|jsx|json)$' | wc -l)"

# Create initial commit
git commit -m "feat: initial clean repository

🎉 AnimaGen - Professional Animation Creation Tool

This is a complete rewrite and cleanup of the AnimaGen repository,
featuring a clean, production-ready codebase with comprehensive
documentation and optimized configurations.

✨ Features:
- Multi-format export (GIF, MP4, WebM, MOV)
- Professional timeline editor with drag & drop
- Real-time preview generation
- Advanced transition effects
- Dual-mode interface (Slideshow + Video Editor)

🛠 Tech Stack:
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Backend: Express.js + Socket.IO + FFmpeg
- Processing: Queue-based with Redis support
- Deployment: Docker + PM2 + Nginx ready

📚 Documentation:
- Complete API reference
- Architecture documentation
- Development and deployment guides
- Contributing guidelines

🚀 Ready for production deployment with Docker,
comprehensive testing, and professional documentation."

print_status "Initial commit created"

# Step 5: Add remote and push
echo -e "${BLUE}🚀 Step 5: Replacing remote repository${NC}"

# Add remote origin
git remote add origin "$REPO_URL"

# Final confirmation before push
echo ""
echo -e "${BOLD}${RED}🚨 LAST CHANCE TO CANCEL!${NC}"
echo -e "${RED}About to force push and replace:${NC}"
echo -e "${RED}$REPO_URL${NC}"
echo ""
read -p "Type 'REPLACE' to proceed with replacing the remote repository: " -r
echo
if [[ ! $REPLY == "REPLACE" ]]; then
    print_warning "Migration cancelled before push"
    print_info "Local repository is ready, but remote was not changed"
    exit 0
fi

# Force push to replace everything
echo "Force pushing to remote..."
git push --force origin main

print_status "Remote repository replaced successfully"

# Step 6: Clean up remote branches (if any remain)
echo -e "${BLUE}🧹 Step 6: Cleaning remote branches${NC}"

# Get list of remote branches
REMOTE_BRANCHES=$(git ls-remote --heads origin | awk '{print $2}' | sed 's|refs/heads/||' | grep -v '^main$' || true)

if [ -n "$REMOTE_BRANCHES" ]; then
    echo "Found remote branches to delete:"
    echo "$REMOTE_BRANCHES"
    echo ""
    read -p "Delete all remote branches except main? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        for branch in $REMOTE_BRANCHES; do
            echo "Deleting remote branch: $branch"
            git push origin --delete "$branch" || true
        done
        print_status "Remote branches cleaned"
    else
        print_info "Remote branches left unchanged"
    fi
else
    print_status "No additional remote branches found"
fi

# Step 7: Verification
echo -e "${BLUE}🔍 Step 7: Verifying migration${NC}"

# Fetch to verify
git fetch origin

# Show final state
echo ""
echo "Final repository state:"
echo "- Commit: $(git rev-parse --short HEAD)"
echo "- Branch: $(git branch --show-current)"
echo "- Remote: $(git remote get-url origin)"
echo "- Files: $(git ls-files | wc -l)"

# Show repository structure
echo ""
echo "Repository structure:"
tree -L 2 -I 'node_modules|.git' || ls -la

print_status "Migration verification completed"

# Success message
echo ""
echo -e "${BOLD}${GREEN}🎉 Fresh Repository Migration Completed Successfully!${NC}"
echo ""
echo -e "${GREEN}✅ Repository completely replaced with clean code${NC}"
echo -e "${GREEN}✅ All previous history removed${NC}"
echo -e "${GREEN}✅ Professional documentation added${NC}"
echo -e "${GREEN}✅ Production-ready configurations included${NC}"
echo ""
echo -e "${BLUE}📍 Repository URL: $REPO_URL${NC}"
echo -e "${BLUE}📦 Local backup: ../$BACKUP_DIR${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Visit the GitHub repository to verify the changes"
echo "2. Update any external references to the repository"
echo "3. Notify team members of the fresh start"
echo "4. Set up branch protection rules if needed"
echo "5. Configure any required GitHub settings"
echo ""
echo -e "${GREEN}🚀 AnimaGen is now ready for professional use!${NC}"
