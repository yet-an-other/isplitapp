FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
ARG BUILD_ENV
ARG VERSION
WORKDIR /src
COPY ["isplitapp-core/core/core.csproj", "core/"]
RUN dotnet restore "core/core.csproj"
COPY isplitapp-core/ .
WORKDIR "/src/core"
RUN dotnet build "core.csproj" \
    -c $BUILD_CONFIGURATION \
    -o /app/build \
    -p:PackageVersion=$VERSION \
    -p:InformationalVersion=$VERSION

FROM build AS net-build
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "core.csproj" --self-contained false \
    -c $BUILD_CONFIGURATION \
    -o /app/publish \
    -p:AOT=false \
    -p:UseAppHost=false 

FROM node:alpine as react-build
ARG BUILD_ENV
ARG VERSION
ARG HASH
RUN mkdir -p /app
RUN npm cache clear --force
WORKDIR /app
COPY next-ui/package.json /app
RUN npm install
RUN npm install env-cmd
COPY next-ui/ .
RUN npm version $VERSION --no-git-tag-version
RUN ./node_modules/.bin/env-cmd -f ./.env.${BUILD_ENV} npm run build

RUN ls -la /app
RUN ls -la /app/dist

FROM base AS final
WORKDIR /app

# Install bash for the deployment script (base image is Ubuntu)
RUN apt-get update && apt-get install -y bash && rm -rf /var/lib/apt/lists/*

# Copy .NET application
COPY --from=net-build /app/publish .

# Copy React build output
COPY --from=react-build /app/dist ./wwwroot

# Copy deployment script for runtime configuration
COPY deploy_env_config.sh /usr/local/bin/deploy_env_config.sh
RUN chmod +x /usr/local/bin/deploy_env_config.sh

# Create startup script that runs config injection then starts the app
RUN cat > /app/docker-entrypoint.sh << 'EOF'
#!/bin/bash
set -e

# Configure runtime environment for frontend
echo "Configuring frontend runtime environment..."
INDEX_HTML_PATH=/app/wwwroot/index.html /usr/local/bin/deploy_env_config.sh

# Start .NET application
echo "Starting .NET application..."
exec dotnet core.dll
EOF

RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]