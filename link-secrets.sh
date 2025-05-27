#!/bin/bash

echo "This script copies secrets to the deploy-k8s/base directory and updates .gitignore."
echo "It should be run only once after cloning the repository."
echo

# Define source and destination directories
SOURCE_DIR="$HOME/Sync/Projects/AppSecrets/isplitapp"
DEST_DIR="$(pwd)/deploy-k8s/base"

echo "Copying secrets from $SOURCE_DIR to $DEST_DIR"
echo

# Ensure the source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
  echo -e "\033[31m❌ Source directory $SOURCE_DIR does not exist.\033[0m"
  exit 1
fi

# Copy files with '.secret' in their name, including hidden files
shopt -s dotglob
for file in "$SOURCE_DIR"/*.secret*; do
  # Skip if no files match the pattern
  [ -e "$file" ] || continue

  filename=$(basename "$file")
  cp -f "$file" "$DEST_DIR/$filename"
  echo -e "\033[32m📄 Copied $filename\033[0m"
done

# Check if .gitignore exists in the root directory
GITIGNORE_FILE="$(pwd)/.gitignore"
if [ ! -f "$GITIGNORE_FILE" ]; then
  echo "# .gitignore file" > "$GITIGNORE_FILE"
  echo -e "\033[32mCreated .gitignore file.\033[0m"
fi

# Check if *.secret* pattern exists in .gitignore
if ! grep -q "*.secret*" "$GITIGNORE_FILE"; then
  echo "*.secret*" >> "$GITIGNORE_FILE"
  echo -e "\033[32mAdded *.secret* to .gitignore.\033[0m"
else
  echo -e "\033[32m*.secret* already exists in .gitignore.\033[0m"
fi

echo -e "\033[32m✅ Secrets copying and .gitignore update completed.\033[0m"
