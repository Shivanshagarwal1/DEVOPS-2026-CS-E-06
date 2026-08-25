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
                to: 'YOUR_EMAIL@gmail.com',
                subject: "Jenkins Build #${BUILD_NUMBER} - ${currentBuild.currentResult}",
                body: """
                    <h2>Jenkins Build Report</h2>

                    <p><b>Project:</b> ${JOB_NAME}</p>
                    <p><b>Build:</b> #${BUILD_NUMBER}</p>
                    <p><b>Status:</b> ${currentBuild.currentResult}</p>
                    <p><b>Branch:</b> ${env.BRANCH_NAME}</p>
                    <p><b>Build URL:</b>
                        <a href="${BUILD_URL}">${BUILD_URL}</a>
                    </p>

                    <h3>Pipeline</h3>
                    <ul>
                        <li>Checkout</li>
                        <li>Build</li>
                        <li>Test</li>
                    </ul>
                """,
                mimeType: 'text/html',
                attachLog: true
            )
        }
    }
}
