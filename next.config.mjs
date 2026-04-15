/** @type {import('next').NextConfig} */
const nextConfig = {
    // Reverting standalone to use default Vercel Output
    // output: 'standalone',

    typescript: {
        ignoreBuildErrors: true,
    },

    async redirects() {
        return [
            {
                source: '/',
                destination: '/dashboard',
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
