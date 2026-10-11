\# InterviewTracker — Technical Architecture and Project Structure



\## 1. Project Overview



InterviewTracker is a full-stack web application built with \*\*ASP.NET Core Web API, React, TypeScript, SQL Server, RabbitMQ, and Docker\*\*.



The application allows users to manage job applications, schedule interviews, view interview calendars, and receive email notifications.



The backend uses an event-driven architecture with a Transactional Outbox pattern to improve message delivery reliability.



\### Key Technical Features



\- JWT-based authentication and user-specific data access

\- RESTful APIs for job applications and interviews

\- Entity Framework Core with SQL Server

\- React and TypeScript frontend

\- Interview calendar and dashboard statistics

\- Asynchronous event processing using RabbitMQ

\- Transactional Outbox pattern

\- Idempotent notification processing

\- Message retry and dead-letter queue handling

\- Docker Compose orchestration



\---



\## 2. Solution Structure



```text

InterviewTracker/

│

├── InterviewTracker.Api/

│   ├── Controllers/

│   │   ├── AuthController.cs

│   │   ├── DashboardController.cs

│   │   ├── InterviewsController.cs

│   │   └── JobApplicationsController.cs

│   │

│   ├── Contracts/

│   │   └── InterviewScheduledEvent.cs

│   │

│   ├── Data/

│   │   └── ApplicationDbContext.cs

│   │

│   ├── DTOs/

│   ├── Models/

│   ├── Services/

│   │   ├── TokenService.cs

│   │   ├── OutboxProcessor.cs

│   │   ├── RabbitMqEventPublisher.cs

│   │   ├── ITokenService.cs

│   │   └── IEventPublisher.cs

│   │

│   ├── Migrations/

│   ├── Program.cs

│   ├── Dockerfile

│   └── appsettings.json

│

├── InterviewTracker.NotificationWorker/

│   ├── Contracts/

│   │   └── InterviewScheduledEvent.cs

│   ├── Data/

│   │   └── NotificationDbContext.cs

│   ├── Models/

│   │   └── ProcessedMessage.cs

│   ├── Services/

│   │   ├── IEmailSender.cs

│   │   └── MailpitEmailSender.cs

│   ├── Migrations/

│   ├── Worker.cs

│   ├── Program.cs

│   ├── Dockerfile

│   └── appsettings.json

│

├── interviewtracker.client/

│   ├── src/

│   │   ├── components/

│   │   ├── services/

│   │   ├── types/

│   │   ├── App.tsx

│   │   ├── App.css

│   │   └── main.tsx

│   ├── public/

│   ├── Dockerfile

│   ├── nginx.conf

│   └── package.json

│

├── docs/

│   └── screenshots/

│

├── compose.full.yaml

├── compose.yaml

├── InterviewTracker.slnx

└── README.md

```



\## 3. Backend — InterviewTracker.Api



The API project is responsible for authentication, job application management, interview scheduling, dashboard statistics, and publishing notification events.



\### Controllers



| Controller | Responsibility |

|---|---|

| AuthController | User registration and login |

| JobApplicationsController | Job application CRUD operations |

| InterviewsController | Interview scheduling and management |

| DashboardController | Dashboard statistics and summary information |



\### Models



\*\*ApplicationUser.cs\*\*



Represents application users and supports authentication and user-specific data ownership.



\*\*JobApplication.cs\*\*



Represents a job application, including its associated tracking information.



\*\*Interview.cs\*\*



Represents a scheduled interview associated with a job application.



\*\*OutboxMessage.cs\*\*



Stores integration events awaiting publication to RabbitMQ.



\### Data Access



`ApplicationDbContext.cs` provides the Entity Framework Core database context.



It manages application entities and database operations using SQL Server.



The `Migrations/` folder contains database schema migrations and the EF Core model snapshot.



\### Services



\*\*TokenService.cs\*\*



Generates JWT tokens used to authenticate API requests.



\*\*RabbitMqEventPublisher.cs\*\*



Publishes integration events to RabbitMQ.



\*\*OutboxProcessor.cs\*\*



Processes pending messages stored in the database outbox and publishes them asynchronously.



