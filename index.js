const path = require("path");
const { getLoader, loaderNameMatches } = require("react-app-rewired");

function createRewireLess(lessLoaderOptions = {}) {
  return function (config, env) {
    const lessExtension = /\.less$/;
    const lessModuleExtension = /\.module.less$/;

    const fileLoader = getLoader(
      config.module.rules,
      rule => loaderNameMatches(rule, 'file-loader')
    );
    fileLoader.exclude.push(lessExtension);

    const cssRules = getLoader(
      config.module.rules,
      rule => String(rule.test) === String(/\.css$/)
    );

    let lessRules;
    if (env === "production") {
      const lessLoader = cssRules.loader || cssRules.use

      lessRules = {
        test: lessExtension,
        loader: [
          // TODO: originally this part is wrapper in extract-text-webpack-plugin
          //       which we cannot do, so some things like relative publicPath
          //       will not work.
          //       https://github.com/timarney/react-app-rewired/issues/33
          ...lessLoader,
          { loader: "less-loader", options: lessLoaderOptions }
        ]
      };
    } else {
      lessRules = {
        test: lessExtension,
        use: [
          ...cssRules.use,
          { loader: "less-loader", options: lessLoaderOptions }
        ]
      };
    }

    let lessModuleRules;
    if (env === "production") {
      const lessLoader = cssRules.loader || cssRules.use
      console.log('production lessLoader', lessLoader)
      lessModuleRules = {
        test: lessModuleExtension,
        loader: [
          // TODO: originally this part is wrapper in extract-text-webpack-plugin
          //       which we cannot do, so some things like relative publicPath
          //       will not work.
          //       https://github.com/timarney/react-app-rewired/issues/33
          ...lessLoader,
          { loader: "less-loader", options: lessLoaderOptions }
        ]
      };
    } else {
      const lessLoader = JSON.parse(JSON.stringify(cssRules.loader || cssRules.use)) 
      lessLoader.forEach((loader) => {
        if (typeof loader === 'object') {
          if (loader && loader.loader) {
            if (loader.loader.includes('@css-loader')) {
              loader.options = Object.assign({modules:true},loader.options)
            }
          }
        }

      })
      lessModuleRules = {
        test: lessModuleExtension,
        use: [
          ...lessLoader,
          { loader: "less-loader", options: lessLoaderOptions }
        ]
      };
    }
    console.log('lessRules',lessRules.use)
    console.log('lessModuleRules',lessModuleRules.use)
    const oneOfRule = config.module.rules.find((rule) => rule.oneOf !== undefined);
    if (oneOfRule) {
      oneOfRule.oneOf.unshift(lessRules);
      oneOfRule.oneOf.unshift(lessModuleRules);
    }
    else {
      // Fallback to previous behaviour of adding to the end of the rules list.
      config.module.rules.push(lessRules);
      config.module.rules.push(lessModuleRules);
    }

    return config;
  };
}

const rewireLess = createRewireLess();

rewireLess.withLoaderOptions = createRewireLess;

module.exports = rewireLess;
