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

### Option B — Full Backend Stack

#### Prerequisites
- Java 17+
- Python 3.9+
- (Optional) Apache Kafka + PostgreSQL

#### 1. Start the ingestion service
```bash
cd ingestion-service
./mvnw spring-boot:run
```
The service starts on `http://localhost:8080` and defaults to H2 in-memory DB with mock Kafka.

#### 2. Start the scoring service
```bash
cd scoring-service
pip install -r requirements.txt

# Set your DB connection:
export DB_URL="postgresql://user:pass@localhost:5432/fraud_db"

python scoring_service.py
```

#### 3. Environment Variables (Production)
| Variable | Description |
|----------|-------------|
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | DB username |
| `SPRING_DATASOURCE_PASSWORD` | DB password |
| `APP_JWT_SECRET` | JWT signing secret (min 32 chars) |
| `APP_PII_ENCRYPTION_KEY` | Base64-encoded 256-bit AES key |
| `DB_URL` | Python service DB URL (SQLAlchemy format) |
| `KAFKA_ENABLED` | Set to `true` to use real Kafka |

---

## 🔐 Security Notes
- All passwords stored as **BCrypt hashes**
- PII fields (email, phone) are **AES-256 encrypted** at rest
- JWT tokens expire after 24 hours
- No credentials are hardcoded — all secrets are loaded from environment variables

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
