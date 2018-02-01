const crypto = require('crypto')
const http = require('http')

const PARENT_NODE_URL = 'http://localhost:3005'
const DIFFICULTY = 2 // number of zeros needed at start

function BlockData() {
  this.a = 100
  this.b = 0
  this.c = 0
  this.d = 0
}

BlockData.prototype.load = function(_data) {
  this.a = _data.a
  this.b = _data.b
  this.c = _data.c
  this.d = _data.d
}

function Block() {
  this.data = {}
  this.prevHash = ''
  this.nonce = 0
  this.currHash = ''
}

Block.prototype.genCurrHash = function() {
  let tempD = JSON.stringify(this.data)
  tempD += this.prevHash
  tempD += this.nonce.toString()
  this.currHash = crypto.createHash('md5').update(tempD).digest('hex')
}

function BlockChain() {
  this.blocks = []
}

BlockChain.prototype.addBlock = function(_data) {
  let b = new Block()
  if (this.blocks.length > 0)
    b.prevHash = this.blocks[this.blocks.length - 1].currHash
  b.data = _data
  b.genCurrHash()
  this.blocks.push(b)
}

BlockChain.prototype.mineBlock = function(_data) {
  let b = new Block()
  if (this.blocks.length > 0)
    b.prevHash = this.blocks[this.blocks.length - 1].currHash
  b.data = _data

  b.genCurrHash()  
  while (b.currHash[0] != 0 || b.currHash[1] != 0) {
    b.nonce++
    b.genCurrHash()
  } 
  this.blocks.push(b)
}

BlockChain.prototype.print = function(_data) {
  let outStr = ''
  for (let i = 0; i < this.blocks.length; i++) {
    outStr += `Block ${i}:\r\n`
    outStr += `\tData: ${JSON.stringify(this.blocks[i].data)}\r\n`
    outStr += `\tNonce: ${this.blocks[i].nonce}\r\n`
    outStr += `\tPrevHash: ${this.blocks[i].prevHash}\r\n`
    outStr += `\tCurrHash: ${this.blocks[i].currHash}\r\n\r\n`
  }
  console.log(outStr)
}

BlockChain.prototype.load = function(_blockchain) {
  for (let i = 0; i < _blockchain.blocks.length; i++) {
    let b = new Block()
    b.nonce = _blockchain.blocks[i].nonce
    b.currHash = _blockchain.blocks[i].currHash
    b.prevHash = _blockchain.blocks[i].prevHash
    let d = new BlockData()
    d.load(_blockchain.blocks[i].data)
    b.data = d
    this.blocks.push(b)
  }
}

let blockchain = new BlockChain();

http.get(PARENT_NODE_URL, (resp) => {
  let data = ''
 
  resp.on('data', (chunk) => {
    data += chunk
  })

  resp.on('end', () => {
    blockchain.load(JSON.parse(data))

    let b1 = new BlockData()
    b1.a = 20
    b1.b = 55
    b1.c = 20
    b1.d = 5
    blockchain.mineBlock(b1)

    b1 = new BlockData()
    b1.a = 0
    b1.b = 55
    b1.c = 40
    b1.d = 5
    blockchain.mineBlock(b1)

    blockchain.print()    
  })
}).on("error", (err) => {
  console.log("Error: " + err.message)
})