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

FROM base AS final
WORKDIR /app
COPY --from=net-build /app/publish .
COPY --from=react-build /app/build ./wwwroot

ENTRYPOINT ["dotnet", "core.dll"]