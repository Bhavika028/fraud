import pytest
import os
import pandas as pd
import xgboost as xgb
from unittest.mock import MagicMock, patch
import sys

# Ensure the parent directory is in the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import scoring_service

def test_load_model_fallback():
    # Force loading a non-existent model path
    with patch.dict(os.environ, {"FRAUD_MODEL_PATH": "non_existent_model.json"}):
        model = scoring_service.load_model()
        assert model is None

def test_load_model_exists():
    # We generated fraud_model.json in the previous step
    # Let's verify it loads successfully if the file exists
    model_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'fraud_model.json')
    if os.path.exists(model_path):
        with patch.dict(os.environ, {"FRAUD_MODEL_PATH": model_path}):
            model = scoring_service.load_model()
            assert model is not None
            assert isinstance(model, xgb.Booster)

def test_model_predictions():
    model_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'fraud_model.json')
    if os.path.exists(model_path):
        with patch.dict(os.environ, {"FRAUD_MODEL_PATH": model_path}):
            model = scoring_service.load_model()
            assert model is not None
            
            features = pd.DataFrame([{
                'amount': 500.0,
                'hour': 12,
                'day_of_week': 3
            }])
            dmatrix = xgb.DMatrix(features)
            score = model.predict(dmatrix)[0]
            assert 0.0 <= score <= 1.0
