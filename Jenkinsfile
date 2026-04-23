pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_IMAGE    = 'mydocker3692/petshop'
        DOCKER_TAG      = "${BUILD_NUMBER}"
        SONAR_HOST_URL  = 'http://192.168.88.128:9000'
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

                junit testResults: '**/surefire-reports/*.xml'
                junit testResults: '**/failsafe-reports/*.xml', allowEmptyResults: true
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withCredentials([
                    string(credentialsId: 'sonarqube', variable: 'SONAR_TOKEN')
                ]) {
                    sh '''
                        ./mvnw sonar:sonar \
                          -Dsonar.host.url=$SONAR_HOST_URL \
                          -Dsonar.login=$SONAR_TOKEN \
                          -Dsonar.projectKey=petshop \
                          -Dsonar.projectVersion=$BUILD_NUMBER
                    '''
                }
            }
        }

        stage('Docker Build & Push') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'docker-hub-cred',
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {
                    sh '''
                        docker logout || true
                        echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin docker.io
                        docker build -t $DOCKER_IMAGE:$DOCKER_TAG -t $DOCKER_IMAGE:latest .
                        docker push $DOCKER_IMAGE:$DOCKER_TAG
                        docker push $DOCKER_IMAGE:latest
                        docker logout
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                    kubectl apply -f k8s/deployment.yaml
                    kubectl apply -f k8s/service.yaml
                '''
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'target/*.jar', allowEmptyArchive: true
            cleanWs()
        }
        failure {
            echo 'Pipeline failed'
        }
        success {
            echo 'Pipeline succeeded'
        }
    }
}
