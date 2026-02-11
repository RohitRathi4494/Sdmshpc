/** @type {import('next').NextConfig} */
const nextConfig = {
    // strict mode is good
    reactStrictMode: true,
    experimental: {
        serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
    },
};

export default nextConfig;
