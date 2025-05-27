#!/bin/bash

# Deploy Environment Configuration Script
# This script patches the index.html file with runtime environment variables

set -e

# Configuration
INDEX_HTML_PATH="${INDEX_HTML_PATH:-/app/dist/index.html}"
BACKUP_SUFFIX=".backup"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to validate required environment variables
validate_env() {
    if [ -z "$VITE_API_URL" ]; then
        log "ERROR: VITE_API_URL environment variable is required"
        exit 1
    fi
    
    log "Using API URL: $VITE_API_URL"
}

# Function to create backup of original file
create_backup() {
    if [ ! -f "${INDEX_HTML_PATH}${BACKUP_SUFFIX}" ]; then
        log "Creating backup of original index.html"
        cp "$INDEX_HTML_PATH" "${INDEX_HTML_PATH}${BACKUP_SUFFIX}"
    fi
}

# Function to generate runtime config JavaScript
generate_runtime_config() {
    cat << EOF
window.__RUNTIME_CONFIG__ = {
  VITE_API_URL: "$VITE_API_URL"
};
EOF
}

# Function to inject runtime configuration into index.html
inject_runtime_config() {
    log "Injecting runtime configuration into $INDEX_HTML_PATH"
    
    # Create the runtime config JavaScript (single line)
    local runtime_config="window.__RUNTIME_CONFIG__ = { VITE_API_URL: \"$VITE_API_URL\" };"
    
    # Create a temporary file for the replacement
    local temp_file="${INDEX_HTML_PATH}.tmp"
    
    # Use awk to replace the placeholder comment with actual config
    awk -v config="$runtime_config" '
        /\/\/ Runtime configuration will be injected here by deployment script/ {
            print "      " config
            next
        }
        { print }
    ' "$INDEX_HTML_PATH" > "$temp_file"
    
    # Replace the original file
    mv "$temp_file" "$INDEX_HTML_PATH"
    
    log "Runtime configuration injected successfully"
}

# Function to verify injection
verify_injection() {
    if grep -q "window.__RUNTIME_CONFIG__" "$INDEX_HTML_PATH"; then
        log "✓ Runtime configuration injection verified"
    else
        log "✗ Runtime configuration injection failed"
        exit 1
    fi
}

# Main execution
main() {
    log "Starting deployment environment configuration"
    
    # Validate inputs
    if [ ! -f "$INDEX_HTML_PATH" ]; then
        log "ERROR: index.html not found at $INDEX_HTML_PATH"
        exit 1
    fi
    
    validate_env
    create_backup
    inject_runtime_config
    verify_injection
    
    log "Deployment environment configuration completed successfully"
}

# Run main function
main "$@"
