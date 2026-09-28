pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        DOCKER_IMAGE = 'expense-analytics-app'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE}:${env.BUILD_NUMBER} ."
            }
        }

        stage('Run Tests') {
            steps {
                // Adjust this if you have a specific test script for your server
                sh 'echo "Running tests... (Replace this with actual test command if needed)"'
            }
        }
    }

    post {
        success {
            emailext(
                to: 'syed.burhan.441@gmail.com,shivagrawal820@gmail.com,shreyan.sachdeva2402@gmail.com',
                subject: "Jenkins SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "Build successful.\n\nJob: ${env.JOB_NAME}\nBuild: #${env.BUILD_NUMBER}\nStatus: SUCCESS\n\nConsole:\n${env.BUILD_URL}console"
            )
        }
        failure {
            emailext(
                to: 'syed.burhan.441@gmail.com,shivagrawal820@gmail.com,shreyan.sachdeva2402@gmail.com',
                subject: "Jenkins FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "Build failed.\n\nJob: ${env.JOB_NAME}\nBuild: #${env.BUILD_NUMBER}\nStatus: FAILURE\n\nPlease check the Jenkins console output:\n${env.BUILD_URL}console"
            )
        }
    }
}
