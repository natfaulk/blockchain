const crypto = require('crypto')
const express = require('express')
const app = express()
const path = require('path')
const BlockChain = require('./bc_lib.js').BlockChain


let cfg = require('./bc_cfg.js')
cfg.THIS_ADDR = 'a'
cfg.PORT = 3005

let blockchain = new BlockChain(cfg)

blockchain.mineGenesisBlock(cfg.THIS_ADDR, 100)

blockchain.transaction('a', 'b', 50)
blockchain.transaction('a', 'c', 25)
blockchain.transaction('c', 'd', 5)

blockchain.print()

blockchain.beginServer();