'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

function isJs (filePath) {
  return /\.js$/.test(filePath)
}

function _htmlWebpackPlugin() {
  const data = _interopRequireDefault(require('html-webpack-plugin'));

  _htmlWebpackPlugin = function _htmlWebpackPlugin() {
    return data;
  };

  return data;
}

function _pEachSeries() {
  const data = _interopRequireDefault(require('p-each-series'));

  _pEachSeries = function _pEachSeries() {
    return data;
  };

  return data;
}

function _micromatch() {
  const data = _interopRequireDefault(require('micromatch'));

  _micromatch = function _micromatch() {
    return data;
  };

  return data;
}

function _crypto() {
  const data = _interopRequireDefault(require('crypto'));

  _crypto = function _crypto() {
    return data;
  };

  return data;
}

function _globby() {
  const data = _interopRequireDefault(require('globby'));

  _globby = function _globby() {
    return data;
  };

  return data;
}

var _utils = require('./utils');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }
  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function() {
    var self = this,
      args = arguments;
    return new Promise(function(resolve, reject) {
      var gen = fn.apply(self, args);
      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, 'next', value);
      }
      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, 'throw', err);
      }
      _next(undefined);
    });
  };
}

class AddAssetToHtmlPlugin {
  constructor(assets = []) {
    if (!Array.isArray(assets)) {
        throw new Error('add-asset-to-html-plugin插件参数必须为数组')
    }
    this.assets = assets.slice().reverse().filter(asset => !asset.isModule)
    this.modules = assets.slice().reverse().filter(asset => !!asset.isModule)
    this.addedAssets = [];
    this.addedModules = []
  }
  /* istanbul ignore next: this would be integration tests */

  apply(compiler) {
    compiler.hooks.compilation.tap('AddAssetToHtmlPlugin', compilation => {
      let beforeGenerationHook;
      let alterAssetTagsHook;

      if (_htmlWebpackPlugin().default.version === 4) {
        const hooks = _htmlWebpackPlugin().default.getHooks(compilation);

        beforeGenerationHook = hooks.beforeAssetTagGeneration;
        alterAssetTagsHook = hooks.alterAssetTags;
      } else {
      const hooks = compilation.hooks;
        beforeGenerationHook = hooks.htmlWebpackPluginBeforeHtmlGeneration;
        alterAssetTagsHook = hooks.htmlWebpackPluginAlterAssetTags;
      }

      beforeGenerationHook.tapPromise('AddAssetToHtmlPlugin', htmlPluginData => {
        return this.addAllAssetsToCompilation(compilation, htmlPluginData)
      });
      compiler.hooks.emit.tap('AddAssetToHtmlPlugin', compilation => {
        // 获取html文件名，从而获取html里面的代码片段
        const htmlName = Object.keys(compilation.assets).filter(html => /html$/.test(html))
        let htmlString = compilation.assets[htmlName].source()

        // 之前已经添加过的模块再次处理时候需要过滤掉，webpack启动时候会调用两次plugin里面的插件
        this.modules.filter(item => !this.addedModules.includes(item)).forEach(option => {
            const { filepath, assetLocation = 'head' } = option
            let string = '', res = ''
            // 是js文件进行使用require引入，其它文件使用fs读取
            if (isJs(filepath)) {
              const require_module = require(filepath)
              if (typeof require_module === 'function') {
                string = require_module()
              } else {
                string = require_module
              }
            } else {
              string = require('fs').readFileSync(filepath)
            }

            // 不同参数将代码放入到不同的位置，且根据不同文件类型生成不同的标签插入该断代码
            if (assetLocation === 'head') {
                res = htmlString.replace(/<head[^>]*>([\s\S]*)<\/head>/g, ($1, $2) => {
                  if (isJs(filepath)) {
                    return $1.replace($2, $2 + `<script type="text/javascript">${ string }</script>`)
                  } else {
                    return $1.replace($2, $2 + `<style>${ string }</style>`)
                  }
                })
            } else if (assetLocation === 'frontOfOtherScripts') {
                res = htmlString.replace(/<body[^>]*>([\s\S]*)(<script[^>]*><\/script>)<\/body>/g, ($1, $2, $3) => {
                    if (isJs(filepath)) {
                      return $1.replace($3, `<script type="text/javascript">${ string }</script>${ $3 }`)
                    } else {
                      return $1.replace($3, `<style>${ string }</style>${ $3 }`)
                    }
                })
            }
            compilation.assets[htmlName].source = () => res
            this.addedModules.push(option)
        })
      })
      alterAssetTagsHook.tap('AddAssetToHtmlPlugin', htmlPluginData => {
        const assetTags = htmlPluginData.assetTags;

        if (assetTags) {
          this.alterAssetsAttributes(assetTags);
        } else {
          this.alterAssetsAttributes({
            scripts: htmlPluginData.body
              .concat(htmlPluginData.head)
              .filter(({ tagName }) => tagName === 'script'),
          });
        }
      });
    });
  }

