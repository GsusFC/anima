#!/bin/bash

# AnimaGen Repository Migration Script
# Migrates the cleaned repository to a new clean state

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/GsusFC/anima.git"
BACKUP_BRANCH="backup-$(date +%Y%m%d-%H%M%S)"
CLEAN_BRANCH="clean-repo"
CURRENT_DIR=$(pwd)

echo -e "${BLUE}🚀 AnimaGen Repository Migration Script${NC}"
echo -e "${BLUE}======================================${NC}"
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

echo -e "${BLUE}📋 Pre-migration Checklist${NC}"
echo "1. Backup current state"
echo "2. Verify clean state"
echo "3. Create migration branch"
echo "4. Commit cleaned changes"
echo "5. Push to remote"
echo ""

# Step 1: Create backup branch
echo -e "${BLUE}📦 Step 1: Creating backup branch${NC}"
git checkout -b "$BACKUP_BRANCH"
git add .
git commit -m "backup: pre-cleanup state $(date)" || true
print_status "Backup branch created: $BACKUP_BRANCH"

# Step 2: Return to main and verify clean state
echo -e "${BLUE}🧹 Step 2: Verifying clean state${NC}"
git checkout main

# Check for any remaining unwanted files
UNWANTED_FILES=(
    "AGENT.md"
    "test-*.js"
    "debug-*.js"
    "backend/test-*.js"
    "backend/debug-*.js"
    "*_SUMMARY.md"
    "*_ANALYSIS.md"
    "railway.*"
    "postcss.config.js"
    "mcp-config.json"
)

echo "Checking for unwanted files..."
for pattern in "${UNWANTED_FILES[@]}"; do
    if ls $pattern 1> /dev/null 2>&1; then
        print_warning "Found unwanted files matching: $pattern"
        ls $pattern
    fi
done

# Check directory sizes
echo ""
echo "Directory sizes:"
du -sh backend/output 2>/dev/null || echo "backend/output: not found (good)"
du -sh backend/temp 2>/dev/null || echo "backend/temp: not found (good)"
du -sh backend/logs 2>/dev/null || echo "backend/logs: not found (good)"
du -sh backend/compositions 2>/dev/null || echo "backend/compositions: not found (good)"

print_status "Clean state verification completed"

# Step 3: Create clean migration branch
echo -e "${BLUE}🌿 Step 3: Creating clean migration branch${NC}"
git checkout -b "$CLEAN_BRANCH"
print_status "Clean branch created: $CLEAN_BRANCH"

# Step 4: Stage and commit all cleaned changes
echo -e "${BLUE}📝 Step 4: Committing cleaned repository${NC}"

# Add all new and modified files
git add .

# Check what's being committed
echo "Files to be committed:"
git diff --cached --name-status

echo ""
read -p "Do you want to proceed with committing these changes? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Migration cancelled by user"
    git checkout main
    git branch -D "$CLEAN_BRANCH"
    exit 0
fi

# Commit the cleaned state
git commit -m "feat: complete repository cleanup and optimization

- Remove 100+ obsolete development files
- Clean temporary directories (output, temp, logs)
- Remove duplicate configurations
- Add comprehensive documentation suite
- Optimize Docker and deployment configurations
- Update .gitignore to prevent future clutter
- Consolidate package.json scripts

This represents a major cleanup of the repository structure,
removing development artifacts and establishing a clean,
production-ready codebase with proper documentation."

print_status "Cleaned repository committed"

# Step 5: Verify the commit
echo -e "${BLUE}🔍 Step 5: Verifying commit${NC}"
echo "Commit details:"
git show --stat HEAD

echo ""
echo "Repository structure:"
tree -L 2 -I 'node_modules|.git' || ls -la

print_status "Commit verification completed"

# Step 6: Push to remote (optional)
echo -e "${BLUE}🚀 Step 6: Push to remote${NC}"
echo ""
read -p "Do you want to push the clean branch to remote? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Pushing clean branch to remote..."
    git push origin "$CLEAN_BRANCH"
    print_status "Clean branch pushed to remote"
    
    echo ""
    echo -e "${GREEN}🎉 Migration completed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review the clean branch on GitHub"
    echo "2. Create a Pull Request to merge into main"
    echo "3. Update any CI/CD configurations"
    echo "4. Notify team members of the changes"
    echo ""
    echo "Branch information:"
    echo "- Backup branch: $BACKUP_BRANCH (local)"
    echo "- Clean branch: $CLEAN_BRANCH (pushed to remote)"
    echo "- Original main: preserved"
else
    print_status "Clean branch created locally (not pushed)"
    echo ""
    echo "To push later, run:"
    echo "git push origin $CLEAN_BRANCH"
fi

echo ""
echo -e "${BLUE}📊 Migration Summary${NC}"
echo "- Removed obsolete documentation files"
echo "- Cleaned temporary directories"
echo "- Removed duplicate configurations"
echo "- Added comprehensive documentation"
echo "- Optimized Docker configurations"
echo "- Updated .gitignore"
echo "- Created backup branch: $BACKUP_BRANCH"
echo "- Created clean branch: $CLEAN_BRANCH"

echo ""
echo -e "${GREEN}✨ Repository cleanup completed successfully!${NC}"
