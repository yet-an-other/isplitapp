#!/bin/bash

# filepath: /Users/ruabdid/projects/isplitapp/deploy/init.sh
# Script to deploy iSplit application using kustomize with sops decryption

set -e  # Exit on any error

# Define variables
KUBECONFIG="$HOME/remote-kube/$1/config"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INIT_SOURCE_DIR="${SCRIPT_DIR}/init"
TARGET_DIR="$HOME/projects/deploy/isplit"

# Function to cleanup target directory
cleanup() {
    echo "🧹 Cleaning up target directory..."
    if [ -d "$TARGET_DIR" ]; then
        rm -rf "$TARGET_DIR"
        echo "✅ Removed $TARGET_DIR"
    fi
}

# Function to handle errors and cleanup
error_cleanup() {
    echo "❌ Error occurred during deployment. Cleaning up..."
    cleanup
    exit 1
}

# Function to display usage instructions
show_usage() {
    echo "📋 iSplit Deployment Script"
    echo ""
    echo "USAGE:"

    echo "  $0 <environment> [options]"

    echo ""
    echo "PARAMETERS:"
    echo "  environment    The target environment (e.g., hetzner, proxmox)"
    echo "                 This parameter determines:"
    echo "                 - Which kubeconfig to use: \$HOME/remote-kube/<environment>/config"
    echo "                 - Which overlay to deploy: overlays/<environment>"
    echo ""

    echo "OPTIONS:"
    echo "  -rdb           Apply restore-db.yaml directly (skips kustomize)"
    echo ""
    echo "EXAMPLES:"
    echo "  $0 hetzner     # Deploy to Hetzner environment"
    echo "  $0 proxmox     # Deploy to Proxmox environment"
    echo "  $0 hetzner -rdb # Restore database on Hetzner environment"

    echo ""
    echo "REQUIREMENTS:"
    echo "  - sops (for decrypting .sops files)"
    echo "  - kubectl (for applying Kubernetes resources)"
    echo "  - Kubeconfig file at: \$HOME/remote-kube/<environment>/config"
    echo ""
}

# Check if environment parameter is provided
if [ -z "$1" ]; then
    echo "❌ Error: Environment parameter is required"
    echo ""
    show_usage
    exit 1
fi

# Parse parameters
ENVIRONMENT="$1"
RESTORE_DB_MODE=false

if [ "$2" = "-rdb" ]; then
    RESTORE_DB_MODE=true
    echo "🔄 Database restore mode enabled"
fi


# Set trap to cleanup on exit (success or failure)
trap cleanup EXIT
trap error_cleanup ERR

if [ "$RESTORE_DB_MODE" = true ]; then
    echo "🚀 Starting iSplit database restore for environment: $ENVIRONMENT"
else
    echo "🚀 Starting iSplit deployment process for environment: $ENVIRONMENT"
fi


# Check if source directory exists
if [ ! -d "$INIT_SOURCE_DIR" ]; then
    echo "❌ Source directory $INIT_SOURCE_DIR does not exist"
    exit 1
fi

# Check if sops is installed
if ! command -v sops &> /dev/null; then
    echo "❌ sops is not installed. Please install sops first."
    echo "   You can install it with: brew install sops"
    exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Create target directory
echo "📁 Creating target directory: $TARGET_DIR"
mkdir -p "$TARGET_DIR"


# Copy init folder contents to target directory (excluding .decrypted. files)
echo "📋 Copying files from $INIT_SOURCE_DIR to $TARGET_DIR (excluding .decrypted. files)"
rsync -av --exclude="*.decrypted.*" "$INIT_SOURCE_DIR"/ "$TARGET_DIR/"


# Navigate to target directory
cd "$TARGET_DIR"

# Find and decrypt all .sops. files
echo "🔓 Decrypting sops files..."
find . -name "*.sops.*" -type f | while read -r sops_file; do
    # Generate target filename by removing .sops. from the filename
    target_file=$(echo "$sops_file" | sed 's/\.sops\./\./')
    
    echo "  Decrypting: $sops_file -> $target_file"
    
    # Decrypt the file
    if sops --decrypt "$sops_file" > "$target_file"; then
        echo "  ✅ Successfully decrypted $sops_file"
        # Remove the encrypted file after successful decryption
        rm "$sops_file"
    else
        echo "  ❌ Failed to decrypt $sops_file"
        exit 1
    fi
done

# Run kustomization or restore database
if [ "$RESTORE_DB_MODE" = true ]; then
    echo "🔄 Applying database restore..."
    if kubectl apply --kubeconfig "$KUBECONFIG" -f "$TARGET_DIR/base/restore-db.yaml"; then
        echo "✅ Database restore job applied successfully"
    else
        echo "❌ Database restore failed"
        exit 1
    fi
else
    echo "⚙️  Running kustomization..."
    if kubectl apply --kubeconfig "$KUBECONFIG" -k "$TARGET_DIR/overlays/$ENVIRONMENT"; then
        echo "✅ Kustomization applied successfully"
    else
        echo "❌ Kustomization failed"
        exit 1
    fi
fi

if [ "$RESTORE_DB_MODE" = true ]; then
    echo "🎉 Database restore completed successfully!"
else
    echo "🎉 Deployment completed successfully!"
fi

