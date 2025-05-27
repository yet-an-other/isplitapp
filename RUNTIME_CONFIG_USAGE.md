# Runtime Configuration Usage Guide

## Overview

This solution provides runtime environment variable injection for the iSplitApp frontend, allowing the API URL to be configured at deployment time rather than build time.

## How It Works

1. **Build Time**: The React app is built normally without hardcoded API URLs
2. **Runtime**: A deployment script injects the actual API URL into the index.html file
3. **Application**: The frontend reads the runtime configuration and falls back to build-time .env values

## Files

- `src/utils/apiConfig.ts` - Centralized API configuration utility
- `entrypoint.sh` - Container entrypoint script that patches index.html and starts the backend
- `Dockerfile` - Modified to use the entrypoint script at container startup

## Usage

### Local Development

Use `.env` files as usual:

```env
VITE_API_URL=http://localhost:8080
```

### Docker Deployment

Set environment variables when running the container:

```bash
docker run -e VITE_API_URL=https://api.production.com isplitapp
```

The startup script will automatically patch the frontend with the runtime configuration.

### Kubernetes Deployment

Use environment variables in your deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: isplitapp
spec:
  template:
    spec:
      containers:
      - name: isplitapp
        image: isplitapp:latest
        env:
        - name: VITE_API_URL
          value: "https://api.k8s.example.com"
```

### Manual Script Usage

You can also run the script manually:

```bash
# Set the API URL
export VITE_API_URL=https://api.example.com

# Set the path to index.html (default: /app/wwwroot/index.html)
export INDEX_HTML_PATH=/path/to/wwwroot/index.html

# Run the script
./entrypoint.sh
```

## Implementation Details

### Frontend Code

The `apiConfig.ts` utility provides a simple fallback hierarchy:

1. `window.__RUNTIME_CONFIG__.VITE_API_URL` (injected by deployment script)
2. `import.meta.env.VITE_API_URL` (from .env files)
3. Error if neither is available

### Deployment Script

The `entrypoint.sh` script:

- Validates that `VITE_API_URL` environment variable is set
- Creates a backup of the original index.html
- Injects `window.__RUNTIME_CONFIG__` JavaScript into the HTML
- Verifies the injection was successful
- Starts the .NET backend server

### Docker Integration

The Dockerfile has been modified to:

- Install bash for script execution
- Copy the entrypoint script into the container
- Use the entrypoint script as the container entrypoint
- The entrypoint script handles both frontend configuration and backend startup

## Benefits

- ✅ **Single Build**: One build works for all environments
- ✅ **Runtime Config**: API URLs set at deployment time
- ✅ **Fallback Support**: Graceful fallback to build-time configuration
- ✅ **Simple Integration**: Minimal changes to existing code
- ✅ **Docker Ready**: Works with container orchestration platforms
