#!/bin/bash

# Container Entrypoint Script
# This script configures the frontend runtime environment and starts the .NET backend

set -e

# Configuration
INDEX_HTML_PATH="${INDEX_HTML_PATH:-/app/wwwroot/index.html}"
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

        if cp "$INDEX_HTML_PATH" "${INDEX_HTML_PATH}${BACKUP_SUFFIX}" 2>/dev/null; then
            log "Backup created successfully"
        else
            log "Warning: Could not create backup file (proceeding without backup)"
        fi
    else
        log "Backup already exists, skipping backup creation"
    fi
}

# Function to inject runtime configuration into index.html
inject_runtime_config() {
    log "Injecting runtime configuration into $INDEX_HTML_PATH"
    

    # Check if file is writable
    if [ ! -w "$INDEX_HTML_PATH" ]; then
        error "Cannot write to $INDEX_HTML_PATH - permission denied"
        exit 1
    fi
    
    # Create the runtime config JavaScript (single line)
    local runtime_config="window.__RUNTIME_CONFIG__ = { VITE_API_URL: \"$VITE_API_URL\" };"
    
    # Create a temporary file for the replacement
    local temp_file="${INDEX_HTML_PATH}.tmp"
    
    # Use awk to replace the placeholder comment with actual config
    if awk -v config="$runtime_config" '
        /\/\/ Runtime configuration will be injected here by deployment script/ {
            print "      " config
            next
        }
        { print }

    ' "$INDEX_HTML_PATH" > "$temp_file" 2>/dev/null; then
        # Replace the original file
        if mv "$temp_file" "$INDEX_HTML_PATH" 2>/dev/null; then
            log "Runtime configuration injected successfully"
        else
            error "Failed to replace index.html with updated content"
            rm -f "$temp_file" 2>/dev/null
            exit 1
        fi
    else
        error "Failed to process index.html file"
        rm -f "$temp_file" 2>/dev/null
        exit 1
    fi
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

# Function to configure frontend
configure_frontend() {
    log "Configuring frontend runtime environment"
    
    # Validate inputs
    if [ ! -f "$INDEX_HTML_PATH" ]; then
        log "ERROR: index.html not found at $INDEX_HTML_PATH"
        exit 1
    fi
    
    validate_env
    create_backup
    inject_runtime_config
    verify_injection
    
    log "Frontend configuration completed successfully"
}

# Function to start .NET backend
start_backend() {
    log "Starting .NET backend server"
    
    # Ensure we're in the correct directory
    cd /app || {
        error "Cannot change to /app directory"
        exit 1
    }
    
    # Check if core.dll exists
    if [ ! -f "core.dll" ]; then
        error "core.dll not found in /app directory"
        exit 1
    fi
    
    log "Starting .NET application: dotnet core.dll"
    
    # Start the .NET application
    exec dotnet core.dll
}

# Main execution
main() {
    log "Container startup initiated"
    
    # Configure frontend first
    configure_frontend
    
    # Start backend server
    start_backend
}

# Run main function
main "$@"
