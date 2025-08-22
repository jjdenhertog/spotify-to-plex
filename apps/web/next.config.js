module.exports = {
    output: process.env.NEXT_DOCKER ? "standalone" : undefined,
    distDir: "dist",
    reactStrictMode: false,
    productionBrowserSourceMaps: true,
    
    // Transpile the workspace packages to handle TypeScript export type syntax
    transpilePackages: [
        '@spotify-to-plex/plex-music-search',
        '@spotify-to-plex/tidal-music-search',
        '@spotify-to-plex/open-spotify-sdk',
        '@spotify-to-plex/music-search'
    ],
    
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    { key: "Access-Control-Allow-Credentials", value: "true" },
                    { key: "Access-Control-Allow-Origin", value: "*" }, // replace this your actual origin
                    { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT,OPTIONS" },
                    { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
                ]
            }
        ]
    }
}