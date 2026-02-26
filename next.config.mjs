/** @type {import('next').NextConfig} */
const nextConfig = {
    // Reverting standalone to use default Vercel Output
    // output: 'standalone',

    typescript: {
        ignoreBuildErrors: true,
    },
};

export default nextConfig;
