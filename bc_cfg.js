const fs = require('fs')
const path = require('path')

const DEFAULT_CFG_FILENAME = 'bc_cfg.json'

module.exports = {
  DIFFICULTY: 5,
  MINING_REWARD: 0.1,
  THIS_ADDR: '0',
  PORT: 0,
  loadFromDisk: function(_filename) {
    if (!_filename) _filename = DEFAULT_CFG_FILENAME
    
    if (fs.existsSync(path.join(__dirname, _filename))) {
      let data = fs.readFileSync(path.join(__dirname, _filename))
      let dataJson = JSON.parse(data)
      if (dataJson.THIS_ADDR) this.THIS_ADDR = dataJson.THIS_ADDR
      if (dataJson.PORT) this.PORT = dataJson.PORT
    } else {
      console.log('Cfg file does not exist')
    }
  }
}