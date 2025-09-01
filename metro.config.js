const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude server directory from React Native bundling
config.resolver.blockList = [
  /server\/.*/,
  /.*\/server\/.*/,
];

// Exclude Node.js modules that shouldn't be bundled
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add resolver configuration to handle missing modules gracefully
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Block Node.js built-in modules
config.resolver.blockList = [
  ...config.resolver.blockList,
  /node_modules\/.*\/node_modules\/.*/,
];

module.exports = config;
