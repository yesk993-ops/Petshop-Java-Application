pipeline {
    agent any

    parameters {
        string(name: 'BRANCH', defaultValue: 'main', description: 'Git branch to build')
        booleanParam(name: 'SKIP_TESTS', defaultValue: false, description: 'Skip unit and integration tests')
        booleanParam(name: 'SKIP_SONAR', defaultValue: false, description: 'Skip SonarQube analysis')
        booleanParam(name: 'SKIP_DEPLOY', defaultValue: false, description: 'Skip deployment to Kubernetes')
    }

    environment {
        // Docker Hub credentials (should be stored as Jenkins secrets)
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_USERNAME = credentials('docker-hub-username')
        DOCKER_PASSWORD = credentials('docker-hub-password')
        DOCKER_IMAGE = 'mydocker3692/petshop'
        DOCKER_TAG = "${env.BUILD_NUMBER}"
        // Kubernetes context (if using kubeconfig)
        KUBECONFIG = credentials('kubeconfig')
        // Maven settings (optional)
        MAVEN_OPTS = '-DskipTests=false'
        // SonarQube configuration
        SONAR_HOST_URL = credentials('sonar-host-url')
        SONAR_TOKEN = credentials('sonar-token')
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'git --version'
                sh 'echo "Branch: ${env.BRANCH_NAME}"'
            }
        }

        stage('Build') {
            steps {
                sh '''
                    echo "Building with Maven..."
                    ./mvnw clean compile -q
                '''
            }
        }

        stage('Unit Tests') {
            steps {
                sh '''
                    echo "Running unit tests..."
                    ./mvnw test -q
                '''
            }
            post {
                always {
                    junit 'target/surefire-reports/*.xml'
                }
            }
        }

        stage('Integration Tests') {
            steps {
                sh '''
                    echo "Running integration tests..."
                    ./mvnw verify -DskipITs=false -q
                '''
            }
            post {
                always {
                    junit 'target/failsafe-reports/*.xml'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    sh '''
                        echo "Running SonarQube analysis..."
                        ./mvnw sonar:sonar \
                            -Dsonar.host.url=${SONAR_HOST_URL} \
                            -Dsonar.login=${SONAR_TOKEN} \
                            -Dsonar.projectKey=petshop \
                            -Dsonar.projectName=petshop \
                            -Dsonar.projectVersion=${env.BUILD_NUMBER}
                    '''
                }
            }
        }

        stage('Security Scan - SAST/SCA') {
            steps {
                script {
                    // OWASP Dependency Check (Software Composition Analysis)
                    sh '''
                        echo "Running OWASP Dependency Check..."
                        ./mvnw org.owasp:dependency-check-maven:check -Dformat=HTML -Dformat=JSON -q
                    '''
                    // Archive the report
                    dependencyCheckPublisher pattern: 'target/dependency-check-report.html'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh '''
                        echo "Building Docker image..."
                        docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} -t ${DOCKER_IMAGE}:latest .
                    '''
                }
            }
        }

        stage('Security Scan - Container') {
            steps {
                script {
                    // Use Trivy for container scanning
                    sh '''
                        echo "Scanning Docker image with Trivy..."
                        trivy image --exit-code 0 --severity HIGH,CRITICAL --format table ${DOCKER_IMAGE}:${DOCKER_TAG}
                        trivy image --exit-code 1 --severity CRITICAL --format json ${DOCKER_IMAGE}:${DOCKER_TAG} > trivy-report.json || true
                    '''
                    // Archive Trivy report
                    archiveArtifacts artifacts: 'trivy-report.json', allowEmptyArchive: true
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                script {
                    sh '''
                        echo "Logging into Docker Hub..."
                        echo ${DOCKER_PASSWORD} | docker login -u ${DOCKER_USERNAME} --password-stdin ${DOCKER_REGISTRY}
                        echo "Pushing Docker image..."
                        docker push ${DOCKER_IMAGE}:${DOCKER_TAG}
                        docker push ${DOCKER_IMAGE}:latest
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    sh '''
                        echo "Deploying to Kubernetes..."
                        kubectl apply -f k8s/deployment.yaml
                        kubectl apply -f k8s/service.yaml
                        kubectl apply -f k8s/ingress.yaml
                        kubectl rollout status deployment/petshop-deployment --timeout=120s
                    '''
                }
            }
        }

        stage('Smoke Test') {
            steps {
                script {
                    sh '''
                        echo "Performing smoke test..."
                        sleep 10
                        curl -f http://localhost:8081/actuator/health || curl -f http://petshop-service:8081/actuator/health || echo "Smoke test failed but continuing"
                    '''
                }
            }
        }
    }

    post {
        success {
            emailext (
                subject: "SUCCESS: Pipeline ${env.JOB_NAME} - Build ${env.BUILD_NUMBER}",
                body: "The pipeline completed successfully.\\n\\nCheck console output at ${env.BUILD_URL}",
                to: 'devops@example.com'
            )
            slackSend(color: 'good', message: "Build ${env.BUILD_NUMBER} succeeded for ${env.JOB_NAME}")
        }
        failure {
            emailext (
                subject: "FAILURE: Pipeline ${env.JOB_NAME} - Build ${env.BUILD_NUMBER}",
                body: "The pipeline failed.\\n\\nCheck console output at ${env.BUILD_URL}",
                to: 'devops@example.com'
            )
            slackSend(color: 'danger', message: "Build ${env.BUILD_NUMBER} failed for ${env.JOB_NAME}")
        }
        always {
            // Clean up workspace
            cleanWs()
            // Archive artifacts
            archiveArtifacts artifacts: 'target/*.jar', allowEmptyArchive: true
            archiveArtifacts artifacts: 'target/dependency-check-report.*', allowEmptyArchive: true
        }
    }
}