#!/bin/bash
mkdir nodejs
cd nodejs
npm init -y
npm install hono zod @hono/zod-openapi
cd ..
zip -r lambda-layer.zip nodejs
