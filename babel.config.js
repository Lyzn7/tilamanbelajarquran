module.exports = function (api) {
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
      // Optimize conditional imports
      isProd && "@babel/plugin-transform-runtime",
    ].filter(Boolean),
  };
};
