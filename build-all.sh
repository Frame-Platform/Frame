#!/bin/bash
set -e

LAMBDA_DIR="./lambda"
DIST_DIR="$LAMBDA_DIR/lambdaDist"
LAMBDAS=("honoProxy" "ingestionLambda" "searchLambda")

# Execute build scripts for lambdas
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


# Execute scripts for lambda layers
LAYER_ROOT="lambda/layers"

for layer_dir in "$LAYER_ROOT"/*/ ; do
  layer_name=$(basename "$layer_dir")

  # Skip the 'sharp' folder
  if [ "$layer_name" == "sharp" ]; then
    echo "⏭️  Skipping layer: $layer_name"
    continue
  fi

  script_path="$layer_dir/script.sh"
  echo "🔧 Building layer: $layer_name"

  if [ -f "$script_path" ]; then
    (
      cd "$layer_dir"
      chmod +x script.sh
      ./script.sh
    )
    echo "✅ Finished building: $layer_name"
  else
    echo "⚠️  Warning: No script.sh found in $layer_name"
  fi
done

echo "🏁 All layer scripts executed."
