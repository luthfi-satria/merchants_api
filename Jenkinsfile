pipeline {
  agent any
  environment {
    scannerHome = tool 'sonarqube-scanner'
  }
  tools {nodejs "node"}

  stages {
    stage('Test') {
      agent {
        docker {
          image 'node:14.17.0'
          args '-u root:sudo'
          reuseNode true
        }
      }

      steps {
        sh 'node --version'
        sh 'npm install'
        sh 'npm test'
        sh 'npm run test:cov'
      }
    }

    stage('Scan Code') {
      when {
        expression { BRANCH_NAME ==~ /(development|jenkins)/ }
      }
      steps {
        sh 'ls -al'
        withSonarQubeEnv(installationName: 'sonarqube') {
          sh "${scannerHome}/bin/sonar-scanner"
        }
      }
    }

    stage('Deploy to K8s Dev') {
      when {
        expression { BRANCH_NAME ==~ /(development|jenkins)/ }
      }
      agent {
        docker {
          image 'gcr.io/k8s-skaffold/skaffold:v1.15.0'
          args '-u root:sudo -v /var/run/docker.sock:/var/run/docker.sock'
          reuseNode true
        }
      }

      steps {
        withCredentials([kubeconfigFile(credentialsId: 'kubeconfig_efood_dev', variable: 'KUBECONFIG')]) {
          withCredentials([string(credentialsId: 'pat_token', variable: 'CR_PAT')]) {
            sh 'echo $CR_PAT | docker login ghcr.io -u eristemena --password-stdin'

            sh 'skaffold run'
          }
        }
      }
    }
  }
}
