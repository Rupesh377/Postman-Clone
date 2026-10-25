# Postman Clone

A full-stack API development and testing platform inspired by Postman. Manage workspaces, organize requests in hierarchical collections, resolve dynamic environment variables, execute HTTP calls, run collections sequentially, and leverage Ollama AI for request generation and testing.

## Features

- **Workspaces & Collaboration**: Private, team, and public workspaces with role-based member management, search, and sorting.
- **Collections & Folders**: Hierarchical organization of API requests with drag/reorder, duplication, and renaming.
- **Request Builder**: Multi-tab interface supporting GET, POST, PUT, DELETE, PATCH, headers/params key-value tables, raw JSON bodies with syntax coloring, and undefined variable warnings.
- **Environments & Variables**: Dynamic `{{variable}}` interpolation across URLs, headers, params, and body payloads.
- **Execution & Runner**: In-app HTTP client, execution history tracking, and sequential collection runner with pass/fail reporting.
- **Import / Export**: Full compatibility with Postman Collection v2.1 schemas (flattened folders and headers/params mapping) and native JSON export.
- **AI Assistant**: Ollama-powered request body generation, test suite synthesis, and response analysis.
- **Theming**: Dark and light modes with persistent user preference.

## Tech Stack

- **Backend**: Java 25, Spring Boot 4.1, Spring Security (JWT + OAuth2 Google/GitHub), Spring Data JPA, Spring AI (Ollama), MySQL.
- **Frontend**: React 18, Vite, React Router, Vanilla CSS design system.

## Getting Started

### Backend Setup (Port 8080)
1. Ensure Java 25 and MySQL are installed and running.
2. Create `Backend/src/main/resources/application.properties` with the required keys below.
3. Start the server using Maven:
   ```bash
   cd Backend
   ./mvnw spring-boot:run
   ```

### Frontend Setup (Port 5173)
1. Ensure Node.js (v18+) is installed.
2. Install dependencies and start the Vite dev server:
   ```bash
   cd Frontend
   npm install
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

## Required Configuration Keys (`application.properties`)

Never commit secret values. Configure the following keys in `Backend/src/main/resources/application.properties`:

```properties
server.port=8080
spring.application.name=Postman-Clone

# Database (MySQL)
spring.datasource.url=
spring.datasource.username=
spring.datasource.password=
spring.jpa.hibernate.ddl-auto=

# JWT Authentication
jwt.secret=
jwt.access-token-expiration=
jwt.refresh-token-expiration=

# OAuth2 (Google & GitHub)
spring.security.oauth2.client.registration.google.client-id=
spring.security.oauth2.client.registration.google.client-secret=
spring.security.oauth2.client.registration.github.client-id=
spring.security.oauth2.client.registration.github.client-secret=

# Mail (Optional / Verification)
spring.mail.host=
spring.mail.port=
spring.mail.username=
spring.mail.password=

# Spring AI (Ollama)
spring.ai.ollama.base-url=
spring.ai.ollama.chat.options.model=
```

Frontend environment keys (`Frontend/.env`):
- `VITE_BACKEND_URL`: Base URL for the backend API (defaults to `http://localhost:8080`).

## Main API Endpoint Groups

- `/api/v1/auth` - User registration, login, token refresh, email verification, and OAuth2 redirects.
- `/api/v1/workspaces` - Workspace CRUD, search, and member role assignment (`/members`).
- `/api/v1/collections` - Collection CRUD and nested folder management (`/folders`).
- `/api/v1/requests` - Request definition storage and HTTP execution runner (`/execute`).
- `/api/v1/environments` - Environment configurations and variable key-value resolution.
- `/api/v1/history` - Request execution history and inspection.
- `/api/v1/ai` - AI request body generation, test case generation, and response explanation.

## Folder Structure

```
Postman-Clone/
├── Backend/                 # Spring Boot application
│   ├── src/main/java/       # Domain modules: AI, Auth, Collections, Environments, Requests, Workspaces
│   └── pom.xml              # Maven dependencies & build config
├── Frontend/                # React Vite SPA
│   ├── src/
│   │   ├── api/             # Axios API client modules
│   │   ├── components/      # RequestBuilder, Sidebar, Topbar, Modals (Import/Export, Runner, History)
│   │   ├── context/         # AuthContext, WorkspaceContext, ToastContext
│   │   ├── pages/           # DashboardPage, WorkspacePage, LoginPage, RegisterPage
│   │   └── styles/          # Vanilla CSS design system & themes
│   └── package.json
└── README.md
```
