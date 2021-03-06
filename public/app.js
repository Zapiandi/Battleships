document.addEventListener('DOMContentLoaded', () => {
    const userGrid = document.querySelector('.grid-user')
    const computerGrid = document.querySelector('.grid-computer')
    const displayGrid = document.querySelector('.grid-display')
    const ships = document.querySelectorAll('.ship')
    const destroyer = document.querySelector('.destroyer-container')
    const submarine = document.querySelector('.submarine-container')
    const cruiser = document.querySelector('.cruiser-container')
    const battleship = document.querySelector('.battleship-container')
    const carrier = document.querySelector('.carrier-container')
    const startButton = document.querySelector('#start')
    const rotateButton = document.querySelector('#rotate')
    const turnDisplay = document.querySelector('#whose-go') 
    const infoDisplay = document.querySelector('#info')
    const setupBtns = document.querySelector('#setup-btns')
    
    const userSquares = [];
    const computerSquares = [];
    

    const width = 10;

    let isHorizontal = true
    let isGameOver = false
    let currentPlayer = 'user'
    let score = 0
    let cpuScore = 0
    let playerNum = 0
    let ready = false
    let enemyReady = false
    let allShipsPlaced = false
    let shotFired = -1

    //Ships
    const shipArray = [
        {
            name: 'destroyer',
            directions: [
                [0,1],
                [0,width]
            ]
        },
        {
            name: 'submarine',
            directions: [
                [0, 1, 2],
                [0,width, width*2]
            ]
        },
        {
            name: 'cruiser',
            directions: [
                [0, 1, 2],
                [0,width, width*2]
            ]
        },
        {
            name: 'battleship',
            directions: [
                [0, 1, 2, 3],
                [0,width, width*2, width*3]
            ]
        },
        {
            name: 'carrier',
            directions: [
                [0, 1, 2, 3, 4, 5],
                [0,width, width*2, width*3, width*4]
            ]
        },

    ]
    cerateBoard(userGrid, userSquares);
    cerateBoard(computerGrid, computerSquares);

    //Select Player Mode
    if(gameMode === 'singlePlayer') {
        startSinglePlayer()
    } else {
        startMultiPlayer()
    }

 
    
    //Multiplayer
    function startMultiPlayer() {
        
        const socket = io();
        
        // Get your player number
        socket.on('player-number', num => {
            if(num === -1) {
                infoDisplay.innerHTML = 'Sorry, the server is full.'
            } else {
                playerNum = parseInt(num)
                if(playerNum === 1) currentPlayer = "enemy"
    
                console.log(playerNum)

                //Get other player status
                socket.emit('check-players')
            }
        })
        //Another player connected/disconnected
        socket.on('player-connection', num => {
            console.log(`Player number ${num} has connected or disconnected`)
            playerConnectedOrDisconnected(num)
        })
        
        //On enemy ready
        socket.on('enemy-ready', num => {
            enemyReady = true
            playerReady(num)
            if(ready) {
                playGameMulti(socket)
                setupBtns.style.display = 'none'
            }
        })

        // Check player status
        socket.on('check-players', players => {
            players.forEach((p, i) => {
                if(p.connected) playerConnectedOrDisconnected(i)
                if(p.ready) {
                    playerReady(i)
                    if(i !== playerReady) enemyReady = true
                }
            })
        })
        
        //on timeout
        socket.on('timeout', () => {
            infoDisplay.innerHTML = 'You have reached the 10 minute time limit.'
        })
        
        //ready button click
        startButton.addEventListener('click', () => {
            if(allShipsPlaced) playGameMulti(socket)
            else infoDisplay.innerHTML = 'Please place all your ships.'
        })

        // Setup event listeners for firing
        computerSquares.forEach(square => {
            square.addEventListener('click', () => {
                if(currentPlayer === 'user' && ready && enemyReady) {
                    shotFired = square.dataset.id
                    socket.emit('fire', shotFired)
                }
            })
        })

        //On fire received
        socket.on('fire', id => {
            enemyGo(id)
            const square = userSquares[id]
            socket.emit('fire-reply', square.classList)
            playGameMulti(socket)
        })
        
        //On fire-reply recived
        socket.on('fire-reply', classList => {
            revealSquare(classList)
            playGameMulti(socket)
        })
        
        function playerConnectedOrDisconnected(num) {
            let player = `.p${(parseInt(num)+1) }`
            document.querySelector(`${player} .connected`).classList.toggle('active')
            if(parseInt(num) === playerNum) document.querySelector(player).style.fontWeight = 'bold'
        }
        }
        //Singleplayer
        function startSinglePlayer() {
            
            generate(shipArray[0])
            generate(shipArray[1])
            generate(shipArray[2])
            generate(shipArray[3])
            generate(shipArray[4])
            
            startButton.addEventListener('click',() => {
                setupBtns.style.display = 'none'
                playGameSingle()
            })
            
        }

    //create Board
    function cerateBoard(grid, squares) {
        for (let i = 0; i < width*width; i++) {
            const square = document.createElement('div')
            square.dataset.id = i
            grid.appendChild(square)
            squares.push(square)
        }
    };
    
    
    
    
    //computer random ships
    function generate(ship) {
        let randomDirection = Math.floor(Math.random() * ship.directions.length)
        let current = ship.directions[randomDirection]
        if (randomDirection === 0) direction = 1
        if (randomDirection === 1) direction = 10
        let randomStart = Math.abs(Math.floor(Math.random() * computerSquares.length - (ship.directions[0].length * direction)))

        const isTaken = current.some(index => computerSquares[randomStart + index].classList.contains('taken'))
        const isAtRightEdge = current.some(index => (randomStart + index) % width === width - 1)
        const isAtLeftEdge = current.some(index => (randomStart + index) % width ===  0)

        if(!isTaken && !isAtRightEdge && !isAtLeftEdge) current.forEach(index => computerSquares[randomStart + index].classList.add('taken', ship.name))
        else generate(ship)
    }

    
    
    //rotate ships
    function rotate() {
        if (isHorizontal) {
          destroyer.classList.toggle('destroyer-container-vertical')
          submarine.classList.toggle('submarine-container-vertical')
          cruiser.classList.toggle('cruiser-container-vertical')
          battleship.classList.toggle('battleship-container-vertical')
          carrier.classList.toggle('carrier-container-vertical')
          isHorizontal = false
          // console.log(isHorizontal)
          return
        }
        if (!isHorizontal) {
          destroyer.classList.toggle('destroyer-container-vertical')
          submarine.classList.toggle('submarine-container-vertical')
          cruiser.classList.toggle('cruiser-container-vertical')
          battleship.classList.toggle('battleship-container-vertical')
          carrier.classList.toggle('carrier-container-vertical')
          isHorizontal = true
          // console.log(isHorizontal)
          return
        }
      }

    rotateButton.addEventListener('click', rotate)

    //move around user ship
    ships.forEach(ship => ship.addEventListener('dragstart', dragStart))
    userSquares.forEach(square => square.addEventListener('dragstart', dragStart))
    userSquares.forEach(square => square.addEventListener('dragover', dragOver))
    userSquares.forEach(square => square.addEventListener('dragenter', dragEnter))
    userSquares.forEach(square => square.addEventListener('dragleave', dragLeave))
    userSquares.forEach(square => square.addEventListener('drop', dragDrop))
    userSquares.forEach(square => square.addEventListener('dragend', dragEnd))

    let selectedShipNameWithIndex
    let draggedShip
    let draggedShipLength

    ships.forEach(ship => ship.addEventListener('mousedown', (e) => {
        selectedShipNameWithIndex = e.target.id
        console.log(selectedShipNameWithIndex)
    }))

    function dragStart() {
        draggedShip = this
        draggedShipLength = draggedShip.childNodes.length
        console.log(draggedShip)

    }

    function dragOver(e) {
        e.preventDefault()
        
    }

    function dragEnter(e) {
        e.preventDefault()
    }

    function dragLeave() {
        console.log('dragleave')
    }

    function dragDrop() {
        let shipNameWithLastId = draggedShip.lastChild.id
        let shipClass = shipNameWithLastId.slice(0, -2)
        // console.log(shipClass)
        let lastShipIndex = parseInt(shipNameWithLastId.substr(-1))
        let shipLastId = lastShipIndex + parseInt(this.dataset.id)
        // console.log(shipLastId)
        const notAllowedHorizontal = [0,10,20,30,40,50,60,70,80,90,1,11,21,31,41,51,61,71,81,91,2,22,32,42,52,62,72,82,92,3,13,23,33,43,53,63,73,83,93]
        const notAllowedVertical = [99,98,97,96,95,94,93,92,91,90,89,88,87,86,85,84,83,82,81,80,79,78,77,76,75,74,73,72,71,70,69,68,67,66,65,64,63,62,61,60]
        
        let newNotAllowedHorizontal = notAllowedHorizontal.splice(0, 10 * lastShipIndex)
        let newNotAllowedVertical = notAllowedVertical.splice(0, 10 * lastShipIndex)
    
        selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1))
    
        shipLastId = shipLastId - selectedShipIndex
        // console.log(shipLastId)
    
        if (isHorizontal && !newNotAllowedHorizontal.includes(shipLastId)) {
          for (let i=0; i < draggedShipLength; i++) {
            let directionClass
            if (i === 0) directionClass = 'start'
            if (i === draggedShipLength - 1) directionClass = 'end'
            userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('taken', 'horizontal', directionClass, shipClass)
          }
        //As long as the index of the ship you are dragging is not in the newNotAllowedVertical array! This means that sometimes if you drag the ship by its
        //index-1 , index-2 and so on, the ship will rebound back to the displayGrid.
        } else if (!isHorizontal && !newNotAllowedVertical.includes(shipLastId)) {
          for (let i=0; i < draggedShipLength; i++) {
            let directionClass
            if (i === 0) directionClass = 'start'
            if (i === draggedShipLength - 1) directionClass = 'end'
            userSquares[parseInt(this.dataset.id) - selectedShipIndex + width*i].classList.add('taken', 'vertical', directionClass, shipClass)
          }
        } else return
    
        displayGrid.removeChild(draggedShip)
        if(!displayGrid.querySelector('.ship')) allShipsPlaced = true
      }
    function dragEnd() {

    }
    
    //game logic for singleplayer

    function playGameSingle() {
        if(isGameOver) return
        if(currentPlayer === 'user') {
            turnDisplay.innerHTML = 'Your Turn'
            computerSquares.forEach(square => square.addEventListener('click', function(e) {
                shotFired = square.dataset.id
                revealSquare(square.classList)
            }))
        }
        if(currentPlayer === 'enemy') {
            turnDisplay.innerHTML = "Enemy's Turn"
            setTimeout (enemyGo, 1000)
        }
    }
    
    //game logic for multiplayer

    function playGameMulti(socket) {
        if(isGameOver) return
        if(!ready) {
            socket.emit('player-ready')
            ready = true
            playerReady(playerNum)
        }

        if(enemyReady) {
            if(currentPlayer === 'user') {
                turnDisplay.innerHTML = 'Your Turn.'
            }
            if(currentPlayer === 'enemy') {
                turnDisplay.innerHTML = "Enemy's turn."
            }
        }
    }

    function playerReady(num) {
        let player = `.p${parseInt(num) + 1}`
        document.querySelector(`${player} .ready`).classList.toggle('active')
    }

    let destroyerCount = 0
    let submarineCount = 0
    let cruiserCount = 0
    let battleshipCount = 0
    let carrierCount = 0

    function revealSquare(classList) {
        const enemySquare = computerGrid.querySelector(`div[data-id='${shotFired}']`)
        const obj = Object.values(classList)
        if(!enemySquare.classList.contains('boom') && currentPlayer === 'user' && !isGameOver) {

            if(obj.includes('destroyer')) destroyerCount++
            if(obj.includes('submarine')) submarineCount++
            if(obj.includes('cruiser')) cruiserCount++
            if(obj.includes('battleship')) battleshipCount++
            if(obj.includes('carrier')) carrierCount++
            checkWin()
        }

        if(obj.includes('taken')) {
            enemySquare.classList.add('boom')
        } else {
            enemySquare.classList.add('miss')
        }
        currentPlayer = 'enemy'
        if (gameMode === 'singlePlayer')  playGameSingle()
    }

    let CPUdestroyerCount = 0
    let CPUsubmarineCount = 0
    let CPUcruiserCount = 0
    let CPUbattleshipCount = 0
    let CPUcarrierCount = 0
    
    function enemyGo(square) {
        if (gameMode === 'singlePlayer') square = Math.floor(Math.random() * userSquares.length)

        if(!userSquares[square].classList.contains('boom')) {
            const hit = userSquares[square].classList.contains('taken')
            userSquares[square].classList.add(hit ? 'boom' : 'miss')
            if(userSquares[square].classList.contains('destroyer')) CPUdestroyerCount++
            if(userSquares[square].classList.contains('submarine')) CPUsubmarineCount++
            if(userSquares[square].classList.contains('cruiser')) CPUcruiserCount++
            if(userSquares[square].classList.contains('battleship')) CPUbattleshipCount++
            if(userSquares[square].classList.contains('carrier')) CPUcarrierCount++ 
            checkWin()
        } else if (gameMode === 'singlePlayer') enemyGo()
        currentPlayer = 'user'
        turnDisplay.innerHTML = 'Your Turn'    
    }

    function checkWin() {

        if (destroyerCount === 2) {
            score = score + 10
            destroyerCount = 0
            infoDisplay.innerHTML = ("You sunk the enemy's Destroyer. Score: ") + score
        }

        if (submarineCount === 3) { 
            score = score + 10
            submarineCount = 0
            infoDisplay.innerHTML = ("You sunk the enemy's Submarine. Score: ") + score
        }

        if (cruiserCount === 3) {
            score = score + 10
            cruiserCount = 0
            infoDisplay.innerHTML = ("You sunk the enemy's Cruiser. Score: ") + score
        }

        if (battleshipCount === 4) {   
            score = score + 10
            battleshipCount = 0
            infoDisplay.innerHTML = ("You sunk the enemy's Battleship. Score: ") + score
        }

        if (carrierCount === 5) {  
            score = score + 10
            carrierCount = 0
            infoDisplay.innerHTML = ("You sunk the enemy's Carrier. Score: ") + score
        }

        if (CPUdestroyerCount === 2) {
            infoDisplay.innerHTML = ('Computer sunk your Destroyer') + cpuScore
            cpuScore = cpuScore + 10
            CPUdestroyerCount = 0
        }
        if (CPUsubmarineCount === 3) {
            infoDisplay.innerHTML = ('Computer sunk your  Submarine') + cpuScore
            cpuScore = cpuScore + 10
            CPUsubmarineCount = 0
        }
        if (CPUcruiserCount === 3) {
            infoDisplay.innerHTML = ('Computer sunk your  Cruiser') + cpuScore
            cpuScore = cpuScore + 10
            CPUcruiserCount = 0
        }
        if (CPUbattleshipCount === 4) {
            infoDisplay.innerHTML = ('Computer sunk your  Battleship') + cpuScore
            cpuScore = cpuScore + 10
            CPUbattleshipCount = 0
        }
        if (CPUcarrierCount === 5) {
            infoDisplay.innerHTML = ('Computer sunk your  Carrier') + cpuScore
            cpuScore = cpuScore + 10
            CPUcarrierCount = 0
        }

        if(score === 50) {
            infoDisplay.innerHTML = 'YOU WIN'
            gameOver() 
        }
        if(cpuScore === 50) {
            infoDisplay.innerHTML = 'COMPUTER WINS'
            gameOver() 
        }
    }

    function gameOver() {
        isGameOver = true
        startButton.removeEventListener('click', playGameSingle)
    }


    
})