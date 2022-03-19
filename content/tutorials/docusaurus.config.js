var requireGlob = require('require-glob');

const reducer = function(_, _, _, _, fileObjects) {
    return {
        plugins: fileObjects.map(x => x.exports.plugins).flat().filter(x => x),
        staticDirectories: fileObjects.map(x => x.exports.staticDirectories).flat().filter(x => x)
    }
}

const config = requireGlob.sync('**/docusaurus.config.js', {reducer})

module.exports = {
    title: 'Tutorials',
    url: '/',
    baseUrl: '/',
    themes: ['@docusaurus/theme-classic'
    ],
    plugins: [
        ...config.plugins
    ],
    staticDirectories: [
        ...config.staticDirectories
    ],
};