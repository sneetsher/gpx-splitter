# Deployment

## GitHub Pages

The `Deploy to GitHub Pages` workflow builds the app with `npm run build` and deploys
the generated `dist` directory when changes are pushed to `main`. It can also be
started manually from the Actions tab. Vite is configured for the repository URL
`https://sneetsher.github.io/gpx-splitter/`.

In the repository's Pages settings, select **GitHub Actions** as the build and
deployment source. Other hosting targets use Vite's default root path unless
`VITE_BASE_PATH` is set.

To enable Google Analytics 4, add a repository Actions variable named
`VITE_GA_MEASUREMENT_ID` with the web stream's `G-...` measurement ID. The build
omits the Analytics scripts when the variable is unset.

## Cloudflare Pages

This section explains how to deploy the GPX Splitter application to Cloudflare Pages.

## Prerequisites

- A Cloudflare account (free tier works)
- Node.js and npm installed
- Your project built and ready to deploy

## Setup Steps

### 1. Authenticate with Cloudflare

No need to install Wrangler globally - we'll use `npx` to run it directly:

```bash
npx wrangler login
```

This will open a browser window to authenticate with your Cloudflare account.

### 2. Build Your Project

```bash
npm run build
```

This creates the production build in the `dist` directory.

### 3. Deploy to Cloudflare Pages

For the first deployment:

```bash
npx wrangler pages deploy dist --project-name=<your-project-name>
```

Replace `<your-project-name>` with your desired project name.

For subsequent deployments:

```bash
npx wrangler pages deploy dist
```

### 4. Configure Custom Domain (Optional)

After deployment, you can add a custom domain:

1. Go to the Cloudflare dashboard
2. Navigate to Workers & Pages
3. Select your project
4. Go to Custom domains
5. Add your domain

## Local Preview

Test your production build locally before deploying:

```bash
npm run preview
```

Or with Wrangler:

```bash
npx wrangler pages dev dist
```

## Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Pages Deployment Guide](https://developers.cloudflare.com/pages/get-started/git-integration/)
