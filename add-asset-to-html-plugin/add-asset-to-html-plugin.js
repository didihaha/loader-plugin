// 该段代码中的参数5后面要换为可配置项，并将addAssetHtmlPlugin的功能集成进来
const string = `
        <script>
            var u = navigator.userAgent.toLowerCase()

            var html = document.querySelector('html'),
                clientWidth = html.clientWidth;
            if (!/MicroMessenger/i.test(u)) {
                // 非微信环境为2
                window._currentEnv = 2
                if (/mix 2 build/i.test(u)) {
                    html.style.fontSize = clientWidth / 5 / 1.3 + 'px'
                } else if (/hwi-al00/i.test(u)) {
                    html.style.fontSize = clientWidth / 5 / 1.2 + 'px'
                } else {
                    html.style.fontSize = clientWidth / 5 + 'px'
                }
            } else {
                // 微信环境为1
                window._currentEnv = 1
                html.style.fontSize = clientWidth / 5 + 'px'
            }
        </script>
    `

class TestPlugin {
    apply (compiler) {
        compiler.hooks.emit.tap('HtmlWebpackPlugin', compilation => {
            const htmlArr = Object.keys(compilation.assets).filter(html => /html$/.test(html))
            htmlArr.forEach(html => {
                let htmlString = compilation.assets[html].source()
                const res = htmlString.replace(/<head[^>]*>([\s\S]*)<\/head>/g, ($1, $2) => {
                    return $1.replace($2, $2 + string)
                })
                compilation.assets[html].source = () => res
            })
        });
    }
}

module.exports = TestPlugin