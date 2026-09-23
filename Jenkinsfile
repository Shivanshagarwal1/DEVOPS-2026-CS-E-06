pipeline {
    agent any

dev-Shivansh
    triggers {
        githubPush()
    }


main
    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

dev-Shivansh
        stage('Run Tests') {
            steps {
                dir('signup') {
                    sh 'node test.js'
                }
            }
        }
    }

    post {

        success {
            emailext(
                to: 'YOUR_EMAIL@gmail.com',
                subject: "Jenkins SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
Build successful.

Job: ${env.JOB_NAME}
Build: #${env.BUILD_NUMBER}
Status: SUCCESS

Tests passed successfully.

Console:
${env.BUILD_URL}console
"""
            )
        }

        failure {
            emailext(
                to: 'syed.burhan.441@gmail.com',
                subject: "Jenkins FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
Build failed.

Job: ${env.JOB_NAME}
Build: #${env.BUILD_NUMBER}
Status: FAILURE

Please check the Jenkins console output:

${env.BUILD_URL}console
"""

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
                body: '$DEFAULT_CONTENT',
                mimeType: 'text/html'
main
            )
        }
    }
}
