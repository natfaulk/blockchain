const readline = require('readline')
const BlockChain = require('./bc_lib.js').BlockChain

let cfg = require('./bc_cfg.js')
cfg.THIS_ADDR = 'b'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

let blockchain = new BlockChain(cfg)

let hostname = ''
let port = 80

console.log('BC Console. Version 0')

rl.question('Enter remote node hostname: ', (addr) => {
  decodeAddr(addr)
  console.log(`Hostname: ${hostname}`)
  console.log(`Port: ${port}`)

  blockchain.loadFromRemote(`http://${hostname}:${port}`, (response) => {
    if (response === 'failure') {
      rl.close()
      return
    }

    blockchain.print()
    blockchain.printBalances(blockchain.getAllAddresses())

    getCommand()
  })
})

function getCommand () {
  rl.question('Enter command: ', (com) => {
    if (com === 'exit') {
      rl.close()
      return
    } else if (com.split(' ')[0] === 'transfer') {
      let src = com.split(' ')[1]
      let dest = com.split(' ')[2]
      let amt = parseFloat(com.split(' ')[3])
      if (blockchain.transaction(src, dest, amt)) {
        console.log('Transaction succeeded!')
        blockchain.sendToRemote(hostname, port)
      } else {
        console.log('Transaction failed!')
      }
    } else if (com === 'balances') {
      blockchain.printBalances(blockchain.getAllAddresses())
    } else if (com === 'print') {
      blockchain.print()
    } else if (com === 'help') {
      printHelp()
    } else if (com === 'loadremote') {
      blockchain.loadFromRemote(`http://${hostname}:${port}`, (response) => {
        getCommand()
      })
      return
    } else if (com === 'saveremote') {
      blockchain.sendToRemote(hostname, port)
    } else if (com.split(' ')[0] === 'remoteaddr') {
      if (com.split(' ').length > 1) {
        decodeAddr(com.split(' ')[1])
      } else {
        console.log('Please enter an address')
      }
    } else {
      console.log('Invalid command. Type help for help text')
    }
    getCommand()
  })
}

let printHelp = () => {
  let s = ''
  s += 'bc_console help\r\n'
  s += '---------------\r\n'
  s += 'Commands:\r\n\r\n'
  s += 'exit\r\n'
  s += 'transfer src dest amt\r\n'
  s += 'balances - prints address balances\r\n'
  s += 'print - prints whole blockchain\r\n'
  s += 'loadremote\r\n'
  s += 'saveremote\r\n'
  s += 'remoteaddr addr - set remote address'
  s += 'help - displays this help text\r\n'

  console.log(s)
}

let decodeAddr = (_addr) => {
  if (_addr.startsWith('http://')) _addr = _addr.replace('http://', '')
  let t = _addr.split(':')
  hostname = t[0]
  if (t.length > 1) port = t[1]
  else port = 80
}
