const crypto = require('crypto')
const express = require('express')
const app = express()
const path = require('path')

const PORT = 3005

const THIS_ADDR = 'a'

const DIFFICULTY = 5 // number of zeros needed at start
const MINING_REWARD = 0.1

function BlockData() {
  this._srcAddr = ''
  this._destAddr = ''
  this._amount = ''
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

let checkHashPrefix = (_hash, _nChars, _char) => {
  let res = true
  for (let i = 0; i < _nChars; i++) {
    if (_hash[i] != _char) return false
  }
  return true
}

BlockChain.prototype.mineBlock = function(_data) {
  let b = new Block()
  if (this.blocks.length > 0)
    b.prevHash = this.blocks[this.blocks.length - 1].currHash
  b.data = _data
  b.minerAddr = THIS_ADDR

  b.genCurrHash()  
  while (!checkHashPrefix(b.currHash, DIFFICULTY, '0')) {
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

let blockchain = new BlockChain()

let b = new BlockData()
b._srcAddr = '0'
b._destAddr = 'a'
b._amount = 100
blockchain.addBlock(b)

blockchain.transaction('a', 'b', 50)
blockchain.transaction('a', 'c', 25)
blockchain.transaction('c', 'd', 5)

blockchain.print()

// app.use('/static', express.static('data'))

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(JSON.stringify(blockchain))
})

app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`))