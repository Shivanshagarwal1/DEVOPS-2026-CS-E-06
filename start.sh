#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=========================================================="
echo "  Starting Expenso DevOps Project from Scratch"
echo "=========================================================="

echo "[1/4] Starting Application & MongoDB via Docker Compose..."
docker compose up -d

echo "[2/4] Waiting for MongoDB & Seeding Sample Data..."
sleep 3
docker exec expense-analytics-app npm run seed || true

echo "[3/4] Ensuring Kubernetes Cluster & Monitoring Stack..."
if ! kubectl cluster-info --context kind-devops-cluster >/dev/null 2>&1; then
  echo "Creating Kind Kubernetes cluster (devops-cluster)..."
  kind create cluster --config k8s/kind-config.yaml
fi

kubectl config use-context kind-devops-cluster
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/prometheus.yaml
kubectl apply -f k8s/grafana.yaml

echo "Waiting for Grafana to be ready..."
for i in {1..30}; do
  if curl -s -u admin:admin http://localhost:3000/api/health >/dev/null 2>&1; then
    curl -s -u admin:admin -X POST http://localhost:3000/api/dashboards/db \
      -H "Content-Type: application/json" \
      -d @k8s/dashboard.json >/dev/null 2>&1 || true
    break
  fi
  sleep 1
done

echo "[4/4] Verifying Stack Status..."
echo ""
echo "=== Docker Containers ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== Kubernetes Monitoring Pods ==="
kubectl get pods -n monitoring

echo ""
echo "=========================================================="
echo "  All Services are Live!"
echo "=========================================================="
echo "  1. Expenso Web App:  http://localhost:5000/login.html"
echo "     Demo Login:       demo@expense.app / demo1234"
echo "  2. Prometheus:       http://localhost:9090"
echo "  3. Grafana:          http://localhost:3000 (admin / admin)"
echo "     Dashboard:        http://localhost:3000/d/ag2iycj3pedc0e/kubernetes-and-devops-monitoring"
echo "  4. Logins JSON file: src/server/data/logins.json"
echo "=========================================================="
echo ""
echo "To share a public LIVE HTTPS link with your teacher, run:"
echo "  cloudflared tunnel --url http://localhost:5000"
echo "=========================================================="
