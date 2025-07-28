# GitHub Pages Setup Guide

## Option 1: Deploy to `docs` folder (Recommended)

This approach deploys your React app to a `docs` folder in your main branch, which GitHub Pages can serve.

### Setup Steps:

1. **Enable GitHub Pages**:
   - Go to your repository → Settings → Pages
   - Source: Select "Deploy from a branch"
   - Branch: Select "main"
   - Folder: Select "/ (root)"
   - Click "Save"

2. **Configure GitHub Pages to use docs folder**:
   - Go to your repository → Settings → Pages
   - Source: Select "Deploy from a branch"
   - Branch: Select "main"
   - Folder: Select "/docs"
   - Click "Save"

3. **Deploy manually**:
   ```bash
   npm run deploy
   git add docs/
   git commit -m "Deploy to GitHub Pages"
   git push
   ```

4. **Automatic deployment**:
   - The GitHub Actions workflow will automatically deploy to `docs` folder on push to main
   - Your site will be available at: `https://your-username.github.io/your-repo-name`

## Option 2: Deploy to `gh-pages` branch

If you prefer using a separate branch:

1. **Enable GitHub Pages**:
   - Go to your repository → Settings → Pages
   - Source: Select "Deploy from a branch"
   - Branch: Select "gh-pages"
   - Click "Save"

2. **Update workflow**:
   ```yaml
   - name: Deploy to GitHub Pages
     uses: peaceiris/actions-gh-pages@v3
     with:
       github_token: ${{ secrets.GITHUB_TOKEN }}
       publish_dir: ./build
       publish_branch: gh-pages
       force_orphan: true
   ```

## Troubleshooting

### Common Issues:

1. **404 Error**: Make sure your React app has proper routing
   - Add `basename` to your Router if using React Router
   - Or use HashRouter instead of BrowserRouter

2. **Assets not loading**: Check if paths are relative
   - Update `package.json` homepage field if needed
   - Ensure all asset paths are relative

3. **Build fails**: Check for TypeScript errors
   ```bash
   npm run build
   ```

### Manual Deployment Commands:

```bash
# Build the app
npm run build

# Create docs folder and copy files
mkdir -p docs
cp -r build/* docs/

# Commit and push
git add docs/
git commit -m "Deploy to GitHub Pages"
git push
```

## Configuration Files

### package.json (if using homepage)
```json
{
  "homepage": "https://your-username.github.io/your-repo-name",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

### For React Router (if using routing)
```jsx
// Use HashRouter instead of BrowserRouter
import { HashRouter as Router } from 'react-router-dom';

// Or add basename to BrowserRouter
<BrowserRouter basename="/your-repo-name">
```

## Benefits of docs folder approach:

1. ✅ **Single branch**: Everything stays in main branch
2. ✅ **Simple**: No need for gh-pages branch
3. ✅ **Automatic**: GitHub Actions handles deployment
4. ✅ **Version control**: Deployment history in main branch
5. ✅ **Easy rollback**: Just revert the docs folder commit

## URL Structure:

- **Repository**: `https://github.com/your-username/your-repo-name`
- **GitHub Pages**: `https://your-username.github.io/your-repo-name`
- **Source code**: `https://github.com/your-username/your-repo-name/tree/main`
- **Deployed files**: `https://github.com/your-username/your-repo-name/tree/main/docs` 