  addAllAssetsToCompilation(compilation, htmlPluginData) {
    var _this = this;
    return _asyncToGenerator(function*() {
      const handledAssets = yield (0, _utils.handleUrl)(_this.assets);
      yield (0,
      _pEachSeries()
        .default)(handledAssets, asset => _this.addFileToAssets(compilation, htmlPluginData, asset));
      return htmlPluginData;
    })();
  }

  alterAssetsAttributes(assetTags) {
    this.assets
      .filter(
        asset => asset.attributes && Object.keys(asset.attributes).length > 0
      )
      .forEach(asset => {
        assetTags.scripts
          .map(({ attributes }) => attributes)
          .filter(attrs => this.addedAssets.includes(attrs.src))
          .forEach(attrs => Object.assign(attrs, asset.attributes));
      });
  }

  addFileToAssets(
    compilation,
    htmlPluginData,
    {
      filepath,
      typeOfAsset = 'js',
      includeRelatedFiles = true,
      hash = false,
      publicPath,
      outputPath,
      files = [],
    }
  ) {
    var _this2 = this;

    return _asyncToGenerator(function*() {
      if (!filepath) {
        const error = new Error('No filepath defined');
        compilation.errors.push(error);
        throw error;
      }

      const fileFilters = Array.isArray(files) ? files : [files];

      if (fileFilters.length > 0) {
        const shouldSkip = !fileFilters.some(file =>
          _micromatch().default.isMatch(htmlPluginData.outputName, file)
        );

        if (shouldSkip) {
          return;
        }
      }

      const addedFilename = yield htmlPluginData.plugin.addFileToAssets(
        filepath,
        compilation
      );

      let suffix = '';

      if (hash) {
        const md5 = _crypto().default.createHash('md5');

        md5.update(compilation.assets[addedFilename].source());
        suffix = `?${md5.digest('hex').substr(0, 20)}`;
      }

      const resolvedPublicPath =
        typeof publicPath === 'undefined'
          ? (0, _utils.resolvePublicPath)(compilation, addedFilename)
          : (0, _utils.ensureTrailingSlash)(publicPath);
      const resolvedPath = `${resolvedPublicPath}${addedFilename}${suffix}`;
      htmlPluginData.assets[typeOfAsset].unshift(resolvedPath);
      (0, _utils.resolveOutput)(compilation, addedFilename, outputPath);

      _this2.addedAssets.push(resolvedPath);
      if (includeRelatedFiles) {
        const relatedFiles = yield (0, _globby().default)(`${filepath}.*`);
        yield Promise.all(
          relatedFiles.sort().map(
            /*#__PURE__*/
            (function() {
              var _ref = _asyncToGenerator(function*(relatedFile) {
                const addedMapFilename = yield htmlPluginData.plugin.addFileToAssets(
                  relatedFile,
                  compilation
                );
                (0,
                _utils.resolveOutput)(compilation, addedMapFilename, outputPath);
              });

              return function(_x) {
                return _ref.apply(this, arguments);
              };
            })()
          )
        );
      }
    })();
  }
}

exports.default = AddAssetToHtmlPlugin;
module.exports = exports.default;
