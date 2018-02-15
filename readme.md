# Basic crypto currency blockchain

Blockchain is the latest buzzword at the moment, so to understand how blockchains and crypto currencies work I decide to build my own.

It is mostly functioning except there is no private public key pairs for addresses so anyone can transfer between any addresses. (essentially making it useless as a crypto curreny unless only trusted entities had write access) 

Replication between nodes somewhat works but is still being worked on. Several nodes are hosted on my server. `node1.747474.xyz` and `node2.747474.xyz`

There is a console that can be used to interact with the blockchain.

A wallet style program is yet to be written

# To run
Everything is written in nodejs as it is a proof of concept rather than a production solution. This makes it easy to write but not necessarily very efficient.

To start up a new host install the dependencies `npm install` then run bc,js with `node bc`

The console can be run with `node bc_console`. Enter a URL of a running host. Either in the form of localhost:3000 or node1.747474.xyz. Then type help to view commands.

Some settings can be configured by making a file called bc_cfg.json in the main directory. An example cfg file is below. The port is the port on which the server hosts on which is useful if run behind a reverse proxy such as nginx or locally. 

```
{
"THIS_ADDR":"a", 
"PORT":3000
} 
```

The current settings are:

DIFFICULTY - how hard the proof of work is  
MINING_REWARD - how much mining a block rewards  
THIS_ADDR - the current node address  
PORT - the port which the local server is hosted on. Not necessarily the port used by other nodes to connect to this node as it could be behing a reverse proxy  
ENABLE_AUTO_UPDATE - Auto update allows the node to perodically ping known nodes and download their blockchain. Is necessary for nodes that are not accessable from outside their network  
UPDATE_INTERVAL_s - How often the auto update runs (in seconds)
  
# System architecture 
On startup the node tries to connect to known nodes which are stored in a constant at the top of the bc_lib.js file. If it cannot download a valid blockchain from any of those it will create a new one with a couple of example transactions. These can be removed from the bc.js file. 

The genesis block (the first block) transfers 100 credits from address 0 to the specified destination address.

When the node starts up, a local server is created. Everytime a trandsaction is made the changes are pushed to all known nodes
