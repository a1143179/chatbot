# Branch Protection Setup Guide

This guide explains how to set up branch protection rules to prevent Pull Requests from being merged before all tests pass.

## What We've Set Up

1. **CI Workflow** (`.github/workflows/ci.yml`)
   - Runs on every PR and push to main
   - Tests frontend (linting, type checking, unit tests, build)
   - Tests API (linting, unit tests, coverage)
   - Runs full test suite as final validation

## How to Configure Branch Protection Rules

### Step 1: Go to Repository Settings

1. Navigate to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Branches**

### Step 2: Add Branch Protection Rule

1. Click **Add rule** or **Add branch protection rule**
2. In the **Branch name pattern** field, enter: `main`
3. Check the following options:

#### Required Status Checks
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**
- In the search box, add these status checks:
  - `test-frontend`
  - `test-api` 
  - `full-test`

#### Additional Protection
- ✅ **Require a pull request before merging**
- ✅ **Require approvals** (optional: set to 1 or more)
- ✅ **Dismiss stale PR approvals when new commits are pushed**
- ✅ **Require review from code owners** (if you have a CODEOWNERS file)

#### Restrictions
- ✅ **Restrict pushes that create files that cannot be deleted**
- ✅ **Require linear history** (optional, but recommended)

### Step 3: Save the Rule

Click **Create** or **Save changes** at the bottom of the page.

## What This Achieves

### Before Protection
- Anyone could merge PRs directly
- Tests could be failing
- Code quality issues could slip through

### After Protection
- ✅ **Tests must pass** before merge is allowed
- ✅ **Linting must pass** before merge is allowed
- ✅ **Type checking must pass** before merge is allowed
- ✅ **Build must succeed** before merge is allowed
- ✅ **Branch must be up to date** with main
- ✅ **All CI jobs must complete successfully**

## Status Check Names

The following status checks will appear in your PRs:

1. **test-frontend** - Frontend linting, type checking, tests, and build
2. **test-api** - API linting, tests, and coverage
3. **full-test** - Complete test suite validation

## Troubleshooting

### If Tests Are Failing Locally But Passing in CI
- Ensure you're using the same Node.js version (18.x)
- Run `npm ci` instead of `npm install` to match CI
- Check that all dependencies are properly installed

### If Status Checks Don't Appear
- Make sure the CI workflow file is in the correct location: `.github/workflows/ci.yml`
- Check that the workflow runs on the correct branches
- Verify the job names match what you're requiring in branch protection

### If You Need to Bypass Protection (Emergency)
- Only repository administrators can bypass branch protection
- Go to the PR and click "Merge" with bypass option
- This should only be used in emergencies

## Testing the Setup

1. Create a new branch: `git checkout -b test-branch-protection`
2. Make a small change that breaks tests
3. Push and create a PR
4. Verify that the merge button is disabled until tests pass
5. Fix the tests and verify the merge button becomes available

## Additional Recommendations

### Pre-commit Hooks
Consider adding pre-commit hooks to catch issues before pushing:

```bash
# Install husky and lint-staged
npm install --save-dev husky lint-staged

# Add to package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "git add"
    ]
  }
}
```

### Code Owners
Create a `.github/CODEOWNERS` file to automatically request reviews from specific team members:

```
# Global owners
* @your-username

# Frontend files
/src/ @frontend-team

# API files
/api/ @backend-team
```

This setup ensures code quality and prevents broken code from reaching your main branch! 