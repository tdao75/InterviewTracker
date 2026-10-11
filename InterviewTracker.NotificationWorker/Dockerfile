FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY . .

WORKDIR /src/InterviewTracker.NotificationWorker

RUN dotnet restore \
    "InterviewTracker.NotificationWorker.csproj"

RUN dotnet publish \
    "InterviewTracker.NotificationWorker.csproj" \
    --configuration Release \
    --output /app/publish

FROM mcr.microsoft.com/dotnet/runtime:10.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet","InterviewTracker.NotificationWorker.dll"]