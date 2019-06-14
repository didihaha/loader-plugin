const getOptions = require('loader-utils').getOptions

module.exports = function (source) {
    const options = getOptions(this) || {}
    const string = `
        <script>
            var u = navigator.userAgent.toLowerCase()

            var html = document.querySelector('html'),
                clientWidth = html.clientWidth;
            if (!/MicroMessenger/i.test(u)) {
                // 非微信环境为2
                window._currentEnv = 2
                if (/mix 2 build/i.test(u)) {
                    html.style.fontSize = clientWidth / ${ options['@A'] || 5 } / 1.3 + 'px'
                } else if (/hwi-al00/i.test(u)) {
                    html.style.fontSize = clientWidth / ${ options['@A'] || 5 } / 1.2 + 'px'
                } else {
                    html.style.fontSize = clientWidth / ${ options['@A'] || 5 } + 'px'
                }
            } else {
                // 微信环境为1
                window._currentEnv = 1
                html.style.fontSize = clientWidth / ${ options['@A'] || 5 } + 'px'
            }
        </script>
    `
    return source.replace(/<head[^>]*>([\s\S]*)<\/head>/g, ($1, $2) => {
        return $1.replace($2, $2 + string)
    })
}