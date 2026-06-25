import json
import logging
import pandas as pd
import xgboost as xgb
from confluent_kafka import Consumer, KafkaError
from sqlalchemy import create_engine, text
import os
import time
from prometheus_client import start_http_server, Counter, Histogram

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Config
KAFKA_BOOTSTRAP_SERVERS = os.environ.get("SPRING_KAFKA_BOOTSTRAP_SERVERS", "localhost:9094")
KAFKA_CONF = {
    'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
    'group.id': 'fraud-scoring-group',
    'auto.offset.reset': 'earliest',
    'session.timeout.ms': 6000,
    'socket.timeout.ms': 60000,
    'connections.max.idle.ms': 540000,
    'api.version.request': 'true',
    'api.version.request.timeout.ms': 10000,
}

# SASL/SSL options for Production Cloud Kafka
if os.environ.get("KAFKA_SECURITY_PROTOCOL") == "SASL_SSL":
    KAFKA_CONF.update({
        'security.protocol': 'SASL_SSL',
        'sasl.mechanism': os.environ.get("KAFKA_SASL_MECHANISM", "SCRAM-SHA-256"),
        'sasl.username': os.environ.get("KAFKA_USERNAME", ""),
        'sasl.password': os.environ.get("KAFKA_PASSWORD", ""),
    })
    if os.environ.get("KAFKA_SSL_CA_LOCATION"):
        KAFKA_CONF['ssl.ca.location'] = os.environ.get("KAFKA_SSL_CA_LOCATION")

DB_URL = os.environ.get("DB_URL")
if not DB_URL:
    logger.warning("DB_URL environment variable is not set. Falling back to local PostgreSQL developer credentials.")
    DB_URL = "postgresql://postgres:postgres@localhost:5432/fraud_db"

# Enable SSL mode in production if certificate path is provided
db_args = {}
if os.environ.get("DB_SSL_CA"):
    db_args["connect_args"] = {
        "sslmode": os.environ.get("DB_SSL_MODE", "verify-full"),
        "sslrootcert": os.environ.get("DB_SSL_CA")
    }

engine = create_engine(DB_URL, **db_args)

# Prometheus Metrics definition
TRANSACTIONS_PROCESSED = Counter(
    'scoring_transactions_processed_total', 
    'Total transactions processed for fraud scoring', 
    ['status']
)
SCORING_LATENCY = Histogram(
    'scoring_latency_seconds', 
    'Latency of transaction scoring in seconds'
)
MODEL_FALLBACK_COUNT = Counter(
    'scoring_model_fallback_total', 
    'Total count of times model fallback was triggered'
)

def load_model():
    # If model exists, load it, otherwise use a placeholder
    model_path = os.environ.get("FRAUD_MODEL_PATH")
    if not model_path:
        model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fraud_model.json')
        
    if os.path.exists(model_path):
        logger.info(f"Loading model from {model_path}...")
        model = xgb.Booster()
        model.load_model(model_path)
        return model
    else:
        logger.warning(f"Model file not found at {model_path}. Falling back to fallback scoring logic.")
    return None

def wait_for_kafka_ready(bootstrap_servers, max_retries=120, retry_delay=2):
    """Wait for Kafka to be ready before connecting."""
    logger.info(f"Waiting for Kafka at {bootstrap_servers} to be ready...")
    
    # We create a temporary config for connection checking
    check_conf = {'bootstrap.servers': bootstrap_servers}
    if KAFKA_CONF.get('security.protocol'):
        check_conf.update({
            'security.protocol': KAFKA_CONF['security.protocol'],
            'sasl.mechanism': KAFKA_CONF['sasl.mechanism'],
            'sasl.username': KAFKA_CONF['sasl.username'],
            'sasl.password': KAFKA_CONF['sasl.password'],
        })
        if KAFKA_CONF.get('ssl.ca.location'):
            check_conf['ssl.ca.location'] = KAFKA_CONF['ssl.ca.location']
            
    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Kafka readiness check (attempt {attempt}/{max_retries})...")
            consumer = Consumer(check_conf)
            md = consumer.list_topics(timeout=5.0)
            consumer.close()
            logger.info("Kafka is ready!")
            return True
        except Exception as e:
            logger.warning(f"Kafka not ready (attempt {attempt}/{max_retries}): {type(e).__name__}: {str(e)[:100]}")
            if attempt < max_retries:
                time.sleep(retry_delay)
    
    logger.error(f"Could not connect to Kafka after {max_retries} attempts. Exiting.")
    return False

def main():
    model = load_model()
    
    # Start Prometheus metrics server
    metrics_port = int(os.environ.get("METRICS_PORT", "8000"))
    try:
        start_http_server(metrics_port)
        logger.info(f"Prometheus metrics exporter started on port {metrics_port}")
    except Exception as e:
        logger.warning(f"Failed to start Prometheus metrics exporter on port {metrics_port}: {e}")
        
    # Wait for Kafka to be ready before creating consumer
    if not wait_for_kafka_ready(KAFKA_BOOTSTRAP_SERVERS, max_retries=120, retry_delay=2):
        logger.error("Failed to connect to Kafka. Exiting.")
        return
    
    # Connection Logic
    try:
        consumer = Consumer(KAFKA_CONF)
        logger.info("Successfully connected to Kafka consumer.")
    except Exception as e:
        logger.error(f"Failed to create Kafka consumer: {e}")
        return

    consumer.subscribe(['transactions.raw'])
    logger.info("Scoring service started...")

    try:
        while True:
            msg = consumer.poll(1.0)
            if msg is None: continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF: continue
                else:
                    logger.error(msg.error())
                    break

            start_time = time.time()
            # Process transaction
            data = json.loads(msg.value().decode('utf-8'))
            tx_id = data.get('id')
            amount = float(data.get('amount'))
            
            # Simple feature engineering for demo
            features = pd.DataFrame([{
                'amount': amount,
                'hour': pd.Timestamp.now().hour,
                'day_of_week': pd.Timestamp.now().dayofweek
            }])
            
            score = 0.5 # Default
            if model:
                dmatrix = xgb.DMatrix(features)
                score = model.predict(dmatrix)[0]
            else:
                MODEL_FALLBACK_COUNT.inc()
                # Fallback randomized logic if no model
                import random
                score = random.uniform(0, 1)

            # Determine status
            status = 'APPROVED'
            if score > 0.8: status = 'FRAUD'
            elif score > 0.5: status = 'SUSPICIOUS'

            # Record metrics
            SCORING_LATENCY.observe(time.time() - start_time)
            TRANSACTIONS_PROCESSED.labels(status=status).inc()

            # Update DB
            with engine.connect() as conn:
                conn.execute(
                    text("UPDATE transactions SET fraud_score = :score, status = :status WHERE id = :id"),
                    {"score": float(score), "status": status, "id": tx_id}
                )
                conn.commit()
            
            logger.info(f"Processed Transaction {tx_id}: Score={score:.4f}, Status={status}")

    finally:
        consumer.close()

if __name__ == "__main__":
    main()
