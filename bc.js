const BlockChain = require('./bc_lib.js').BlockChain
const version = require('./bc_version.js')

console.log(`Blockchain Version ${version.VERSION}`)

let cfg = require('./bc_cfg.js')
cfg.loadFromDisk()

let blockchain = new BlockChain(cfg)

blockchain.loadFromKnownNodes((res) => {
  if (res) {
    console.log('at least one server ok')
    bcLoaded()
  } else {
    blockchain.loadFromDisk((res2) => {
      if (res2 === 'success') {
        console.log('successfully loaded blockchain from disk')
      } else {
        blockchain.mineGenesisBlock(cfg.THIS_ADDR, 100)
      }

      bcLoaded()
    })
  }
})

let bcLoaded = () => {
  blockchain.print()
  blockchain.beginServer()
  if (cfg.ENABLE_AUTO_UPDATE) blockchain.enableAutoUpdate()
}
