// nodejs code
const express = require('express')
const Vue = require('vue')

// fetch renderer instance
const {createRenderer} = require('vue-server-renderer')
const renderer = createRenderer()

// get express instance
const server = express()

// create router to handle different URL requests
server.get('/', (req, res) => {
    // res.send('<strong>hello world</strong>')

    // create vue instance
    const app = new Vue({
        template: '<div @click="onClick">{{msg}}</div>',
        data() {
            return {msg: 'vue ssr'}
        },
        methods: {
            onClick() {
                console.log('Do something')
            }
        }
    })

    // render vue instance by using renderer
    renderer.renderToString(app)
        .then(html => res.send(html))
        .catch(err => {
            res.status(500)
            res.send('Internal server error')
        })
})

// listen to port
server.listen(80, () => {
    console.log('server running!')
})
