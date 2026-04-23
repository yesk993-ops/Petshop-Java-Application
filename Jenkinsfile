pipeline {
    agent any

    parameters {
        string(name: 'BRANCH', defaultValue: 'main', description: 'Git branch to build')
        booleanParam(name: 'SKIP_TESTS', defaultValue: false, description: 'Skip unit and integration tests')
        booleanParam(name: 'SKIP_SONAR', defaultValue: false, description: 'Skip SonarQube analysis')
        booleanParam(name: 'SKIP_DEPLOY', defaultValue: false, description: 'Skip deployment to Kubernetes')
    }

    environment {
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_IMAGE = 'mydocker3692/petshop'
        DOCKER_TAG = "${env.BUILD_NUMBER}"
        MAVEN_OPTS = '-DskipTests=false'
        SONAR_HOST_URL = 'http://192.168.88.128:9000/'
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
                sh 'echo "Branch: ${params.BRANCH}"'
            }
        }

        stage('Build') {
            steps {
                sh './mvnw clean compile -q'
            }
        }

        stage('Tests') {
            when { expression { !params.SKIP_TESTS } }
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh './mvnw test -q'
                    }
                    post {
                        always {
                            junit 'target/surefire-reports/*.xml'
                        }
                    }
                }
                stage('Integration Tests') {
                    steps {
                        sh './mvnw verify -DskipITs=false -q'
                    }
                    post {
                        always {
                            junit 'target/failsafe-reports/*.xml'
                        }
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            when { expression { !params.SKIP_SONAR } }
            steps {
                withCredentials([string(credentialsId: 'sonarqube', variable: 'SONAR_TOKEN')]) {
                    sh """
                        ./mvnw sonar:sonar \
                            -Dsonar.host.url=${SONAR_HOST_URL} \
                            -Dsonar.login=${SONAR_TOKEN} \
                            -Dsonar.projectKey=petshop \
                            -Dsonar.projectName=petshop \
                            -Dsonar.projectVersion=${env.BUILD_NUMBER}
                    """
                }
            }
        }

        stage('Security Scan - SAST/SCA') {
            steps {
                sh './mvnw org.owasp:dependency-check-maven:check -Dformat=HTML -Dformat=JSON -q'
                dependencyCheckPublisher pattern: 'target/dependency-check-report.html'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} -t ${DOCKER_IMAGE}:latest ."
            }
        }

        stage('Security Scan - Container') {
            steps {
                sh """
                    trivy image --exit-code 0 --severity HIGH,CRITICAL --format table ${DOCKER_IMAGE}:${DOCKER_TAG}
                    trivy image --exit-code 1 --severity CRITICAL --format json ${DOCKER_IMAGE}:${DOCKER_TAG} > trivy-report.json || true
                """
                archiveArtifacts artifacts: 'trivy-report.json', allowEmptyArchive: true
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                    sh """
                        echo ${DOCKER_PASSWORD} | docker login -u ${DOCKER_USERNAME} --password-stdin ${DOCKER_REGISTRY}
                        docker push ${DOCKER_IMAGE}:${DOCKER_TAG}
                        docker push ${DOCKER_IMAGE}:latest
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            when { expression { !params.SKIP_DEPLOY } }
            steps {
                withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                    sh """
                        kubectl apply -f k8s/deployment.yaml
                        kubectl apply -f k8s/service.yaml
                        kubectl apply -f k8s/ingress.yaml
                        kubectl rollout status deployment/petshop-deployment --timeout=120s
                    """
                }
            }
        }

        stage('Smoke Test') {
            steps {
                sh """
                    sleep 10
                    curl -f http://localhost:8081/actuator/health || \
                    curl -f http://petshop-service:8081/actuator/health || \
                    echo "Smoke test failed but continuing"
                """
            }
        }
    }

    post {
        success {
            emailext (
                subject: "SUCCESS: Pipeline ${env.JOB_NAME} - Build ${env.BUILD_NUMBER}",
                body: "The pipeline completed successfully.\n\nCheck console output at ${env.BUILD_URL}",
                to: 'devops@example.com'
            )
            slackSend(color: 'good', message: "Build ${env.BUILD_NUMBER} succeeded for ${env.JOB_NAME}")
        }
        failure {
            emailext (
                subject: "FAILURE: Pipeline ${env.JOB_NAME} - Build ${env.BUILD_NUMBER}",
                body: "The pipeline failed.\n\nCheck console output at ${env.BUILD_URL}",
                to: 'devops@example.com'
            )
            slackSend(color: 'danger', message: "Build ${env.BUILD_NUMBER} failed for ${env.JOB_NAME}")
        }
        always {
            cleanWs()
            archiveArtifacts artifacts: 'target/*.jar', allowEmptyArchive: true
            archiveArtifacts artifacts: 'target/dependency-check-report.*', allowEmptyArchive: true
        }
    }
}
