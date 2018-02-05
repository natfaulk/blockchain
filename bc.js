const crypto = require('crypto')
const express = require('express')
const app = express()
const path = require('path')
const BlockChain = require('./bc_lib.js').BlockChain

const PORT = 3005

let cfg = require('./bc_cfg.js')
cfg.THIS_ADDR = 'a'

let blockchain = new BlockChain(cfg)

blockchain.mineGenesisBlock(cfg.THIS_ADDR, 100)

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