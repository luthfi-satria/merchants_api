pipeline {
  agent any
  tools {nodejs "node"}

  stages {
    stage('Install dependencies') {
      steps {
        sh 'npm install --force'
      }
    }

    stage('Test') {
      steps {
         sh 'npm test'
      }
    }

    stage('Test Cov') {
      steps {
         sh 'npm run test:cov'
      }
    }

    stage('Sonarqube') {
      environment {
        scannerHome = tool 'sonarqube-scanner'
      }

      steps {
        withSonarQubeEnv(installationName: 'sonarqube') {
          sh "${scannerHome}/bin/sonar-scanner"
        }
      }
    }

  }
}
