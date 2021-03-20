// 1.create vue instance
const Vue = require('vue')
const app = new Vue({
    template: '<div>Hello World</div>'
})

// 2.fetch renderer instance
const {createRenderer} = require('vue-server-renderer')
const renderer = createRenderer()

// 3.render vue instance by using renderer
renderer.renderToString(app)
    .then(html => {
        console.log(html)
    })
    .catch(err => console.error(err))
