import json
import logging
import pandas as pd
import xgboost as xgb
from confluent_kafka import Consumer, KafkaError, BrokerProperties
from sqlalchemy import create_engine, text
import os
import time
import socket

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Config
KAFKA_CONF = {
    'bootstrap.servers': 'localhost:9094',
    'group.id': 'fraud-scoring-group',
    'auto.offset.reset': 'earliest',
    'session.timeout.ms': 6000,
    'socket.timeout.ms': 60000,
    'connections.max.idle.ms': 540000,
    'api.version.request': 'true',
    'api.version.request.timeout.ms': 10000,
}
DB_URL = os.environ.get("DB_URL", "postgresql://admin:changeme@localhost:5432/fraud_db")
engine = create_engine(DB_URL)

def load_model():
    # If model exists, load it, otherwise use a placeholder
    if os.path.exists('fraud_model.json'):
        model = xgb.Booster()
        model.load_model('fraud_model.json')
        return model
    return None

def wait_for_kafka_ready(bootstrap_servers, max_retries=120, retry_delay=2):
    """Wait for Kafka to be ready before connecting."""
    logger.info(f"Waiting for Kafka at {bootstrap_servers} to be ready...")
    
    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Kafka readiness check (attempt {attempt}/{max_retries})...")
            consumer = Consumer({'bootstrap.servers': bootstrap_servers})
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
    
    # Wait for Kafka to be ready before creating consumer
    if not wait_for_kafka_ready('localhost:9094', max_retries=120, retry_delay=2):
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

            # Process transaction
            data = json.loads(msg.value().decode('utf-8'))
            tx_id = data.get('id')
            amount = float(data.get('amount'))
            
            # Simple feature engineering for demo
            # In real case, we'd fetch user history, velocity, etc.
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
                # Fallback randomized logic if no model
                import random
                score = random.uniform(0, 1)

            # Determine status
            status = 'APPROVED'
            if score > 0.8: status = 'FRAUD'
            elif score > 0.5: status = 'SUSPICIOUS'

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
