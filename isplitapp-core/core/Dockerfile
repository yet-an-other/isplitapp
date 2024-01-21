#FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
#USER $APP_UID
#WORKDIR /app
#EXPOSE 8080
#EXPOSE 8081
#
#FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
#ARG BUILD_CONFIGURATION=Release
#WORKDIR /src
#
#RUN apt update
#RUN apt install -y clang zlib1g-dev
#
#COPY ["core/core.csproj", "core/"]
#RUN dotnet restore "core/core.csproj"
#COPY . .
#WORKDIR "/src/core"
#RUN dotnet build "core.csproj" -c $BUILD_CONFIGURATION -o /app/build
#
#FROM build AS publish
#ARG BUILD_CONFIGURATION=Release
## RUN dotnet publish "core.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=true
#RUN dotnet publish "core.csproj" -c $BUILD_CONFIGURATION --self-contained false -r linux-x64 -o /app/publish /p:AOT=true /p:UseAppHost=false
#
#FROM base AS final
#WORKDIR /app
#COPY --from=publish /app/publish .
#ENTRYPOINT ["./app"]


FROM alpine:3.18 AS prepare
WORKDIR /app
EXPOSE 8080
EXPOSE 8081
#USER $APP_UID
RUN adduser -u 1000 --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine3.18 AS build
RUN apk update && apk upgrade
RUN apk add --no-cache clang build-base zlib-dev

WORKDIR /src
COPY ["core/core.csproj", "core/"]
ARG RUNTIME_ID=linux-musl-x64
RUN dotnet restore "core/core.csproj" -r $RUNTIME_ID


COPY . .
WORKDIR "/src/core"
RUN dotnet publish \
    -c Release \
    -r $RUNTIME_ID \
    -o /app \
    --no-restore

FROM prepare AS final
COPY --chown=appuser --from=build /app ./app
RUN chmod a+x ./app/core
ENTRYPOINT ["./app/core"]