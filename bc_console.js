const readline = require('readline')
const BlockChain = require('./bc_lib.js').BlockChain
const http = require('http')

let cfg = require('./bc_cfg.js')
cfg.THIS_ADDR = 'b'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let blockchain = new BlockChain(cfg)
let remoteNodeAddr = '';

let hostname = '';
let port = 80;

console.log('BC Console. Version 0')

rl.question('Enter remote node hostname: ', (addr) => {
  decodeAddr(addr)
  console.log(`Hostname: ${hostname}`)
  console.log(`Port: ${port}`)

  blockchain.loadFromRemote(`http://${hostname}:${port}`, (response) => {
    if (response == 'failure') {
      rl.close()
      return
    }

    remoteNodeAddr = addr;

    blockchain.print()
    blockchain.printBalances(['a', 'b', 'c', 'd'])

    getCommand()
  })
})

function getCommand()
{
  rl.question('Enter command: ', (com) => {
    if (com == 'exit') {
      rl.close()
      return
    }
    else if(com.split(' ')[0] == 'transfer') {
      let src = com.split(' ')[1]
      let dest = com.split(' ')[2]
      let amt = com.split(' ')[3]
      if (blockchain.transaction(src, dest, amt)) {
        console.log('Transaction succeeded!')
        blockchain.sendToRemote(hostname, port)
      } else {
        console.log('Transaction failed!')
      }
    }
    else if(com == 'balances') {
      blockchain.printBalances(['a', 'b', 'c', 'd'])
    }
    else if(com == 'print') {
      blockchain.print()
    }
    getCommand()
  })  
}

let decodeAddr = (_addr) => {
  if (_addr.startsWith('http://')) _addr = _addr.replace('http://', '')
  let t = _addr.split(':')
  hostname = t[0]
  if (t.length > 1) port = t[1]
}
