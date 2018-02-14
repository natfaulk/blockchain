const crypto = require('crypto')
const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const http = require('http')
const fs = require('fs');
const version = require('./bc_version.js')

let HARD_CODED_NODES = [
  'node1.747474.xyz',
  'node2.747474.xyz',
  'node3.747474.xyz'
]

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
  this.knownNodes = HARD_CODED_NODES
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

BlockChain.prototype.saveToDisk = function() {
  mkdir_p(path.join(__dirname, 'data'))
  fs.writeFile(path.join(__dirname, 'data', 'sav.json'), JSON.stringify(this.blocks), 'utf8', (err) => {
    if (err) throw err
    console.log('Saved blockchain to disk')
  })
}


BlockChain.prototype.loadFromJSON = function(_blocks) {
  this.blocks = []
  
  for (let i = 0; i < _blocks.length; i++) {
    let b = new Block()
    b.nonce = _blocks[i].nonce
    b.currHash = _blocks[i].currHash
    b.prevHash = _blocks[i].prevHash
    b.minerAddr = _blocks[i].minerAddr
    let d = new BlockData()
    d.load(_blocks[i].data)
    b.data = d
    this.blocks.push(b)
  }
}

BlockChain.prototype.loadFromKnownNodes = function(_callback)
{
  let i = 0
  let success = false

  let r = (_callback2) => {
    console.log(this.knownNodes)
    this.loadFromRemote(`http://${this.knownNodes[i]}`, (res) => {
      if (res == 'success') success = true;
      i++
      if (i < this.knownNodes.length) {
        r(_callback2)
      } else _callback2(success)
    })
  }

  r(_callback)
}

BlockChain.prototype.loadFromRemote = function(_addr, _callback) {
  http.get(_addr, (resp) => {
    let data = ''
    
    resp.on('data', (chunk) => {
      data += chunk
    })
    
    resp.on('end', () => {
      let tempBlockchain = new BlockChain(this.cfg)
      tempBlockchain.loadFromJSON(JSON.parse(data))
      if (tempBlockchain.blocks.length <= this.blocks.length) {
        console.log('received invalid blockchain')
        _callback('failure')
      } else if (!tempBlockchain.verify()) {
        console.log('received invalid blockchain')
        _callback('failure')
      } else {
        this.blocks = tempBlockchain.blocks
        console.log('Received valid blockchain')
        _callback('success')
      }
    })
  }).on("error", (err) => {
    console.log("Error: " + err.message)
    _callback('failure')    
  })
}

BlockChain.prototype.loadFromDisk = function(_callback) {
  if (fs.existsSync(path.join(__dirname, 'data'))) {
    fs.readFile(path.join(__dirname, 'data', 'sav.json'), (err, data) => {
      if (err) {
        console.log("Error: " + err.message)
        _callback('failure')
      } else {
        let tempBlockchain = new BlockChain(this.cfg)
        tempBlockchain.loadFromJSON(JSON.parse(data))

        if (!tempBlockchain.verify()) {
          console.log('Loaded invalid blockchain')
          _callback('failure')
        } else {
          this.blocks = tempBlockchain.blocks
          console.log('Loaded valid blockchain')
          _callback('success')
        }
      }
    })
  } else {
    console.log('Data directory does not exist')    
    _callback('failure')    
  }
}

BlockChain.prototype.sendToRemote = function(_hostname, _port) {
  var body = JSON.stringify(this.blocks)
    
  var request = new http.ClientRequest({
      hostname: _hostname,
      port: _port,
      path: "/syncBlockChain",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      }
  })
  request.on('error', function(err) {
    console.log("Error: " + err.message)
  })

  request.end(body)
}

BlockChain.prototype.transaction = function(_srcAddr, _destAddr, _amount) {
  if (this.blocks.length == 0) return false
  
  if (this.getBalance(_srcAddr) < _amount) return false

  let b1 = new BlockData()
  b1._srcAddr = _srcAddr
  b1._destAddr = _destAddr
  b1._amount = _amount

  this.mineBlock(b1)

  for (let i = 0; i < this.knownNodes.length; i++)
  {
    this.sendToRemote(this.knownNodes[i], 80)
  }

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

BlockChain.prototype.printBalances = function(_addrList) {
  let output = 'Balances:\r\n'
  for (let i = 0; i < _addrList.length; i++) {
    output += `${_addrList[i]}: ${this.getBalance(_addrList[i])}\r\n`
  }
  output += '\r\n'
  console.log(output)
} 

BlockChain.prototype.beginServer = function()
{
  if (this.cfg.PORT == 0) return;

  this.app = express()
  this.app.use(bodyParser.json());

  this.app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(JSON.stringify(this.blocks))
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

  this.app.post('/syncBlockChain', (req, res) => {
    console.log(req.body)
    let tempBlockchain = new BlockChain(this.cfg)
    tempBlockchain.loadFromJSON(req.body)
    if (tempBlockchain.blocks.length <= this.blocks.length) {
      res.send('nack. length same or less')
      return
    }

    if (!tempBlockchain.verify()) {
      res.send('nack. invlaid blockchain')
      return
    }

    this.blocks = tempBlockchain.blocks
    res.send('ack')
    console.log('updated with remote blockchain')
    this.print()
  })

  this.app.get('/getNodes', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(JSON.stringify(this.knownNodes))
  })

  this.app.post('/transaction', (req, res) => {
    if (typeof req.body.srcaddr == 'undefined'
      || typeof req.body.destaddr == 'undefined'
      || typeof req.body.amt == 'undefined') {
      res.send('nack')      
      return
    }
    if (this.transaction(req.body.srcaddr, req.body.destaddr, req.body.amt)) res.send('ack')
    else res.send('nack')
  })

  this.app.get('/version', (req, res) => {
    res.send(version.VERSION)
  })

  this.app.listen(this.cfg.PORT, () => console.log(`Example app listening on port ${this.cfg.PORT}!`))
}

function mkdir_p(_dir) {
  if (!fs.existsSync(_dir)) {
    fs.mkdirSync(_dir)
  }
}

module.exports = {
  BlockChain: BlockChain
}