pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                sh 'echo "Building project..."'
            }
        }

        stage('Test') {
            steps {
                sh 'echo "Running tests..."'
            }
        }
    }

    post {
        always {
            emailext(
                to: 'syed.burhan.441@gmail.com,shivagrawal820@gmail.com,shreyan.sachdeva2402@gmail.com',
                subject: "Jenkins | ${JOB_NAME} | Build #${BUILD_NUMBER} | ${currentBuild.currentResult}",
                mimeType: 'text/html'
            )
        }
    }
}
