#!/bin/bash
cd "$(dirname "$0")"

mkdir nodejs
cd nodejs
npm init -y
npm install dotenv
cd ..
zip -r lambda-layer.zip nodejs
