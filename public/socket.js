const socket = io()

socket.on('connect', () => {
	socket.emit('join')
})

const input = document.querySelector('input')

input.addEventListener('mouseleave', function(e) {
	console.log('working')
	socket.emit('new message', e.target.value)
})