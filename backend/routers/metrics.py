from fastapi import APIRouter, Response
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

router = APIRouter(
    tags=["Observability"]
)

# Define Metrics
api_requests_total = Counter(
    'api_requests_total',
    'Total number of API requests',
    ['method', 'endpoint', 'status']
)

api_request_duration_seconds = Histogram(
    'api_request_duration_seconds',
    'API request duration in seconds',
    ['method', 'endpoint']
)

ml_predictions_total = Counter(
    'ml_predictions_total',
    'Total number of ML predictions',
    ['model', 'prediction']
)

@router.get("/metrics")
def metrics():
    """
    Prometheus metrics endpoint.
    Exposes application metrics in Prometheus format.
    """
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
