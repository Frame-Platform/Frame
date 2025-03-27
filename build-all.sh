#!/bin/bash
set -e

LAMBDA_DIR="./lambda"
DIST_DIR="$LAMBDA_DIR/lambdaDist"
LAMBDAS=("honoProxy" "ingestionLambda" "searchLambda")

# Make sure lambdaDist exists and is clean
mkdir -p "$DIST_DIR"
rm -f "$DIST_DIR"/*.zip

for name in "${LAMBDAS[@]}"; do
  echo "📦 Building Lambda: $name"
  (
    cd "$LAMBDA_DIR/$name"
    npm install
    npm run build:lambda

    ZIP_FILE="${name}.zip"
    if [ -f "$ZIP_FILE" ]; then
      cp "$ZIP_FILE" "../lambdaDist/"
      echo "📁 Copied $ZIP_FILE to lambdaDist"
    else
      echo "⚠️  Warning: Expected zip file $ZIP_FILE not found in $name"
    fi
  )
done

echo "✅ All Lambda builds complete. Zips are in: $DIST_DIR"
