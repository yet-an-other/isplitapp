FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["isplitapp-core/core/core.csproj", "core/"]
RUN dotnet restore "core/core.csproj"
COPY isplitapp-core/ .
WORKDIR "/src/core"
RUN dotnet build "core.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS net-build
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "core.csproj" --self-contained false -c $BUILD_CONFIGURATION -o /app/publish /p:AOT=false /p:UseAppHost=false

FROM node:alpine as react-build
ARG BUILD_ENV
ARG VERSION
RUN mkdir -p /app
RUN npm cache clear --force
WORKDIR /app
COPY isplitapp-ui/package.json /app
RUN npm install
RUN npm install env-cmd
COPY isplitapp-ui/ .
RUN ./node_modules/.bin/env-cmd -f ./.env.${BUILD_ENV} npm run build

FROM base AS final
WORKDIR /app
COPY --from=net-build /app/publish .
COPY --from=react-build /app/build ./wwwroot

RUN ls -la .
RUN ls -la ./wwwroot

ENTRYPOINT ["dotnet", "core.dll"]