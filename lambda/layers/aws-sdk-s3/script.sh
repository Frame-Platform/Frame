#!/bin/bash
mkdir nodejs
cd nodejs
npm init -y
npm install @aws-sdk/client-s3
cd ..
zip -r lambda-layer.zip nodejs
