pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_IMAGE = 'mydocker3692/petshop'
        DOCKER_TAG = "${env.BUILD_NUMBER}"
        SONAR_HOST_URL = 'http://192.168.88.128:9000/'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
        timeout(time: 20, unit: 'MINUTES')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Test') {
            steps {
                sh './mvnw clean verify -q'
                junit 'target/surefire-reports/*.xml'
                junit 'target/failsafe-reports/*.xml'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withCredentials([string(credentialsId: 'sonarqube', variable: 'SONAR_TOKEN')]) {
                    sh """
                        ./mvnw sonar:sonar \
                          -Dsonar.host.url=${SONAR_HOST_URL} \
                          -Dsonar.login=${SONAR_TOKEN} \
                          -Dsonar.projectKey=petshop \
                          -Dsonar.projectVersion=${env.BUILD_NUMBER}
                    """
                }
            }
        }

        stage('Docker Build & Push') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                    sh """
                        echo ${DOCKER_PASSWORD} | docker login -u ${DOCKER_USERNAME} --password-stdin ${DOCKER_REGISTRY}
                        docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} -t ${DOCKER_IMAGE}:latest .
                        docker push ${DOCKER_IMAGE}:${DOCKER_TAG}
                        docker push ${DOCKER_IMAGE}:latest
                    """
                }
            }
        }

        stage('Security Scan') {
            steps {
                sh """
                    ./mvnw org.owasp:dependency-check-maven:check -q
                    trivy image ${DOCKER_IMAGE}:${DOCKER_TAG} --severity HIGH,CRITICAL --exit-code 0
                """
                archiveArtifacts artifacts: 'target/dependency-check-report.*', allowEmptyArchive: true
            }
        }

        stage('Deploy to Kubernetes') {
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
    }

    post {
        always {
            cleanWs()
            archiveArtifacts artifacts: 'target/*.jar', allowEmptyArchive: true
        }
        success {
            slackSend(color: 'good', message: "Build ${env.BUILD_NUMBER} succeeded for ${env.JOB_NAME}")
        }
        failure {
            slackSend(color: 'danger', message: "Build ${env.BUILD_NUMBER} failed for ${env.JOB_NAME}")
        }
    }
}
