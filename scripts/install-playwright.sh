#!/bin/bash

echo "Installing Playwright browsers..."

# Install all browsers with dependencies
npx playwright install --with-deps

echo "Playwright browsers installed successfully!"
echo ""
echo "You can now run E2E tests with:"
echo "  npm run test:e2e           # Run all tests"
echo "  npm run test:e2e:ui        # Run with UI mode"
echo "  npm run test:e2e:debug     # Run in debug mode"
echo ""
echo "To run specific browser tests:"
echo "  npm run test:e2e -- --project=chromium"
echo "  npm run test:e2e -- --project=firefox"
echo "  npm run test:e2e -- --project=webkit"