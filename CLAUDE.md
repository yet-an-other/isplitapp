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

## Technical Standards

### Clear code principles
- You shall never assume, always ask
- You shall always use MCP tools
- Write code that is clear and obvious
- Make atomic descriptive commits
- Always document why, not what
- Test before declaring done
- Research current docks, don't trust outdated knowledge
- Use visual imputs and Playwrite MCP for the UI debugging

- **NO CLEVER TRICKS**: Clear, obvious code only
- **DESCRIPTIVE NAMING**: `processTextNodes()` not `ptn()` or `handleStuff()`
- **COMMENT THE WHY**: Only explain why, never what. Code shows what
- **SINGLE RESPONSIBILITY**: Each function does ONE thing
- **EXPLICIT ERROR HANDLING**: No silent failures
- **MEASURE THEN OPTIMIZE**: No premature optimization
- **SIMPLICITY FIRST**: Remove everything non-essential

### Honest Technical Assessment

ALWAYS provide honest assessment of technical decisions:

- If code has problems, explain the specific issues
- If an approach has limitations, quantify them
- If there are security risks, detail them clearly
- If performance will degrade, provide metrics
- If implementation is complex, justify why
- If you chose a suboptimal solution, explain the tradeoffs
- If you're uncertain, say so explicitly

Examples of honest assessment:
- "This will work for 1000 users but will break at 10,000 due to database bottleneck"
- "This fix addresses the symptom but not the root cause - we'll see this bug again"
- "This implementation is 3x more complex than needed because of legacy constraints"
- "I'm not certain this handles all edge cases - particularly around concurrent access"
- "This violates best practices but is necessary due to framework limitations"

### Context and Documentation

Preserve technical context. Never delete important information.

Keep these details:
- Code examples with line numbers
- Performance measurements and metrics
- Rationale for architectural decisions
- Explanations of non-obvious patterns
- Cross-references to related issues
- Technology-specific best practices


### Naming Conventions Frontend (React/TypeScript)

Follow TypeScript/JavaScript standards:

- Use ES modules (import/export) syntax, not CommonJS (require)
- Destructure imports when possible (eg. import { foo } from 'bar')

**Functions and Variables**:
- Use `camelCase`: `getUserData`, `processRequest`
- Boolean prefixes: `is`, `has`, `can`, `should`, `will`, `did`
- Example: `isLoading`, `hasPermission`, `canEdit`

**Types and Interfaces**:
- Use `PascalCase`: `UserProfile`, `RequestHandler`
- No `I` prefix for interfaces (use `User` not `IUser`)
- Type for data: `UserData`, Interface for contracts: `UserService`

**Constants**:
- Global constants: `SCREAMING_SNAKE_CASE` (e.g., `MAX_RETRIES`)
- Local constants: `camelCase` (e.g., `defaultTimeout`)
- Enum values: `SCREAMING_SNAKE_CASE`

**File Names**:
- Components: `UserProfile.tsx`
- Utilities: `date-helpers.ts`
- Types: `user.types.ts`
- Tests: `user.test.ts` or `user.spec.ts`
- Constants: `constants.ts`



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

## Version Control and Commits

### Conventional Commits Standard

Follow Conventional Commits v1.0.0:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Commit Types**:
- `feat`: New feature (MINOR version)
- `fix`: Bug fix (PATCH version)
- `refactor`: Code restructuring without behavior change
- `perf`: Performance improvement
- `docs`: Documentation only
- `test`: Test additions or corrections
- `build`: Build system or dependency changes
- `ci`: CI/CD configuration changes
- `chore`: Maintenance tasks
- `style`: Code formatting (whitespace, semicolons, etc)

**Breaking Changes**:
- Add `!` after type/scope: `feat(api)!: remove deprecated endpoints`
- Or use footer: `BREAKING CHANGE: description of the breaking change`

**Example Commit**:
```
fix(auth): prevent race condition in token refresh

Add mutex to ensure only one token refresh happens at a time.
Previous implementation could cause multiple simultaneous refreshes
under high load.

Fixes: #123
```

**Commit Requirements**:
- One logical change per commit
- Run tests before committing
- Include context for future developers
- Reference issue numbers when applicable
- Never mention "Claude" or "AI" in commits

### Styling

Uses Tailwind CSS v4 with PostCSS processing. Dark mode support is implemented via CSS custom properties in the root layout.

## MCP Tools

- **Context7 MCP** - Use to fetch updated documentation for libraries and frameworks like heroui, Tailwind CSS, React and others
- **Playwright MCP** - Use to check visual changes in the frontend with a real browser when UI modifications are made