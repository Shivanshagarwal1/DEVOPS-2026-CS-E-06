# Expenso DevOps Project — Complete Session & Architecture Summary

## 1. Project Overview
- **Project Name:** Expenso — Personal Expense Analytics System
- **Repository:** `https://github.com/Shivanshagarwal1/DEVOPS-2026-CS-E-06`
- **Tech Stack:**
  - **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6+), Chart.js
  - **Backend:** Node.js, Express.js
  - **Database:** MongoDB & Mongoose
  - **Containerization:** Docker & Docker Compose
  - **Orchestration:** Kubernetes (Kind cluster: `devops-cluster`)
  - **Monitoring & Observability:** Prometheus & Grafana
  - **CI/CD:** Jenkins (`Jenkinsfile`) & GitHub Actions (`.github/workflows/ci-cd.yml`)

---

## 2. Live Links & Local Endpoints

| Service | Location / URL | Credentials / Notes |
| :--- | :--- | :--- |
| **Cloud Production App** | Render.com Live Link | Uses MongoDB Atlas database |
| **Local Web App** | `http://localhost:5000/login.html` | Demo Login: `demo@expense.app` / `demo1234` |
| **Prometheus UI** | `http://localhost:9090` | Metrics & PromQL query engine |
| **Grafana UI** | `http://localhost:3000` | Login: `admin` / `admin` |
| **Grafana Dashboard** | `http://localhost:3000/d/ag2iycj3pedc0e/kubernetes-and-devops-monitoring` | Pre-configured with live charts |
| **Logins JSON File** | `src/server/data/logins.json` | Stores login audit logs via Docker bind mount |

---

## 3. DevOps Implementation Details

### A. Docker & Containerization
- **[`Dockerfile`](./Dockerfile):** Node.js 22 Alpine multi-step build, non-root best practices, layer caching.
- **[`docker-compose.yml`](./docker-compose.yml):** 
  - `app` container on port `5000:5000`.
  - `mongo` container running MongoDB 7 (`mongo:7` to avoid kernel 7.0 compatibility issues).
  - Bind mount `./src/server/data:/app/src/server/data` to persist login attempts in [`logins.json`](./src/server/data/logins.json).
  - Named volume `mongo_data` for database persistence.

### B. Kubernetes Cluster (`devops-cluster`)
- Created using `kind` with port forwardings:
  - Host port `9090` -> `NodePort 30090` (Prometheus)
  - Host port `3000` -> `NodePort 30080` (Grafana)
- Manifests in [`k8s/`](./k8s/):
  - `k8s/kind-config.yaml`: Cluster configuration.
  - `k8s/namespace.yaml`: Dedicated `monitoring` namespace.
  - `k8s/prometheus.yaml`: RBAC, ConfigMap, Deployment, NodePort Service.
  - `k8s/grafana.yaml`: Provisioned Prometheus datasource, Deployment, NodePort Service.
  - `k8s/app.yaml`: Deployment & Service manifests for app & mongo on K8s.

### C. CI/CD Pipelines
- **[`Jenkinsfile`](./Jenkinsfile):**
  1. `Checkout`: Pulls Git repository.
  2. `Run Tests`: Runs `npm test` automated test suite.
  3. `Build Docker Image`: Builds image tagged with `${env.BUILD_NUMBER}`.
  4. `Push to Container Registry`: Tags & pushes image to registry.
  5. `Deploy Application (CD)`: Automated deployment via `docker compose`.
  6. Email notifications to team members on build completion.
- **[`.github/workflows/ci-cd.yml`](./.github/workflows/ci-cd.yml):**
  - Runs unit tests on pull request & push.
  - Automatically builds and publishes Docker image to **GitHub Container Registry (`ghcr.io`)** on push to `main`.
- **[`.github/workflows/auto_weekly_report.yml`](./.github/workflows/auto_weekly_report.yml):**
  - Scheduled weekly cron job to generate Form-3 contribution PDFs.

---

## 4. Useful Commands

```bash
# Start everything locally with sample data & monitoring:
./start.sh

# View Kubernetes pods:
kubectl get pods -n monitoring

# Run automated tests:
npm --prefix src/server test

# Check saved login data:
cat src/server/data/logins.json
```
