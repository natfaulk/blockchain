const crypto = require('crypto')
const http = require('http')
const BlockChain = require('./bc_lib.js').BlockChain

 let cfg = require('./bc_cfg.js')
 cfg.loadFromDisk('bc_cfg2.json')

console.log(`Address: ${cfg.THIS_ADDR}`)
console.log(`Port: ${cfg.PORT}`)

const PARENT_NODE_URL = 'http://localhost:3005'

let blockchain = new BlockChain(cfg)
// blockchain.loadFromRemote(PARENT_NODE_URL, (response) => {
blockchain.loadFromDisk((response) => {
  if (response == 'failure') {
    console.log('failed.load from disk')
    return
  }
  if (blockchain.transaction('a', 'b', 10)) console.log('Transaction succeeded')
  else console.log('Transaction failed')
  
  if (blockchain.transaction('a', 'c', 10)) console.log('Transaction succeeded')
  else console.log('Transaction failed')
  
  if (blockchain.transaction('a', 'd', 10)) console.log('Transaction succeeded')
  else console.log('Transaction failed')
  
  if (blockchain.transaction('d', 'a', 100)) console.log('Transaction succeeded')
  else console.log('Transaction failed')
  
  if (blockchain.transaction('c', 'b', 30)) console.log('Transaction succeeded')
  else console.log('Transaction failed')
  
  blockchain.print()
  blockchain.printBalances(['a', 'b', 'c', 'd'])

  blockchain.sendToRemote('localhost', 3005)
})