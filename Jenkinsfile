pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        DOCKER_IMAGE = 'expense-analytics-app'
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_HUB_CREDS = 'docker-hub-credentials'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Run Tests') {
            steps {
                sh 'npm --prefix src/server test'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE}:${env.BUILD_NUMBER} -t ${DOCKER_IMAGE}:latest ."
            }
        }

        stage('Push to Container Registry') {
            steps {
                script {
                    try {
                        withCredentials([usernamePassword(credentialsId: "${env.DOCKER_HUB_CREDS}", passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                            sh 'echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin'
                            sh "docker tag ${DOCKER_IMAGE}:${env.BUILD_NUMBER} ${DOCKER_USERNAME}/${DOCKER_IMAGE}:${env.BUILD_NUMBER}"
                            sh "docker tag ${DOCKER_IMAGE}:${env.BUILD_NUMBER} ${DOCKER_USERNAME}/${DOCKER_IMAGE}:latest"
                            sh "docker push ${DOCKER_USERNAME}/${DOCKER_IMAGE}:${env.BUILD_NUMBER}"
                            sh "docker push ${DOCKER_USERNAME}/${DOCKER_IMAGE}:latest"
                            echo "Image pushed successfully to Docker Hub."
                        }
                    } catch (Exception e) {
                        echo "Docker Hub credentials not configured in Jenkins. Tagging image locally: ${e.message}"
                        sh "docker tag ${DOCKER_IMAGE}:${env.BUILD_NUMBER} ${DOCKER_IMAGE}:latest"
                    }
                }
            }
        }

        stage('Deploy Application (CD)') {
            steps {
                script {
                    echo "Deploying updated application to Docker Compose..."
                    sh "docker compose up -d --no-deps app"
                }
            }
        }
    }

    post {
        always {
            emailext(
                to: 'syed.burhan.441@gmail.com,shivagrawal820@gmail.com,shreyan.sachdeva2402@gmail.com',
                subject: "Jenkins | ${env.JOB_NAME} | Build #${env.BUILD_NUMBER} | ${currentBuild.currentResult}",
                body: "Build: #${env.BUILD_NUMBER}\nStatus: ${currentBuild.currentResult}\nJob: ${env.JOB_NAME}\nConsole: ${env.BUILD_URL}console"
            )
        }
    }
}
