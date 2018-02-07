const crypto = require('crypto')
const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')

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
  this.minerAddr = ''
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

function RemoteNode(_port, _addr) {
  this.port = _port
  this.addr = _addr
}

function BlockChain(_cfg) {
  this.blocks = []
  this.cfg = _cfg
  this.knownNodes = []
}

BlockChain.prototype.addBlock = function(_data) {
  let b = new Block()
  if (this.blocks.length > 0)
    b.prevHash = this.blocks[this.blocks.length - 1].currHash
  b.data = _data
  b.minerAddr = this.cfg.THIS_ADDR
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
  b.minerAddr = this.cfg.THIS_ADDR

  b.genCurrHash()  
  while (!checkHashPrefix(b.currHash, this.cfg.DIFFICULTY, '0')) {
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

  this.mineBlock(b1)
  return true
}

BlockChain.prototype.getBalance = function(_addr) {
  let balance = 0
  for (let i = 0; i < this.blocks.length; i++) {
    if (this.blocks[i].minerAddr == _addr) balance += this.cfg.MINING_REWARD
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
    if ((i > 0) && (!checkHashPrefix(this.blocks[i].currHash, this.cfg.DIFFICULTY, '0'))) return false
  }
  return true
}

BlockChain.prototype.mineGenesisBlock = function(_destAddr, _amount) {
  if (this.blocks.length != 0) return
  let b = new BlockData()
  b._srcAddr = '0'
  b._destAddr = _destAddr
  b._amount = 100
  this.addBlock(b)
}

BlockChain.prototype.beginServer = function()
{
  if (this.cfg.PORT == 0) return;

  this.app = express()
  this.app.use(bodyParser.json());

  this.app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(JSON.stringify(this))
  })

  this.app.post('/registerNode', (req, res) => {
    if (typeof req.body.addr == 'undefined' || typeof req.body.port == 'undefined') {
      res.send('nack')      
      return
    }
    let r = new RemoteNode(req.body.addr, req.body.port)
    this.knownNodes.push(r)
    res.send('ack')
  })

  this.app.get('/getNodes', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(JSON.stringify(this.knownNodes))
  })

  this.app.listen(this.cfg.PORT, () => console.log(`Example app listening on port ${this.cfg.PORT}!`))
}


module.exports = {
  BlockChain: BlockChain
};