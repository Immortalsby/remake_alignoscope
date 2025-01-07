const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const config = {
  env: {
    DEBUG_MODE: process.env.DEBUG_MODE,
  }
};

module.exports = withNextIntl(config);
