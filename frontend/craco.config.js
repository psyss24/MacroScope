const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Override the output filename to use consistent names
      webpackConfig.output.filename = 'static/js/main.js';
      webpackConfig.output.chunkFilename = 'static/js/[name].chunk.js';
      
      return webpackConfig;
    },
  },
}; 