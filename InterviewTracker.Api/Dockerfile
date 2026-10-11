FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["InterviewTracker.Api/InterviewTracker.Api.csproj", "InterviewTracker.Api/"]

RUN dotnet restore \
    "InterviewTracker.Api/InterviewTracker.Api.csproj"

COPY . .

WORKDIR "/src/InterviewTracker.Api"

RUN dotnet publish \
    "InterviewTracker.Api.csproj" \
    --configuration Release \
    --output /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

EXPOSE 8080

ENV ASPNETCORE_URLS=http://+:8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "InterviewTracker.Api.dll"]