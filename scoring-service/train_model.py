import xgboost as xgb
import pandas as pd
import numpy as np
import os

def main():
    print("Generating synthetic data for model training...")
    np.random.seed(42)
    
    # 1000 synthetic transaction records
    n_samples = 1000
    amounts = np.random.exponential(scale=150, size=n_samples) # mostly small, some large
    hours = np.random.randint(0, 24, size=n_samples)
    days = np.random.randint(0, 7, size=n_samples)
    
    # Logic: High risk if large amount OR night hours combined with higher amounts
    fraud_prob = 0.05 + 0.3 * (amounts > 800) + 0.2 * ((hours < 5) & (amounts > 300))
    # Clamp probability
    fraud_prob = np.clip(fraud_prob, 0, 1)
    labels = np.random.binomial(1, fraud_prob)
    
    df = pd.DataFrame({
        'amount': amounts,
        'hour': hours,
        'day_of_week': days
    })
    
    print(f"Training data info: {len(df)} samples, {labels.sum()} positive (fraud) cases.")
    
    # Train XGBoost model
    dtrain = xgb.DMatrix(df, label=labels)
    params = {
        'max_depth': 4,
        'eta': 0.1,
        'objective': 'binary:logistic',
        'eval_metric': 'logloss'
    }
    
    print("Training XGBoost booster...")
    bst = xgb.train(params, dtrain, num_boost_round=20)
    
    output_path = os.path.join(os.path.dirname(__file__), 'fraud_model.json')
    bst.save_model(output_path)
    print(f"Model successfully saved to {output_path}")

if __name__ == '__main__':
    main()
