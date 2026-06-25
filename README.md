# 🛡️ AetherGuardian — AI-Powered Fraud Detection System

> A real-time, multi-layered financial fraud detection platform with a fully interactive analyst dashboard, behavioral biometrics engine, and ML-driven risk scoring.

---

## 🚀 Live Demo

Open `AetherGuardian.html` directly in your browser — **no server required**. The application runs 100% client-side using LocalStorage for persistence.

---

## ✨ Features

### 🧠 5-Layer Fraud Scoring Engine
| Layer | Signal | Weight |
|-------|--------|--------|
| 1 | Base Rules (amount, merchant, location) | 30% |
| 2 | Behavioral Biometrics (typing, mouse cadence) | 20% |
| 3 | Device Fingerprinting | 15% |
| 4 | Velocity Analysis (transaction frequency) | 15% |
| 5 | Geofencing & Impossible Travel Detection | 20% |

Hard-floor overrides ensure extreme amounts (>$1B) are always flagged regardless of other layers.

### 🔴 Impossible Travel Detection
Flags transactions that are physically impossible given the time delta between locations (e.g., India → London in 6 seconds).

### 📡 Live Transaction Stream
Real-time feed showing all transactions across all accounts with live risk scores, color-coded status badges, and fraud reason pills.

### 🎮 Transaction Simulator
Submit test transactions with custom amount, merchant, and location to see the scoring engine in action. Includes a shadow model that runs in parallel with tighter thresholds for A/B comparison.

### 📊 Analytics Dashboard
- Transaction volume and fraud rate metrics
- Risk heatmap and trend charts
- Case Management panel for analyst workflow
- Explainability panel showing exactly why each score was assigned

### 🔒 Multi-Account Session Isolation
Proper session management — logging in as a different user resets the UI state, active tab, and shadow mode toggle.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Browser (AetherGuardian.html)                │
│   ┌──────────────┐  ┌───────────────┐  ┌───────────────────┐   │
│   │  Auth Layer  │  │ Scoring Engine│  │  Analytics/Cases  │   │
│   │  (LocalStorage│  │  (5 Layers)   │  │  (Live Stream)    │   │
│   │   Sessions)  │  │               │  │                   │   │
│   └──────────────┘  └───────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              Backend Microservices (Optional / Cloud)           │
│   ┌──────────────────────┐   ┌────────────────────────────┐    │
│   │  ingestion-service   │   │    scoring-service          │    │
│   │  (Spring Boot + JPA) │──▶│    (Python + XGBoost)       │    │
│   │  REST API + Kafka    │   │    Kafka Consumer           │    │
│   └──────────────────────┘   └────────────────────────────┘    │
│              │                            │                     │
│              ▼                            ▼                     │
│         PostgreSQL / H2           fraud_model.json              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla HTML, CSS, JavaScript |
| UI Components | Lucide Icons, Chart.js |
| Backend (optional) | Spring Boot 3, Spring Security, Spring Data JPA |
| ML Scoring (optional) | Python, XGBoost, Pandas, SQLAlchemy |
| Messaging (optional) | Apache Kafka |
| Database (optional) | PostgreSQL (prod) / H2 in-memory (dev) |
| Auth | JWT + BCrypt |

---

## ⚙️ Local Setup

### Option A — Frontend Only (Instant)
```bash
# Just open the file in your browser:
AetherGuardian.html
```

### Option B — Run Stack with Docker Compose (Recommended for Dev/Test)
We provide a production-ready containerized setup including databases, message brokers, and metrics collection.
```bash
# Run the entire stack with Postgres, Kafka, Prometheus, Grafana & Microservices:
docker-compose up --build
```
Access points:
- **Frontend Dashboard**: Open `AetherGuardian.html` in browser.
- **Ingestion REST API**: `http://localhost:8080`
- **Prometheus Metrics Exporter**: `http://localhost:9090`
- **Grafana Dashboard**: `http://localhost:3000` (Default login: `admin` / `admin`)

### Option C — Standalone Local Services
#### Prerequisites
- Java 17+ (JDK 24+ requires Lombok 1.18.36+)
- Python 3.10+
- (Optional) Local Kafka & PostgreSQL

