pipeline {
    agent any

    triggers {
        githubPush()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

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
            )
        }
    }
}
