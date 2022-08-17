/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  images: {
    loader: "imgix",
    path: "https://media.honeycombpizza.link",
    domains: ["media.honeycombpizza.link", "https://media.honeycombpizza.link"],
  },
  async redirects() {
    return [
      {
        source: "/api/:path*",
        destination: "https://shopbackend.honeycombpizza.link/api/:path*",
        permanent: false,
      },
      {
        source: "/mediaserver/:path*",
        destination: "https://media.honeycombpizza.link/mediaserver/:path*",
        permanent: false,
      },
      {
        source: "/media/:path*",
        destination: "https://media.honeycombpizza.link/media/:path*",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/cliserver/:path*",
        destination: "https://blog.honeycombpizza.link/cliserver/:path*",
      },
    ];
  },
};
