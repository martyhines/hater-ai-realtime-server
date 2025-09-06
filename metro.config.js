// metro.config.js
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const projectRoot = __dirname;
// If you're in a monorepo, uncomment and point this to your workspace root:
// const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// ---- Block specific folders, but DON'T nuke all nested node_modules ----
config.resolver.blockList = exclusionList([
  /server\/.*/,            // your server dir
  /.*\/server\/.*/,        // server in linked pkgs
]);

// Lock node resolution to your app's node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// Ensure proper module resolution for src directory
config.resolver.unstable_enableSymlinks = false;

// Keep your existing settings
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// If monorepo with symlinks, uncomment these:
// config.watchFolders = [workspaceRoot];
// config.resolver.unstable_enableSymlinks = true;

module.exports = config;
