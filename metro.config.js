const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Optimize Metro bundler for minimal bundle size
config.transformer = {
  ...config.transformer,
  // Enable minification for production builds
  minifierPath: "metro-minify-terser",
  minifierConfig: {
    // Terser options for aggressive minification
    compress: {
      passes: 2, // Multiple passes for better compression
      pure_funcs: ["console.log", "console.warn", "console.info"], // Remove logs
      unused: true,
      dead_code: true,
      drop_console: true,
      drop_debugger: true,
      keep_fargs: false,
      keep_infinity: false,
    },
    mangle: {
      keep_classnames: false,
      keep_fnames: false,
      toplevel: false, // Mangle top-level variables
    },
    output: {
      comments: false, // Remove all comments
      beautify: false, // Compact output
    },
  },
  // Enable module resolution optimization
  babelTransformerPath: require.resolve("expo-metro-preset/transformer"),
};

config.resolver = {
  ...config.resolver,
  // Prioritize optimized modules
  resolverMainFields: ["react-native", "browser", "main"],
  sourceExts: ["ts", "tsx", "js", "jsx", "json", "cjs", "mjs"],
  // Optimize platform-specific resolution
  platforms: ["ios", "android", "native"],
};

// Enable graph optimization
config.cacheStores = [];

module.exports = config;
