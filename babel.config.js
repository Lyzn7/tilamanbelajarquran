module.exports = function (api) {
  api.cache(true);
  const isProd = api.env("production");

  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxRuntime: "automatic",
          removeConsole: isProd, // Hapus console.log di production
          modules: isProd ? false : "auto", // Tree-shaking support
        },
      ],
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          extensions: [".ts", ".tsx", ".js", ".json"],
          alias: {
            "@": "./src",
          },
        },
      ],
      // Dead code elimination
      isProd && "@babel/plugin-transform-block-scoping",
      isProd && "@babel/plugin-proposal-logical-assignment-operators",
      // Optimize conditional imports
      isProd && "@babel/plugin-transform-runtime",
    ].filter(Boolean),
  };
};
