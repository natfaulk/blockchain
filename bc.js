const crypto = require('crypto')
const express = require('express')
const app = express()
const path = require('path')

const PORT = 3005

function BlockData() {
  this.a = 100
  this.b = 0
  this.c = 0
  this.d = 0
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
  let b = new Block
  if (this.blocks.length > 0)
    b.prevHash = this.blocks[this.blocks.length - 1].currHash
  b.data = _data
  b.genCurrHash()
  this.blocks.push(b)
}

BlockChain.prototype.print = function(_data) {
  let outStr = '';
  for (let i = 0; i < this.blocks.length; i++) {
    outStr += `Block ${i}:\r\n`
    outStr += `\tData: ${JSON.stringify(this.blocks[i].data)}\r\n`
    outStr += `\tNonce: ${this.blocks[i].nonce}\r\n`
    outStr += `\tPrevHash: ${this.blocks[i].prevHash}\r\n`
    outStr += `\tCurrHash: ${this.blocks[i].currHash}\r\n\r\n`
  }
  console.log(outStr)
}

let blockchain = new BlockChain()
blockchain.addBlock(new BlockData())

let b1 = new BlockData()
b1.a = 50
b1.b = 50
blockchain.addBlock(b1)

b1 = new BlockData()
b1.a = 25
b1.b = 50
b1.c = 20
b1.d = 5
blockchain.addBlock(b1)

blockchain.print()

// app.use('/static', express.static('data'))

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(JSON.stringify(blockchain))
})

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`))