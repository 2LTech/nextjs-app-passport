#!/bin/bash

set -e

# Check SONAR_TOKEN
if [ -z "$SONAR_TOKEN" ]; then
  echo "SONAR_TOKEN environment variable not defined"
  exit 1
fi

sonar \
  -Dsonar.host.url=https://sonarcloud.io \
  -Dsonar.token="${SONAR_TOKEN}" \
  -Dsonar.organization=2ltech \
  -Dsonar.projectKey=2LTech_nextjs-app-passport \
  -Dsonar.sources=src \
  -Dsonar.test.inclusions=tests/**/*.test.ts \
  -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
