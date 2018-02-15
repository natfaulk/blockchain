const BlockChain = require('./bc_lib.js').BlockChain
const version = require('./bc_version.js')

console.log(`Blockchain Version ${version.VERSION}`)

let cfg = require('./bc_cfg.js')
cfg.loadFromDisk()

let blockchain = new BlockChain(cfg)

blockchain.loadFromKnownNodes((res) => {
  if (res) {
    console.log('at least one server ok')
  } else {
    blockchain.mineGenesisBlock(cfg.THIS_ADDR, 100)

    blockchain.transaction('a', 'b', 50)
    blockchain.transaction('a', 'c', 25)
    blockchain.transaction('c', 'd', 5)
  }

  blockchain.print()
  blockchain.beginServer()
})
