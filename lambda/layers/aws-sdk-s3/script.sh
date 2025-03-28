#!/bin/bash
cd "$(dirname "$0")"

mkdir nodejs
cd nodejs
npm init -y
npm install @aws-sdk/client-s3
cd ..
zip -r lambda-layer.zip nodejs
