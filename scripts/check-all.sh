#!/bin/bash

echo "🔍 Running all quality checks..."

# Run linting
echo "📝 Running ESLint..."
npm run lint
LINT_EXIT_CODE=$?

# Run type checking
echo "🔧 Running TypeScript type check..."
npm run type-check
TYPE_CHECK_EXIT_CODE=$?

# Run tests
echo "🧪 Running tests..."
npm run test
TEST_EXIT_CODE=$?

# Summary
echo ""
echo "📊 Quality Check Summary:"
echo "  ESLint: $([ $LINT_EXIT_CODE -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")"
echo "  Type Check: $([ $TYPE_CHECK_EXIT_CODE -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")"
echo "  Tests: $([ $TEST_EXIT_CODE -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")"

# Exit with error if any check failed
if [ $LINT_EXIT_CODE -ne 0 ] || [ $TYPE_CHECK_EXIT_CODE -ne 0 ] || [ $TEST_EXIT_CODE -ne 0 ]; then
    echo ""
    echo "❌ Some checks failed. Please fix the issues before committing."
    exit 1
fi

echo ""
echo "✅ All quality checks passed!" 