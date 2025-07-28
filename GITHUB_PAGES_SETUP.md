# GitHub Pages Setup Guide

## Recommended: Use `build` Directory (No docs folder needed)

For modern React projects, you can deploy your static site directly from the `build` directory in your `main` branch. This is simpler and avoids the need for a `docs` folder.

### Steps:

1. **Build your React app**
   ```bash
   npm run build
   ```
2. **Push to main branch**
   ```bash
   git add .
   git commit -m "Build frontend"
   git push
   ```
3. **Configure GitHub Pages**
   - Go to your repository → Settings → Pages
   - Source: Select "Deploy from a branch"
   - Branch: `main`
   - Folder: `/build`
   - Click "Save"
4. **Access your site**
   - Your app will be available at: `https://your-username.github.io/your-repo-name`

---

## FAQ

### Why not use a docs folder?
- The `docs` folder is only needed if you want to keep both source code and static site in the same branch and directory.
- Using the `build` directory is simpler, recommended, and fully supported by GitHub Pages.

### Can I use a custom domain?
- Yes, configure it in GitHub Pages settings after deployment.

### How does this work with a backend?
- Your frontend (static site) is served from GitHub Pages.
- Your backend (API) is served from Azure Functions (see README and DEPLOYMENT.md for details).

---

For more details, see [README.md](README.md) and [DEPLOYMENT.md](DEPLOYMENT.md). 