\*\*ITokenService.cs / IEventPublisher.cs\*\*



Define service contracts, separating consumers from concrete implementations.



\---



\## 4. Notification Worker



The Notification Worker is a separate .NET background service responsible for processing interview notification events.



Unlike the API, it does not serve browser requests.



\### Main Components



| File | Responsibility |

|---|---|

| Worker.cs | Consumes and processes RabbitMQ events |

| NotificationDbContext.cs | Provides database access for notification processing |

| ProcessedMessage.cs | Records previously processed message identifiers |

| MailpitEmailSender.cs | Sends email through SMTP to Mailpit |

| IEmailSender.cs | Defines the email-sending abstraction |

| InterviewScheduledEvent.cs | Defines the notification event contract |



\### Reliability Mechanisms



\*\*Idempotent processing\*\*



The worker records processed event identifiers to help prevent duplicate email notifications when a message is delivered more than once.



\*\*Retry handling\*\*



Failed message processing can be retried according to configured retry settings.



\*\*Dead-letter queue\*\*



Messages that cannot be processed successfully after the configured retry attempts can be routed to a dead-letter queue for investigation.



\*\*RabbitMQ recovery\*\*



Connection recovery helps the worker tolerate temporary messaging infrastructure interruptions.



\---



\## 5. Frontend — React and TypeScript



The frontend is a React single-page application.



It communicates with the ASP.NET Core API through HTTP requests and uses JWT authentication for protected operations.



\### Components



| Component | Responsibility |

|---|---|

| AuthPage.tsx | Authentication screen |

| LoginForm.tsx | User login |

| RegisterForm.tsx | User registration |

| DashboardStatistics.tsx | Application and interview statistics |

| JobApplicationForm.tsx | Create job applications |

| EditJobApplicationForm.tsx | Update job applications |

| InterviewForm.tsx | Schedule interviews |

| EditInterviewForm.tsx | Modify scheduled interviews |

| InterviewCalendar.tsx | Calendar-based interview visualization |

| UpcomingInterviews.tsx | Upcoming interview list |



\### Services



The `src/services/` directory separates HTTP communication from UI components.



\- `apiClient.ts` — shared API communication

\- `authService.ts` — authentication operations

\- `jobApplicationService.ts` — job application requests

\- `interviewService.ts` — interview requests

\- `dashboardService.ts` — dashboard statistics requests



\### Types



The `src/types/` directory contains TypeScript definitions for authentication, job applications, interviews, and dashboard statistics.



This improves consistency between frontend components and API response data.



\---



\## 6. Interview Scheduling and Notification Flow



The following describes the event-driven workflow.



```mermaid

sequenceDiagram

&#x20;   participant User

&#x20;   participant React

&#x20;   participant API

&#x20;   participant SQL as SQL Server

&#x20;   participant Outbox as Outbox Processor

&#x20;   participant MQ as RabbitMQ

&#x20;   participant Worker

&#x20;   participant Mailpit



&#x20;   User->>React: Schedule interview

&#x20;   React->>API: Authenticated HTTP request

&#x20;   API->>SQL: Save interview and outbox event

&#x20;   SQL-->>API: Transaction committed

&#x20;   API-->>React: Interview saved



&#x20;   Outbox->>SQL: Read pending events

&#x20;   Outbox->>MQ: Publish event

&#x20;   MQ->>Worker: Deliver event

&#x20;   Worker->>SQL: Check processed message ID

&#x20;   Worker->>Mailpit: Send notification email

&#x20;   Worker->>SQL: Record processed message

&#x20;   Worker->>MQ: Acknowledge message

```



\### Why use a Transactional Outbox?



Publishing a RabbitMQ event directly after saving an interview introduces a potential failure:



1\. The interview is saved successfully.

2\. RabbitMQ becomes unavailable.

3\. The notification event is never published.



The Transactional Outbox addresses this by storing the interview and corresponding event in the same database transaction.



A separate processor later publishes the event to RabbitMQ.



This decouples the API request from messaging availability and improves reliability.



The design supports at-least-once event delivery rather than guaranteeing exactly-once processing, which is why idempotent consumption is important.



