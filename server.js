const express = require('express')
const path = require('path')
const http = require('http')
const PORT = process.env.PORT || 3000
const socketio = require('socket.io')
const app = express()
const server = http.createServer(app)
const io = socketio(server)

//Set static folder
app.use(express.static(path.join(__dirname, "public")))

//Start server
server.listen(PORT, () => console.log(`Server is running on ${PORT}`))

//Handle socket connection request from web client
const connections = [null, null]

io.on('connection', socket => {
    // console.log('New WS Connection')

    //Find available player number
    let playerIndex = -1;
    for (const i in connections) {
        if(connections[i] === null)
        {playerIndex = i
        break}
    }

    
    //Tell the connecting client what player number they are
    socket.emit('player-number', playerIndex)
    
    console.log(`Player ${playerIndex} has connected`)
    
    //ignore player 3
    if (playerIndex === -1) return

    connections[playerIndex] = false

    //what player number just connected
    socket.broadcast.emit('player-connection', playerIndex)

    //handle disconnect
    socket.on('disconnect', () => {
        console.log(`Player ${playerIndex} disconnected`)
        connections[playerIndex] = null
        //what player number just disconnected
        socket.broadcast.emit('player-connection', playerIndex)
    })

    //On ready
    socket.on('player-ready', () => {
        socket.broadcast.emit('enemy-ready', playerIndex)
        connections[playerIndex] = true
    })

    //check players connection
    socket.on('check-players', () => {
        const players = []
        for (const i in connections) {
            connections[i] === null ? players.push({connected: false, ready: false}) : players.push({connected: true, ready: connections[i]})
        }
        socket.emit('check-players', players)
    })

    //On fire received
    socket.on('fire' , id => {
        console.log(`Shot fired from ${playerIndex}`, id)

        //Emit the move to the other player
        socket.broadcast.emit('fire', id)
    })

    //on Fire Reply
    socket.on('fire-reply', square => {
        console.log(square)

        //Forward the reply to tohe other player
        socket.broadcast.emit('fire-reply', square)
    })

    //timeout connection
    setTimeout(() => {
        connections[playerIndex] = null
        socket.emit('timeout')
        socket.disconnect()
    }, 60000) // 10 minut limit per player
})