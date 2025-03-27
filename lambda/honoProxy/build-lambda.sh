#!/bin/bash
set -e

PACKAGE_NAME="honoProxy"

# Clean previous builds
rm -rf dist package ${PACKAGE_NAME}.zip

# Build the project using the TypeScript compiler (tsc)
npx tsc

# Create a temporary directory for packaging
mkdir package

# Copy the compiled output into the package directory
cp -R dist/* package/

# Copy package.json (and package-lock.json if needed) to package directory
cp package.json package/
[ -f package-lock.json ] && cp package-lock.json package/

# Install only production dependencies in the package directory
pushd package > /dev/null
npm install --only=production
popd > /dev/null

# Create a zip file containing everything from the package directory at the zip root
cd package
zip -r ../${PACKAGE_NAME}.zip .
cd ..

# Clean up the temporary package directory
rm -rf package

echo "Lambda deployment package created: ${PACKAGE_NAME}.zip"
