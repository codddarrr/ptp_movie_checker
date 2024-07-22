#!/bin/sh
cd src || exit

# Run npm install silently
npm install --silent

if [ "$NODE_ENV" = "development" ]; then
  # Run both the watch and the server concurrently
  npx concurrently "npm run watch" "npm start"
else
  # Run build with minimal output
  NODE_ENV=production npm run build --silent -- --no-stats
  npm start
fi