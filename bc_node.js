const crypto = require('crypto')
const http = require('http')
const BlockChain = require('./bc_lib.js').BlockChain

 let cfg = require('./bc_cfg.js')
 cfg.THIS_ADDR = 'b'

// const PARENT_NODE_URL = 'http://node1.747474.xyz/'
const PARENT_NODE_URL = 'http://localhost:3005'

let blockchain = new BlockChain(cfg)

http.get(PARENT_NODE_URL, (resp) => {
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

    var body = JSON.stringify(blockchain)
    
    var request = new http.ClientRequest({
        hostname: 'localhost',
        port: 3005,
        path: "/syncBlockChain",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body)
        }
    })
  
    request.end(body)
  })
}).on("error", (err) => {
  console.log("Error: " + err.message)
})