#### 1. Train the ML model
```bash
cd scoring-service
pip install -r requirements.txt
python train_model.py
```
This trains a baseline XGBoost model and serializes it to `fraud_model.json`.

#### 2. Start the ingestion service
```bash
cd ingestion-service
./mvnw spring-boot:run
```
The service starts on `http://localhost:8080` and exposes Prometheus metrics at `/actuator/prometheus`.

#### 3. Start the scoring service
```bash
cd scoring-service
# In production, require explicit connection strings
export DB_URL="postgresql://user:pass@localhost:5432/fraud_db"
python scoring_service.py
```
Exposes Prometheus client metrics on port `8000`.

---

## 🔒 Production Readiness & Security Hardening

### 1. Environment Variables & Secrets Management
Do not hardcode credentials in configuration files. Inject secrets in production via environment variables (e.g. Kubernetes Secrets, AWS Secrets Manager, or HashiCorp Vault):
| Variable | Description |
|----------|-------------|
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | Production DB Username |
| `SPRING_DATASOURCE_PASSWORD` | Production DB Password (must be strong) |
| `APP_JWT_SECRET` | JWT signing secret (minimum 32 characters) |
| `APP_PII_ENCRYPTION_KEY` | Base64-encoded 256-bit AES key for email/phone encryption |
| `DB_URL` | SQLAlchemy Connection URL for Python service |
| `KAFKA_USERNAME` | Kafka SASL username |
| `KAFKA_PASSWORD` | Kafka SASL password |

### 2. TLS/SSL Database & Kafka Connections
- **PostgreSQL Connection Encryption**: Configure the JDBC URL with `ssl=true&sslmode=verify-full` and import the root CA cert. In Python `scoring_service.py`, set environment variables `DB_SSL_CA=/path/to/server-ca.pem` and `DB_SSL_MODE=verify-full`.
- **Kafka SASL_SSL**: Secure client-broker traffic by setting `KAFKA_SECURITY_PROTOCOL=SASL_SSL` and defining the CA cert via `KAFKA_SSL_CA_LOCATION=/path/to/ca.pem`.

### 3. Monitoring Metrics
Both microservices export metrics to Prometheus:
- **Java Ingestion Service**: Exposes core HTTP, JVM, and database connection pool metrics via Micrometer at `/actuator/prometheus` (Port `8080`).
- **Python Scoring Service**: Exposes scoring latency, fraud decision counts, and fallback trigger counts via `prometheus-client` on Port `8000` (`/metrics`).
- Scraping configurations are managed via `monitoring/prometheus.yml`.

---


## 📁 Project Structure
```
AetherGuardian/
├── AetherGuardian.html          # Main frontend application (self-contained)
├── ingestion-service/           # Spring Boot REST API + Kafka producer
│   ├── src/
│   │   └── main/
│   │       ├── java/com/antigravity/fraud/
│   │       │   ├── controller/  # AuthController, TransactionController
│   │       │   ├── domain/      # User, Transaction entities
│   │       │   ├── repository/  # JPA Repositories
│   │       │   └── config/      # SecurityConfig, KafkaConfig
│   │       └── resources/
│   │           ├── application.properties
│   │           └── static/      # Legacy web UI
│   └── pom.xml
├── scoring-service/             # Python ML scoring microservice
│   ├── scoring_service.py       # Kafka consumer + XGBoost scorer
│   └── requirements.txt
├── db/
│   └── init.sql                 # PostgreSQL schema
└── README.md
```

---

## 📸 Dashboard Highlights

- Real-time transaction stream with risk scores
- Fraud reason explainability pills
- Case management and analyst notes
- Shadow model A/B comparison panel
- Impossible travel geofencing alerts
- Behavioral biometric session profiling

---

## 👤 Author

**Bhavika** — Built as a full-stack fraud detection portfolio project demonstrating:
- Multi-layer ML scoring architecture
- Real-time event streaming concepts
- Production security practices (JWT, BCrypt, AES-256)
- Enterprise Spring Boot backend with microservices
