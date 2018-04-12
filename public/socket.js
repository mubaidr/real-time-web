const socket = io()

socket.on('connect', () => {
	socket.emit('join')
})

socket.on('result', (result) => {
	console.log('yay', result)
})

const input = document.querySelector('input')

input.addEventListener('mouseleave', function(e) {
	console.log('working')
	socket.emit('new message', e.target.value)
})