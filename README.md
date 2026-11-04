# CampusConnect 🎓

An exclusive college community network gated by official Instagram follower verification. Features Instagram DM challenge authentication, peer-to-peer discovery, connect requests, direct messaging, and campus moments feed.

---

## 📁 Repository Structure

This repository is organized as a full-stack monorepo:

```
campus-connect/
├── backend/          # Spring Boot 3.3.4 (Java 21, Maven, PostgreSQL, JPA, Swagger)
├── frontend/         # React 18 (Vite, TypeScript, Tailwind CSS, Framer Motion)
└── README.md
```

---

## 🚀 Getting Started

### 1. Backend Setup (Spring Boot)

#### Prerequisites
- **Java 21+**
- **Maven 3.9+**
- **PostgreSQL 14+**

#### Running the Backend
```bash
cd backend

# Compile and package
mvn clean package -DskipTests

# Run the application (starts on port 8080)
mvn spring-boot:run
```

- **Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **OpenAPI v3 Spec**: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

---

### 2. Frontend Setup (React + Vite)

#### Prerequisites
- **Node.js 18+**
- **npm** or **yarn**

#### Running the Frontend
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server (starts on http://localhost:5173)
npm run dev

# Build for production
npm run build
```

---

## 🛠️ Technology Stack

- **Backend**: Spring Boot 3, Spring Security, JWT (JJWT), Spring Data JPA, Flyway, PostgreSQL, Springdoc OpenAPI 3.
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide Icons, Framer Motion, Axios.
- **Integration**: Meta Graph API v21.0 Webhooks & Instagram Graph API.
