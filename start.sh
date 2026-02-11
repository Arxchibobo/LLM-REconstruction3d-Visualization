#!/bin/bash
# Quick start script for reconstruction-3d
# Uses a random port (5100-5999) to avoid conflicts

PORT=$((5100 + RANDOM % 900))

echo "========================================="
echo "  Reconstruction 3D Visualization"
echo "  Starting on port: $PORT"
echo "  URL: http://localhost:$PORT"
echo "========================================="

cd "$(dirname "$0")"
npx next dev -p $PORT
