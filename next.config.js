/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow large image uploads (screenshots)
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
