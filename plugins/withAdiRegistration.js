const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const ADI_REGISTRATION_ID = "CQ4K2GT7L7IJQAAAAAAAAAAAAA";

module.exports = function withAdiRegistration(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const assetsDir = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "assets",
      );
      fs.mkdirSync(assetsDir, { recursive: true });
      fs.writeFileSync(
        path.join(assetsDir, "adi-registration.properties"),
        ADI_REGISTRATION_ID,
      );
      return config;
    },
  ]);
};
