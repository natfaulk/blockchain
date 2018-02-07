const readline = require('readline')
const BlockChain = require('./bc_lib.js').BlockChain
const http = require('http')

let cfg = require('./bc_cfg.js')
cfg.THIS_ADDR = 'b'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('BC Console. Version 0')

rl.question('Enter remote node address: ', (answer) => {
  console.log(`Connecting to: ${answer}`)

  let blockchain = new BlockChain(cfg)

  http.get(answer, (resp) => {
    let data = ''
    
    resp.on('data', (chunk) => {
      data += chunk
    })
    
    resp.on('end', () => {
      blockchain.loadFromJSON(JSON.parse(data))
      if (!blockchain.verify()) {
        console.log('received invalid blockchain')
        return
      } else console.log('Received valid blockchain')
      
      blockchain.print()
      blockchain.printBalances(['a', 'b', 'c', 'd'])
    })
  }).on("error", (err) => {
    console.log("Error: " + err.message)
  })
})