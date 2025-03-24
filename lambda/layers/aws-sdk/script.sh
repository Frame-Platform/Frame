#!/bin/bash
mkdir nodejs
cd nodejs
npm init -y
npm install aws-sdk
cd ..
zip -r lambda-layer.zip nodejs
