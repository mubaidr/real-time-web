// eslint-disable-next-line
const socket = io()

socket.on('connect', () => {
  socket.emit('join')
})

socket.on('result', (result) => {
  console.log('yay', result)
})

// eslint-disable-next-line
const input = document.querySelector('input')

input.addEventListener('mouseleave', (e) => {
  console.log('working')
  socket.emit('new message', e.target.value)
})
