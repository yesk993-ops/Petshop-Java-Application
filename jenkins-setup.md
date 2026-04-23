# Jenkins Setup for Petshop DevSecOps Pipeline

This document describes how to set up Jenkins to run the CI/CD pipeline defined in `Jenkinsfile`. It includes required plugins, global configuration, and credential setup.

## Prerequisites

- Jenkins instance (version 2.387 or later recommended)
- Docker installed on Jenkins agents (or master)
- kubectl configured with access to your Kubernetes cluster
- Maven (or use the Maven wrapper included in the project)
- Git

## Required Jenkins Plugins

Install the following plugins via Jenkins Plugin Manager:

| Plugin | Purpose | Version |
|--------|---------|---------|
| **Pipeline** | Core plugin for Pipeline as Code | 2.6+ |
| **Docker Pipeline** | Integrate Docker commands in pipeline | 1.28+ |
| **Docker** | Build and publish Docker images | 1.2.9+ |
| **Kubernetes** | Deploy to Kubernetes clusters | 1.31.3+ |
| **Kubernetes CLI** | Run kubectl commands | 1.11.1+ |
| **OWASP Dependency-Check** | Security scanning for dependencies | 5.1.1+ |
| **Trivy** | Container vulnerability scanning | 1.0+ (or use shell command) |
| **JUnit** | Publish test results | 1.57+ |
| **Email Extension** | Send email notifications | 2.96+ |
| **Slack Notification** | Send Slack notifications (optional) | 2.61+ |
| **Credentials Binding** | Securely inject credentials | 2.6+ |
| **Git** | Git integration | 4.14.3+ |
| **Maven Integration** | Maven project support (optional) | 3.22+ |
| **Workspace Cleanup** | Clean workspace after build | 0.41+ |

### Installation Steps

1. Navigate to **Manage Jenkins** → **Manage Plugins** → **Available**.
2. Search for each plugin and install with restart.
3. Alternatively, use the following script (if Jenkins is managed via configuration as code):

```groovy
plugins {
    id 'workflow-aggregator' version '2.6'
    id 'docker-workflow' version '1.28'
    id 'docker-plugin' version '1.2.9'
    id 'kubernetes' version '1.31.3'
    id 'kubernetes-cli' version '1.11.1'
    id 'dependency-check-jenkins-plugin' version '5.1.1'
    id 'junit' version '1.57'
    id 'email-ext' version '2.96'
    id 'slack' version '2.61'
    id 'git' version '4.14.3'
    id 'maven-plugin' version '3.22'
    id 'ws-cleanup' version '0.41'
}
```

## Global Configuration

### 1. Docker Hub Credentials

Add Docker Hub credentials to Jenkins:

- Go to **Manage Jenkins** → **Manage Credentials** → **Global credentials** → **Add Credentials**.
- Choose **Username with password**.
- Set:
  - **Username**: `your-dockerhub-username`
  - **Password**: `your-dockerhub-token` (recommended) or password
  - **ID**: `docker-hub-username` (must match Jenkinsfile)
  - **Description**: `Docker Hub credentials`

### 2. Kubernetes Configuration

If using kubeconfig file:

- Create a secret file credential with your kubeconfig content.
- Add a **Secret file** credential with ID `kubeconfig`.

Alternatively, use Kubernetes plugin to configure a cloud agent (see below).

### 3. Tool Configuration

- **Maven**: Install Maven 3.8+ globally or use the wrapper (already in project).
- **Docker**: Ensure Docker daemon is accessible (Jenkins user in docker group).
- **Trivy**: Install Trivy on Jenkins agents (or use a Docker container).

## Pipeline Configuration

### Create a Pipeline Job

1. Click **New Item** → **Pipeline**.
2. Enter a name (e.g., `petshop-ci-cd`).
3. Under **Pipeline** section:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/your-org/petshop-devsecops.git`
   - Credentials: (if private repo)
   - Branch Specifier: `*/main`
   - Script Path: `Jenkinsfile`
4. Save.

### Environment Variables

The pipeline uses the following environment variables (set via Jenkinsfile or globally):

- `DOCKER_REGISTRY`: `docker.io`
- `DOCKER_IMAGE`: `mydocker3692/petshop`
- `KUBECONFIG`: Path to kubeconfig (if using file credential)

## Running the Pipeline

Once configured, the pipeline will automatically trigger on each push to the repository (if webhooks are set) or can be manually triggered.

### Manual Trigger

1. Go to the job dashboard.
2. Click **Build Now**.

### Automated Trigger via Webhook

1. In Jenkins job configuration, enable **GitHub hook trigger for GITScm polling**.
2. In GitHub repository settings, add a webhook:
   - Payload URL: `https://jenkins.example.com/github-webhook/`
   - Content type: `application/json`
   - Events: `Push` and `Pull Request`

## Pipeline Stages Explained

1. **Checkout**: Clones the repository.
2. **Build**: Compiles the Java application using Maven wrapper.
3. **Unit Tests**: Runs JUnit tests and publishes results.
4. **Integration Tests**: Runs integration tests (if any).
5. **Security Scan - SAST/SCA**: Runs OWASP Dependency Check to identify vulnerable dependencies.
6. **Build Docker Image**: Builds Docker image with tag `BUILD_NUMBER` and `latest`.
7. **Security Scan - Container**: Scans the built Docker image with Trivy for vulnerabilities.
8. **Push Docker Image**: Pushes the image to Docker Hub.
9. **Deploy to Kubernetes**: Applies Kubernetes manifests (deployment, service, ingress).
10. **Smoke Test**: Performs a health check on the deployed application.

## Troubleshooting

### Docker Permission Denied

Ensure the Jenkins user can run Docker commands:

```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### kubectl Not Found

Install kubectl on Jenkins agent or use a container with kubectl.

### OWASP Dependency Check Fails

Ensure the plugin is installed and the Maven goal `dependency-check:check` works locally.

### Trivy Not Installed

Install Trivy on the agent:

```bash
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
```

Or use a Docker container:

```groovy
sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image --exit-code 0 ${DOCKER_IMAGE}:${DOCKER_TAG}'
```

## Customization

- Modify `Jenkinsfile` to suit your environment (e.g., change Docker registry, Kubernetes namespace).
- Add additional stages for performance testing, database migrations, etc.
- Adjust notification settings (email, Slack) in the `post` section.

## References

- [Jenkins Pipeline Syntax](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Docker Pipeline Plugin](https://plugins.jenkins.io/docker-workflow/)
- [OWASP Dependency Check Plugin](https://plugins.jenkins.io/dependency-check-jenkins-plugin/)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)

---

With this setup, you have a complete DevSecOps pipeline running on Jenkins that builds, tests, scans, and deploys the Petshop Java application to Kubernetes.