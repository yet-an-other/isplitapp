FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
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

FROM node:alpine AS react-build
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

# Install bash for the deployment script (run as root before switching user)
USER root
RUN apt-get update && apt-get install -y bash && rm -rf /var/lib/apt/lists/*

# Switch back to the app user and set working directory
USER $APP_UID
WORKDIR /app

# Copy .NET application
COPY --from=net-build /app/publish .

# Copy React build output
COPY --from=react-build /app/dist ./wwwroot

# Copy deployment script for runtime configuration
COPY entrypoint.sh /app/entrypoint.sh

# Set proper permissions for the entrypoint script and wwwroot directory (as root)
USER root
RUN chmod +x /app/entrypoint.sh && \
    chown -R $APP_UID:$APP_UID /app/entrypoint.sh /app/wwwroot && \
    chmod -R u+w /app/wwwroot

# Switch back to app user for runtime
USER $APP_UID

ENTRYPOINT ["/app/entrypoint.sh"]