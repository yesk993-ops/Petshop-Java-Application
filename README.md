# Petshop Java Application - DevSecOps Project

This project demonstrates a complete DevSecOps pipeline for a Java-based Petshop application using Spring Boot, Docker, Kubernetes, and CI/CD with security scanning.

## Overview

The application is a simple REST API for managing pets (CRUD operations). It's built with Spring Boot and includes:

- REST endpoints for pet management
- In-memory H2 database
- OpenAPI/Swagger documentation
- Docker containerization
- Kubernetes deployment manifests
- CI/CD pipeline with GitHub Actions
- Security scanning (SAST, DAST, container scanning)

## Prerequisites

- Java 17+
- Maven 3.6+
- Docker
- Kubernetes cluster (Minikube, Kind, or cloud provider)
- kubectl CLI

## Building the Application

```bash
./mvnw clean package
```

## Running Locally

```bash
./mvnw spring-boot:run
```

The application will be available at `http://localhost:8080`

### API Endpoints

- `GET /api/pets` - List all pets
- `GET /api/pets/{id}` - Get pet by ID
- `POST /api/pets` - Add a new pet (JSON: `{"id": "4", "name": "Rabbit"}`)
- `DELETE /api/pets/{id}` - Delete a pet

### Swagger UI

Open `http://localhost:8080/swagger-ui.html` for API documentation.

### H2 Console

Open `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:testdb`, username: `sa`, password: empty)

## Docker

### Build Docker Image

```bash
docker build -t petshop:latest .
```

### Run Container

```bash
docker run -p 8080:8080 petshop:latest
```

## Kubernetes Deployment

### Apply Manifests

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

### Check Deployment

```bash
kubectl get pods
kubectl get services
kubectl get ingress
```

### Access the Application

If using Minikube:
```bash
minikube service petshop-service
```

Or port-forward:
```bash
kubectl port-forward service/petshop-service 8080:80
```

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) includes:

1. **Build and Test**: Compiles code, runs unit tests
2. **Security Scanning**:
   - SAST: SpotBugs for static code analysis
   - Dependency Check: OWASP for vulnerability scanning
   - Container Scanning: Trivy for Docker image vulnerabilities
3. **Docker Build**: Builds and pushes Docker image to Docker Hub
4. **Kubernetes Deployment**: Deploys to Kubernetes cluster (requires secrets)

### Required Secrets

Set the following secrets in your GitHub repository:

- `DOCKER_USERNAME`: Docker Hub username
- `DOCKER_PASSWORD`: Docker Hub password/token
- `KUBE_CONFIG`: Base64-encoded kubeconfig file

### Manual Trigger

Push to `main` branch or create a pull request to trigger the pipeline.

## Security Scanning

### Static Application Security Testing (SAST)

- **SpotBugs**: Integrated via Maven plugin (`mvn spotbugs:check`)
- Configured in `pom.xml` with `effort: Max` and `threshold: Low`

### Software Composition Analysis (SCA)

- **OWASP Dependency Check**: Scans dependencies for known vulnerabilities
- Runs in CI pipeline and generates HTML report

### Container Security

- **Trivy**: Scans Docker image for vulnerabilities
- Results uploaded to GitHub Security tab

### Dynamic Application Security Testing (DAST)

*Optional*: Can be integrated with OWASP ZAP or similar tools.

## Project Structure

```
.
├── src/                    # Java source code
├── k8s/                    # Kubernetes manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   └── ingress.yaml
├── .github/workflows/      # CI/CD pipelines
│   └── ci-cd.yml
├── Dockerfile              # Docker build instructions
├── .dockerignore
├── pom.xml                 # Maven configuration
├── mvnw, mvnw.cmd         # Maven wrapper
└── README.md               # This file
```

## Monitoring and Observability

The application includes Spring Boot Actuator endpoints (health, metrics, info) at `/actuator`.

## Troubleshooting

### Common Issues

1. **Port already in use**: Change `server.port` in `application.properties`
2. **Docker build fails**: Ensure Docker daemon is running
3. **Kubernetes deployment fails**: Check cluster connectivity and resource limits
4. **Tests failing**: Run `./mvnw test` to see detailed errors

### Logs

```bash
kubectl logs deployment/petshop-deployment
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Open a pull request

## License

MIT