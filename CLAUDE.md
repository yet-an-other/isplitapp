# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important Instructions
- IMPORTANT: Use **codebase-navigator** agent for search, discovery, locate specific code elements, understand code structure, or find relevant files in the codebase
- IMPORTANT: Use **csharp-developer** agent for working with C# code
- IMPORTANT: Use **frontend-developer** agent for working with frontend project
- IMPORTANT: Use **test-automator** agent for writing tests
- IMPORTANT: Use **sql-pro** agent for working with sql queries
- IMPORTANT: Use **context-manager** agent to orchestrate and organize agents work
- IMPORTANT: Go to root directory, before cd to the specific project   
- Do what has been asked; nothing more, nothing less.
- NEVER create files unless they're absolutely necessary for achieving your goal.
- ALWAYS prefer editing an existing file to creating a new one.
- NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

## Core Principles

1. **TDD methodology** as the primary development approach
2. **Test First**: Write failing tests before any implementation
3. **Minimal Implementation**: Write only enough code to pass tests
4. **No Improvisation**: Don't add features or improvements not in the plan
5. **Verify Continuously**: Run tests after every change
6. **Write Quality focus** - clean, tested, maintainable code

### Strict Rules
1. **Never skip writing tests first**
2. **Never modify plan scope during execution**
3. **Never disable linting or skip tests**
4. **Never merge with failing tests**
5. **NEVER EVER cheat on tests (e.g., silently catching failures)**

### Code Quality Checklist
- [ ] All tests pass
- [ ] Code coverage meets minimum (80%)
- [ ] Linting passes without warnings
- [ ] TypeScript compilation successful
- [ ] No console.log statements in production code
- [ ] Proper error handling implemented
- [ ] Code follows project conventions

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
cd $PROJECTS_DIR/isplitapp/next-ui
npm install                    # Install dependencies
npm run dev:local              # Start development server
npm run build                  # Build for production
npm run lint                   # Run ESLint
```

### Backend (.NET)
```bash
cd $PROJECTS_DIR/isplitapp/isplitapp-core
dotnet restore                 # Restore NuGet packages
dotnet build                   # Build all projects
dotnet run --project core      # Run the API server
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
- Test before declaring done
- Research current docks, don't trust outdated knowledge
- Use visual inputs and Playwrite MCP to make sure the changes are correct
- **SINGLE RESPONSIBILITY**: Each function does ONE thing
- **EXPLICIT ERROR HANDLING**: No silent failures
- **SIMPLICITY FIRST**: Remove everything non-essential

### Context and Documentation

Preserve technical context. Never delete important information.
- **COMMENT THE WHY**: Only explain why, never what. Code shows what

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
- **React 19** with TypeScript
- **HeroUI** component library (formerly NextUI)
- **TailwindCSS v4** for styling
- **SWR** for data fetching
- **React Router** for navigation
- **PWA** capabilities with service worker
- **Vitest** for testing with jsdom environment
- **Vite** as build tool with PWA plugin

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

### Frontend Tests
- **Vitest** with jsdom environment
- **React Testing Library** for component testing
- Test setup file: `vitest.setup.ts`

### Running Tests
```bash
# Frontend tests
cd next-ui
npm test                              # Run all tests
npm run test -- --ui                  # Run with Vitest UI
npm run test -- --coverage            # Run with coverage

# Backend tests
cd isplitapp-core
dotnet test                           # Run all tests
dotnet test --filter "ClassName"      # Run specific test class
dotnet test --logger "console;verbosity=detailed"  # Verbose output
```
### Testing Requirements
- **Write tests for all new features** unless explicitly told not to
- **Run tests before committing** to ensure code quality and functionality
- Tests should cover both happy path and edge cases for the new functionality
- use Playwrite MCP for the UI testing. Assume the frontend server is already running on http://localhost:5173


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


### Styling

Uses Tailwind CSS v4 with PostCSS processing. Dark mode support is implemented via CSS custom properties in the root layout.

## MCP Tools

- **Context7** - Use to fetch updated documentation for libraries and frameworks like HeroUI, Tailwind CSS, React and others
- **chrome-mcp** - Use to check visual changes in the frontend with the chrom browser when UI modifications are made or UI test is needed. Assume the app is running on http://localhost:5173
- **playwright** - Use to check visual changes in the frontend with a real browser when UI modifications are made. Assume the app is running on http://localhost:5173
- **gh** - CLI for repository operations, PR management, and issue tracking

