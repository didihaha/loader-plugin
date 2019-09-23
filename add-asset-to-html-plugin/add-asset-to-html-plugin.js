class TestPlugin {
    constructor (options) {
        this.options = options || []
    }
    apply (compiler) {
        compiler.hooks.emit.tap('HtmlWebpackPlugin', compilation => {
            const htmlArr = Object.keys(compilation.assets).filter(html => /html$/.test(html))
            htmlArr.forEach(html => {
                let htmlString = compilation.assets[html].source()
                this.options.reverse().forEach(option => {
                    const { module, filePath, assetLocation = 'head' } = option
                    let string = '', res = ''
                    if (module) {
                        if (typeof module === 'function') {
                            string = option.module()
                        } else {
                            string = module
                        }
                    } else if (filePath) {

                    }
                    if (assetLocation === 'head') {
                        res = htmlString.replace(/<head[^>]*>([\s\S]*)<\/head>/g, ($1, $2) => {
                            return $1.replace($2, $2 + string)
                        })
                    } else if (assetLocation === 'frontOfOtherScripts') {
                        res = htmlString.replace(/<body[^>]*>([\s\S]*)(<script[^>]*><\/script>)<\/body>/g, ($1, $2, $3) => {
                            return $1.replace($3, string + $3)
                        })
                    }
                    compilation.assets[html].source = () => res
                })
            })
        });
    }
}

module.exports = TestPlugin