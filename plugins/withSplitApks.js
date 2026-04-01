const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withSplitApks(config) {
    return withAppBuildGradle(config, async (config) => {
        // Cari konfigurasi React Native boolean enableSeparateBuildPerCPUArchitecture
        if (config.modResults.contents.includes('def enableSeparateBuildPerCPUArchitecture = false')) {
            config.modResults.contents = config.modResults.contents.replace(
                /def enableSeparateBuildPerCPUArchitecture = false/,
                'def enableSeparateBuildPerCPUArchitecture = true'
            );
        } else {
            // Fallback untuk react-native 0.73+ yang mungkin pake format lain
            config.modResults.contents = config.modResults.contents.replace(
                /enableSeparateBuildPerCPUArchitecture = false/,
                'enableSeparateBuildPerCPUArchitecture = true'
            );
        }
        return config;
    });
};
