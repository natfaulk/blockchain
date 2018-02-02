const crypto = require('crypto')
const http = require('http')

const PARENT_NODE_URL = 'http://localhost:3005'

// TODO: Implement this properly
// const DIFFICULTY = 2 // number of zeros needed at start

const MINING_REWARD = 0.1

const THIS_ADDR = 'b'

function BlockData() {
  this._srcAddr = ''
  this._destAddr = ''
  this._amount = ''
}

BlockData.prototype.load = function(_data) {
  this._srcAddr = _data._srcAddr
  this._destAddr = _data._destAddr
  this._amount = _data._amount
}

function Block() {
  this.data = {}
  this.prevHash = ''
  this.minerAddr = THIS_ADDR
  this.nonce = 0
  this.currHash = ''
}

Block.prototype.genCurrHash = function() {
  let tempD = JSON.stringify(this.data)
  tempD += this.prevHash
  tempD += this.minerAddr
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
  b.minerAddr = THIS_ADDR
  b.genCurrHash()
  this.blocks.push(b)
}

BlockChain.prototype.mineBlock = function(_data) {
  let b = new Block()
  if (this.blocks.length > 0)
    b.prevHash = this.blocks[this.blocks.length - 1].currHash
  b.data = _data
  b.minerAddr = THIS_ADDR

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
    outStr += `\tMiner Addr: ${this.blocks[i].minerAddr}\r\n`
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
    b.minerAddr = _blockchain.blocks[i].minerAddr
    let d = new BlockData()
    d.load(_blockchain.blocks[i].data)
    b.data = d
    this.blocks.push(b)
  }
}

BlockChain.prototype.transaction = function(_srcAddr, _destAddr, _amount) {
  if (this.blocks.length == 0) return false
  
  if (this.getBalance(_srcAddr) < _amount) return false

  let b1 = new BlockData()
  b1._srcAddr = _srcAddr
  b1._destAddr = _destAddr
  b1._amount = _amount

  blockchain.mineBlock(b1)
  return true
}

BlockChain.prototype.getBalance = function(_addr) {
  let balance = 0
  for (let i = 0; i < this.blocks.length; i++) {
    if (this.blocks[i].minerAddr == _addr) balance += MINING_REWARD
    if (this.blocks[i].data._srcAddr == _addr) balance -= this.blocks[i].data._amount
    if (this.blocks[i].data._destAddr == _addr) balance += this.blocks[i].data._amount
  }
  return balance
}

BlockChain.prototype.verify = function() {
  for (let i = 0; i < this.blocks.length; i++) {
    let oldHash = this.blocks[i].currHash
    this.blocks[i].genCurrHash()
    if (this.blocks[i].currHash != oldHash) return false
    if ((i > 0) && (this.blocks[i].prevHash != this.blocks[i - 1].currHash)) return false
    if ((i > 0) && ((this.blocks[i].currHash[0] != '0') || (this.blocks[i].currHash[1] != '0'))) return false
  }
  return true
}

let printBalances = (_blockchain, _addrList) => {
  let output = 'Balances:\r\n'
  for (let i = 0; i < _addrList.length; i++) {
    output += `${_addrList[i]}: ${blockchain.getBalance(_addrList[i])}\r\n`
  }
  output += '\r\n'
  console.log(output)
} 

let blockchain = new BlockChain()

http.get(PARENT_NODE_URL, (resp) => {
  let data = ''
  
  resp.on('data', (chunk) => {
    data += chunk
  })
  
  resp.on('end', () => {
    blockchain.load(JSON.parse(data))
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
    printBalances(blockchain, ['a', 'b', 'c', 'd'])
  })
}).on("error", (err) => {
  console.log("Error: " + err.message)
})