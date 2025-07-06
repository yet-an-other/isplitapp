# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

iSplit.app is a full-stack expense sharing application with these main components:

- **`isplitapp-core/`**: .NET 9 backend API (C#)
  - `core/`: Main ASP.NET Core Web API
  - `Utils/`: Shared utilities including AUID (App Unique ID) system
  - `Migrations/`: Database migration management
  - `Tests/`: XUnit test suite
- **`next-ui/`**: React frontend with Vite build system
- **`ios/`**: Native iOS app using WebView
- **`deploy/`**: Kubernetes Helm charts and ArgoCD configurations

## Development Commands

### Frontend (React/TypeScript)
```bash
cd next-ui
npm install                    # Install dependencies
npm run dev                    # Start development server
npm run build                  # Build for production
npm run lint                   # Run ESLint
npm run dev:local              # Run with local environment config
```

### Backend (.NET)
```bash
cd isplitapp-core
dotnet restore                 # Restore NuGet packages
dotnet build                   # Build all projects
dotnet run --project core      # Run the API server
dotnet test                    # Run all tests
dotnet test Tests/             # Run specific test project
```

### Docker
```bash
docker build -t isplitapp .    # Build full application image
```

## Architecture Overview

The application follows a clean architecture pattern:

### Backend API Structure
- **Minimal API**: Uses .NET minimal APIs with endpoint mapping
- **Database**: PostgreSQL with Linq2DB for data access
- **Validation**: FluentValidation for request validation
- **Telemetry**: OpenTelemetry integration for monitoring
- **Notifications**: Firebase for push notifications
- **Custom ID System**: AUID (App Unique ID) for distributed ID generation

### Key Backend Components
- `Program.cs`: Application startup and configuration
- `Expenses/`: Core expense management domain
- `Devices/`: Device registration and notifications
- `Infrastructure/`: Cross-cutting concerns (validation, endpoints)

### Frontend Architecture
- **React 18** with TypeScript
- **NextUI** component library
- **TailwindCSS** for styling
- **SWR** for data fetching
- **React Router** for navigation
- **PWA** capabilities with service worker

### Key Frontend Structure
- `pages/`: Route components
- `controls/`: Reusable UI components
- `api/`: API client and TypeScript contracts
- `utils/`: Utilities for notifications, settings, reports

## Database Migrations

Migrations are handled automatically on application startup. Manual migration commands:
```bash
cd isplitapp-core/Migrations
dotnet run -- up    # Run migrations up
dotnet run -- down  # Run migrations down
```

## Testing

### Backend Tests
- **XUnit** test framework
- **Moq** for mocking
- Database integration tests with test fixtures
- HTTP endpoint tests using Bruno (in `Tests/http-test/`)

### Running Specific Tests
```bash
dotnet test --filter "ClassName"      # Run specific test class
dotnet test --logger "console;verbosity=detailed"  # Verbose output
```

## Deployment

The application uses a multi-stage Docker build:
1. .NET backend compilation
2. React frontend build
3. Combined into single container

Kubernetes deployment via Helm charts in `deploy/helm/` with environment-specific overlays.

## Environment Configuration

- Backend: `appsettings.json` and `appsettings.Development.json`
- Frontend: Environment files (`.env.local`, `.env.production`)
- CORS configuration for allowed origins
- Database connection strings
- Firebase configuration for notifications

## Key Features to Understand

1. **Registration-free**: No user accounts, uses device-based identification
2. **Real-time updates**: Push notifications for expense changes
3. **Expense splitting**: Support for uneven splits and complex reimbursements
4. **Multi-platform**: Web app, iOS native, and PWA support
5. **Offline capability**: Service worker for offline functionality