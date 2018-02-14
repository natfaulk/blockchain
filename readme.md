# Basic crypto currency blockchain

Blockchain is the latest buzzword at the moment, so to understand how blockchains and crypto currencies work I decide to build my own.

It is mostly functioning except there is no private public key pairs for addresses so anyone can transfer between any addresses. (essentially making it useless as a crypto curreny unless only trusted entities had write access) 

Replication between nodes somewhat works but is still being worked on. Several nodes are hosted on my server.

There is a console that can be used to interact with the blockchain.

A wallet style program is yet to be written

# To run
Everything is written in nodejs as it is a proof of concept rather than a production solution. This makes it easy to write but not necessarily very efficient.

To start up a new host install the dependencies `npm install` then run bc,js with `node bc`

