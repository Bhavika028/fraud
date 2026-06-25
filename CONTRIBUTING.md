# Contributing to AetherGuardian

First off, thank you for considering contributing to AetherGuardian! It is people like you who make the open-source community such an amazing place to learn, inspire, and create.

---

## 🛠️ Development Setup

### Prerequisites
- **Java JDK 17+**
- **Python 3.9+**
- **Docker & Docker Compose** (for running the full production stack)

### Project Structure
- `ingestion-service/`: Spring Boot REST API & Kafka producer.
- `scoring-service/`: Python microservice using XGBoost for fraud scoring.
- `db/`: Database schemas and initializers.
- `monitoring/`: Prometheus and Grafana configuration.

---

## 🧪 Running Tests

### ☕ Java Ingestion Service
We use JUnit 5 for unit and integration testing. Run the test suite using the Maven wrapper:
```bash
cd ingestion-service
./mvnw test
```

### 🐍 Python Scoring Service
We use `pytest` for unit testing. Install dev dependencies and run the tests:
```bash
cd scoring-service
pip install -r requirements.txt
python -m pytest tests/
```

---

## 🐳 Running the Stack with Docker Compose

You can boot up the entire development stack including databases, message brokers, and monitoring with a single command:
```bash
docker-compose up --build
```
This spins up:
- **PostgreSQL** on port `5432`
- **Kafka** on port `9092`/`9094`
- **Ingestion Service** on port `8080`
- **Scoring Service** on port `8000`
- **Prometheus** on port `9090` (scraping metrics from both services)
- **Grafana** on port `3000` (pre-configured to visualize metrics)

---

## 📈 Monitoring & Prometheus Metrics
- **Java Ingestion Service Actuator**: Metrics are exposed at `http://localhost:8080/actuator/prometheus`.
- **Python Scoring Service Metrics**: Metrics are exposed via `prometheus_client` at `http://localhost:8000/metrics`.

---

## 🤝 Code Style & Commit Guidelines
1. **Branching**: Create a feature branch for your changes (e.g. `feature/add-some-metric`).
2. **Lombok**: In Java, we rely on Project Lombok. Ensure your IDE has the Lombok plugin installed and annotation processing enabled.
3. **Typing**: In Python, use docstrings and typing helpers where appropriate.
4. **Pull Requests**: Explain your changes clearly in the PR description, ensure all tests pass (`mvn test` and `pytest`), and provide verification logs.