\---



\## 7. Database Architecture



The application uses SQL Server with Entity Framework Core.



\### Main Application Entities



| Entity | Purpose |

|---|---|

| ApplicationUser | Authentication and user ownership |

| JobApplication | Job application tracking |

| Interview | Scheduled interview records |

| OutboxMessage | Pending integration events |

| ProcessedMessage | Notification deduplication |



The API uses `ApplicationDbContext`, while the Notification Worker uses `NotificationDbContext`.



This separates application data access responsibilities from notification-processing persistence.



\### User Data Isolation



Authenticated users should only access their own job applications and interviews.



The API enforces user-specific data access using the authenticated user's identity rather than trusting a user ID supplied by the frontend.



\---



\## 8. Authentication and Security



InterviewTracker uses ASP.NET Core authentication with JWT bearer tokens.



\### Authentication Flow



1\. A user registers or logs in.

2\. The API validates the user's credentials.

3\. The API generates a JWT access token.

4\. React uses the token for authenticated API requests.

5\. The API validates the token and authorizes access to protected resources.



\### Configuration Security



Sensitive configuration values, including JWT signing keys, RabbitMQ passwords, and database passwords, are supplied through local environment configuration.



The repository excludes local `.env` files, development secrets, and database backups through `.gitignore`.



\---



\## 9. Docker Architecture



The full Docker Compose setup defines six services.



| Service | Technology | Purpose |

|---|---|---|

| client | React / Nginx | Frontend application |

| api | ASP.NET Core | REST API |

| sqlserver | SQL Server | Database persistence |

| rabbitmq | RabbitMQ | Event messaging |

| worker | .NET Worker Service | Email notification processing |

| mailpit | Mailpit | Local email testing |



\### Local Access



| Service | URL |

|---|---|

| Frontend | http://localhost:5173 |

| API | http://localhost:5253 |

| Mailpit | http://localhost:8026 |



\### Start



```powershell

docker compose -f compose.full.yaml up -d --build

```



\### Stop



```powershell

docker compose -f compose.full.yaml down

```



Docker volumes are preserved unless explicitly removed.



\---



\## 10. Design Patterns and Engineering Concepts



| Pattern / Concept | Application |

|---|---|

| RESTful API | Backend communication with React |

| Dependency Injection | Service registration and abstraction |

| Repository-like data access through EF Core | Database persistence |

| DTO Pattern | API request and response contracts |

| JWT Authentication | Securing API requests |

| Transactional Outbox | Reliable event publication |

| Publish/Subscribe Messaging | Asynchronous event delivery |

| Background Worker | Processing notifications outside HTTP requests |

| Idempotent Consumer | Avoiding duplicate message side effects |

| Retry Pattern | Handling transient failures |

| Dead-Letter Queue | Isolating repeatedly failed messages |

| Docker Compose | Local multi-service orchestration |



\---



\## 11. Architectural Benefits



\*\*Separation of concerns:\*\* React handles the UI, ASP.NET Core handles business operations, and the Worker handles asynchronous notifications.



\*\*Reliability:\*\* Outbox persistence, message retries, dead-letter handling, and idempotent processing reduce the impact of transient failures.



\*\*Maintainability:\*\* Controllers, models, DTOs, services, and frontend components have distinct responsibilities.



\*\*Testability:\*\* Service interfaces such as `ITokenService`, `IEventPublisher`, and `IEmailSender` support dependency substitution.



\*\*Extensibility:\*\* The messaging architecture can support additional event consumers or notification channels in future development.



\---



\## 12. Summary



InterviewTracker demonstrates full-stack .NET development and event-driven backend design.



The project combines traditional CRUD operations with asynchronous messaging and reliability patterns used in larger enterprise systems.



Its main technical strengths are:



\- ASP.NET Core and React integration

\- Secure user-specific data access

\- SQL Server and Entity Framework Core

\- Reliable RabbitMQ messaging

\- Transactional Outbox and idempotent processing

\- Containerized multi-service development



\*\*Repository:\*\* https://github.com/tdao75/InterviewTracker



