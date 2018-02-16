const fs = require('fs')
const path = require('path')

const DEFAULT_CFG_FILENAME = 'bc_cfg.json'

module.exports = {
  HARD_CODED_NODES: [
    'node1.747474.xyz',
    'node2.747474.xyz',
    'node3.747474.xyz'
  ],
  DIFFICULTY: 5,
  MINING_REWARD: 0.1,
  THIS_ADDR: '0',
  PORT: 0,
  IS_PARENT_NODE: false,
  ENABLE_AUTO_UPDATE: false,
  UPDATE_INTERVAL_s: (5 * 60),
  loadFromDisk: function (_filename) {
    if (!_filename) _filename = DEFAULT_CFG_FILENAME

    if (fs.existsSync(path.join(__dirname, _filename))) {
      let data = fs.readFileSync(path.join(__dirname, _filename))
      let dataJson = JSON.parse(data)
      if (dataJson.THIS_ADDR) this.THIS_ADDR = dataJson.THIS_ADDR
      if (dataJson.PORT) this.PORT = dataJson.PORT
      if (dataJson.IS_PARENT_NODE) this.IS_PARENT_NODE = dataJson.IS_PARENT_NODE
      if (dataJson.ENABLE_AUTO_UPDATE) this.ENABLE_AUTO_UPDATE = dataJson.ENABLE_AUTO_UPDATE
      if (dataJson.UPDATE_INTERVAL_s) this.UPDATE_INTERVAL_s = dataJson.UPDATE_INTERVAL_s
      if (dataJson.HARD_CODED_NODES) this.HARD_CODED_NODES = dataJson.HARD_CODED_NODES
    } else {
      console.log('Cfg file does not exist')
    }
  }
}
