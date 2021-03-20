// nodejs code
const express = require('express')

// get express instance
const server = express()

// create router to handle different URL requests
server.get('/', (req, res) => {
    res.send('<strong>hello world</strong>')
})

// listen to port
server.listen(80, () => {
    console.log('server running!')
})
