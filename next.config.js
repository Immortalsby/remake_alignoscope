const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const config = {
  env: {
    DEBUG_MODE: process.env.DEBUG_MODE,
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  httpAgentOptions: {
    keepAlive: true,
  }
};

module.exports = withNextIntl(config);
