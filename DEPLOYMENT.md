# Deployment Setup

## Vercel Deployment Configuration

### 1. Vercel Project Setup

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Link the project to Vercel:
   ```bash
   vercel link
   ```

4. Deploy manually for the first time:
   ```bash
   vercel --prod
   ```

### 2. GitHub Secrets Configuration

After linking your project to Vercel, you need to configure GitHub Secrets for automated deployment.

Go to your GitHub repository: **Settings > Secrets and variables > Actions**

Add the following secrets:

#### Required Secrets:

1. **`VERCEL_TOKEN`**
   - Go to [Vercel Dashboard > Settings > Tokens](https://vercel.com/account/tokens)
   - Create a new token with appropriate scope
   - Copy the token value

2. **`VERCEL_ORG_ID`**
   - After running `vercel link`, check `.vercel/project.json`
   - Copy the `orgId` value

3. **`VERCEL_PROJECT_ID`**
   - After running `vercel link`, check `.vercel/project.json`  
   - Copy the `projectId` value

### 3. Enable Automatic Deployment

Once the secrets are configured, uncomment the following lines in `.github/workflows/deploy.yml`:

```yaml
on:
  workflow_dispatch: # Manual trigger only
  push:
    branches: [main]  # Uncomment these lines
```

### 4. Vercel Project Settings

Ensure your Vercel project has the correct settings:

- **Framework Preset**: Vite
- **Build Command**: `pnpm run build`
- **Output Directory**: `dist`
- **Install Command**: `pnpm install`
- **Node.js Version**: 24.x

### 5. Environment Variables (if needed)

If your application requires environment variables, add them in:
- Vercel Dashboard > Project > Settings > Environment Variables

## Workflow Overview

- **CI**: Runs on every push and pull request (test, lint, build, knip)
- **Deploy**: Runs on push to main branch (after secrets are configured)

## Manual Deployment

You can always deploy manually using:
```bash
vercel --prod
```

Or trigger the GitHub Action manually from the Actions tab.