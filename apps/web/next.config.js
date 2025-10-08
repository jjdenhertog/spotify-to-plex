const path = require('path');

module.exports = {
    output: process.env.NEXT_DOCKER ? "standalone" : undefined,
    // Critical for monorepo: tells Next.js to trace dependencies from monorepo root
    outputFileTracingRoot: process.env.NEXT_DOCKER ? path.join(__dirname, '../../') : undefined,
    distDir: "dist",
    reactStrictMode: false,
    productionBrowserSourceMaps: true,
    typescript: {
        // Skip type checking in Docker builds since we already type-checked during package builds
        ignoreBuildErrors: process.env.NEXT_DOCKER === "1",
    },
    
    // Suppress webpack warnings for missing platform-specific SWC binaries
    webpack: (config) => {
        config.infrastructureLogging = {
            level: 'error',
        }
        return config
    },
    
    // Transpile the workspace packages to handle TypeScript export type syntax
    transpilePackages: [
        '@spotify-to-plex/plex-music-search',
        '@spotify-to-plex/tidal-music-search',
        '@spotify-to-plex/music-search',
        '@spotify-to-plex/shared-types',
        '@spotify-to-plex/shared-utils',
        '@spotify-to-plex/http-client',
        '@spotify-to-plex/plex-config',
        '@spotify-to-plex/plex-helpers'
    ],
    
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    { key: "Access-Control-Allow-Credentials", value: "true" },
                    { key: "Access-Control-Allow-Origin", value: "*" }, // replace this your actual origin
                    { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
                    { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" }
                ]
            }
        ]
    }
}