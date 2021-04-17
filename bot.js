#!/usr/bin/env node

// USAGE: export token then run bot

// requires
const fs = require('fs')
const bitcoin = require('bitcoinjs-lib')
const { Telegraf } = require('telegraf')
const argv = require('minimist')(process.argv.slice(2))
const homedir = require('os').homedir()
const exec = require('child_process').exec


const {createHash} = require('crypto');

// lines: array of strings
function computeSHA256(lines) {
  const hash = createHash('sha256');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim(); // remove leading/trailing whitespace
    if (line === '') continue; // skip empty lines
    hash.write(line); // write a single line to the buffer
  }

  return hash.digest('hex'); // returns hash as string
}

// MODEL
globalThis.data = {
  ledger: null,
  credits: null,
  file: null
}

//  init
var ledgerFile = argv.ledger 
var creditsFile = argv.credits 
data.file = argv.file || data.file

var ledger = require(ledgerFile)
var credits = require(creditsFile)

var usernames = require('./usernames.json')

// functions
function getNickFromId(key) {
  var keys = Object.keys(usernames)
  var ret = keys.find(el => usernames[el] === key) 
  return ret || key
}

// FUNCTIONS
const BITMARK = {
  messagePrefix: '\x19BITMARK Signed Message:\n',
  bech32: 'btm',
  bip32: {
    public: 0x019da462,
    private: 0x019d9cfe
  },
  pubKeyHash: 85,
  scriptHash: 0x32,
  wif: 213
}



function getPrivKey (file) {
  try {
    const fetchHeadDir = './.git/'
    var fetchHeadFile = fetchHeadDir + 'FETCH_HEAD'

    var fetchHead = fs.readFileSync(fetchHeadFile).toString()

    var repo = fetchHead
      .split(' ')
      .pop()
      .replace(':', '/')
      .replace('\n', '')

    const gitmarkRepoBase = homedir + '/.gitmark/repo'

    const gitmarkFile = file || gitmarkRepoBase + '/' + repo + '/gitmark.json'

    return require(gitmarkFile).privkey
  } catch (e) {
    const fetchHeadDir = './.git/'
    var fetchHeadFile = fetchHeadDir + 'FETCH_HEAD'

    var fetchHead = fs.readFileSync(fetchHeadFile).toString()

    var repo = fetchHead
      .split(' ')
      .pop()
      .replace(':', '/')
      .replace('\n', '')

    const gitmarkRepoBase = homedir + '/.gitmark/repo'

    const gitmarkFile = gitmarkRepoBase + '/' + repo + '/gitmark.json'

    console.log('no priv key found in', gitmarkFile)
    return undefined
  }
}

// main
const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start((ctx) => ctx.reply('Welcome'))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.command('oldschool', (ctx) => ctx.reply('Hello'))
bot.command('hipster', Telegraf.reply('λ'))

bot.on('text', (ctx) => {
  // log
  console.log(ctx.message)

  // get from id
  var from = 'urn:telegram:' + ctx.message.from.id

  // get text and split into message array
  var text = ctx.message.text
  var message = ctx.message.text.split(' ')

  // balances
  if (message[0].toLocaleLowerCase() === 'balances') {
    console.log('balances', message)

    // reply
    // ctx.reply('fetching balance for ' + user)
    var reply = JSON.stringify(ledger, null, 2)
    console.log(reply)
    ctx.reply(reply)
  }

  // balance
  if (message[0].toLocaleLowerCase() === 'balance') {
    console.log('balance', message)

    // get user for balance
    var user = from
    if (message[1] && usernames[message[1]]) {
      user = usernames[message[1]]
    }

    // get balance
    var balance = ledger[user] || 0
    console.log(ledger)
    console.log(balance)

    // reply
    // ctx.reply('fetching balance for ' + user)
    ctx.reply('balance:' + balance + ' (' + getNickFromId(user) + ')')
  }

  // sweep
  if (message[0].toLocaleLowerCase() === 'sweep') {
    console.log('sweep', message)

    // get sweep tx
    var tx = message[1].split(':')
    var vout = tx[1] || 0
    if (!tx) {
      ctx.reply(`need a tx to sweep`)
      return
    }

    try {
      var rawtx = require(homedir + '/.gitmark/tx/' + tx[0] + '.json')

    } catch (e) {
      console.log(e)
      ctx.reply(`I dont know about tx: ${tx[0]}
searching ... try again in 15s`)
console.log(tx[0] , tx[0].length === 64 , tx[0].match(/^[0-9]abcdef$/))
      if (tx[0] && tx[0].length === 64 && tx[0].match(/^[0-9abcdef]+$/)) {
        var cmd = `./tx.sh ${tx[0]}`
        console.log('downloading')
        console.log(cmd)
        exec(cmd, console.log)
      }
      return
    }

    console.log('rawtx', rawtx)
    outputs = rawtx.outputs
    console.log('outputs', outputs)
    var output = outputs[vout]
    console.log('output', output)

    var amount = output.amount * 1000
    var outputaddress = output.addr

    var user = from
    var hash = computeSHA256(user)
    var privkey = getPrivKey(data.file)

    // priv keys
    const b1 = BigInt('0x' + privkey)
    const b2 = BigInt('0x' + hash)
    const b3 = BigInt.asUintN(256, b1 + b2)

    var keyPair3 = bitcoin.ECPair.fromPrivateKey(
      Buffer.from(b3.toString(16).padStart(64, 0), 'hex')
    )

    // address from priv key addition
    var { address } = bitcoin.payments.p2pkh({
      pubkey: keyPair3.publicKey,
      network: BITMARK
    })

    if (address === outputaddress) {
      console.log('matches')
    } else {
      console.log('address does not match user')
      ctx.reply(`address does not match user`)
      return
    }

    // check for dups
    var dup = credits.find(e => e.source === message[1] )
    if (dup) {
      console.log('duplicate')
      ctx.reply(`duplicate`)
      return
    }


    console.log('sweeping')
    var source = message[1]
    ledger[user] += amount
    console.log('newledger', ledger)
    ctx.reply('swept ' + amount + ' to ' + user + ' via ' + message[1])
    var credit = { source: tx[0] + ':' + tx[1], destination: user, amount: amount, timestamp: Math.floor(Date.now() / 1000) }
    console.log(credit)
    if (credit) {
      credits.push(credit)
    }
    console.log(credits)
    console.log(ledger)

    // write files
    console.log('wrting files', ledgerFile, creditsFile)
    fs.writeFileSync(ledgerFile, JSON.stringify(ledger, null, 2))
    fs.writeFileSync(creditsFile, JSON.stringify(credits, null, 2))


    // reply
    // ctx.reply('fetching balance for ' + user)
    // ctx.reply(`sweep ${message[1]}`)
  }

  // mark
  if (message[0].toLocaleLowerCase() === 'mark') {
    console.log('mark', message)

    // get user for mark
    var user = from

    // get destination
    var destination = null
    if (message[1] && usernames[message[1]]) {
      destination = usernames[message[1]]
    }    
    if (!destination) {
      ctx.reply('no destination to mark')
      return;
    }

    // get amount
    var amount = null
    if (message[2]) {
      var amount = parseInt(message[2])
    }
    if (!amount) {
      ctx.reply('specify a non zero amount to mark')
      return;
    }

    // get reason
    message.shift()
    message.shift()
    message.shift()
    console.log('reason', message)

    // get balance
    var balance = ledger[user] || 0
    console.log(ledger)
    console.log(balance)

    // check funds
    if (balance && balance > 0 && amount && amount > 0 && balance - amount >= 0) {
      console.log('marking')
      ledger[user] -= amount
      ledger[destination] += amount
      console.log('newledger', ledger)
      ctx.reply('marked ' + amount + ' to ' + destination)
      var credit = { source: user, destination: destination, amount: amount, comment: message.join(' '), timestamp: Math.floor(Date.now() / 1000) }
      console.log(credit)
      if (credit) {
        credits.push(credit)
      }
      console.log(credits)
      console.log(ledger)

      // write files
      console.log('wrting files', ledgerFile, creditsFile)
      fs.writeFileSync(ledgerFile, JSON.stringify(ledger, null, 2))
      fs.writeFileSync(creditsFile, JSON.stringify(credits, null, 2))
    } else {
      console.log('no funds')
      ctx.reply('no funds')
    }

  }  

  // deposit
  if (message[0].toLocaleLowerCase() === 'deposit') {
    console.log('deposit', message)

    var user = from
    var hash = computeSHA256(user)
    var privkey = getPrivKey(data.file)

    // priv keys
    const b1 = BigInt('0x' + privkey)
    const b2 = BigInt('0x' + hash)
    const b3 = BigInt.asUintN(256, b1 + b2)

    var keyPair3 = bitcoin.ECPair.fromPrivateKey(
      Buffer.from(b3.toString(16).padStart(64, 0), 'hex')
    )

    // address from priv key addition
    var { address } = bitcoin.payments.p2pkh({
      pubkey: keyPair3.publicKey,
      network: BITMARK
    })
    console.log('address computed from private', address)    

    // get user for balance
    if (message[1] && usernames[message[1]]) {
      user = usernames[message[1]]
    }

    // reply
    ctx.reply(`Deposit Details:

________________
nick: ${getNickFromId(user)}
userid: ${user} 
Hash: ${hash}
________________

deposit address: ${address}

After 1 confirmation tx type:

sweep <txid:vout>
`)

  }

  // withdraw
  if (message[0].toLocaleLowerCase() === 'withdraw') {
    console.log('withdraw', message)

    var user = from
    var amount = message[1]
    if (!amount || amount > ledger[user]) {
      ctx.reply('not enough funds')
      return
    } 

    var destination = message[2]
    if (!destination) {
      ctx.reply('need a destination')
      return
    }

    function getAllPegs() {
      var deposits = credits.filter(e => {return e.source.match(/^[0-9a-f]{64}:[0-9]+$/) })

      var withdrawals = credits.filter(e => {return e.destination.match(/^[0-9a-f]{64}:[0-9]+$/) })

      return deposits.concat(withdrawals)

    }

    var allPegs = getAllPegs()
    console.log('allpegs', allPegs)

    var utxo = []
    var missing = []
    allPegs.forEach(e => {

      var type = 'deposit'
      var out = e.source
      var mult = 1
      if (e.destination.match(/^[0-9a-f]{64}:[0-9]+$/)) {
        type = 'withdrawal'
        out = e.destination
        mult = -1
      }

      const gitmarkTxBase = homedir + '/.gitmark/tx'



      const txFile = gitmarkTxBase + '/' + out.split(':')[0] + '.json'

      try {
        var tx = require(txFile)
      } catch {
        console.log('missing', out.split(':')[0])
        missing.push(out.split(':')[0])
      }

      var output = tx.outputs[out.split(':')[1]]
      console.log('tx', tx)
      console.log('received', tx.inputs.received_from)
      console.log(output)
      var obj = { txid: out, amount: output.amount * 1000, fee: tx.fees*1000, addr: output.addr, txin: out, comment: e.comment }
      utxo.push(obj)
      
    })
    
    console.log('utxo', utxo)
    var withdrawals = utxo.filter(e => e.comment.match(/withrawal /) )
    console.log('withdrawals', withdrawals)
    withdrawals.forEach(i => {
      console.log('processing withdrawals')
      console.log(i.comment)
      var f = utxo.findIndex(e => e.txid === i.comment.split(' ')[1])
      console.log('f', f, utxo[f])
      utxo[f].amount = utxo[f].amount - i.amount - i.fee
    })
    console.log('processed utxo', utxo)


    var user = from
    var hash = computeSHA256(user)
    var privkey = getPrivKey(data.file)

    // priv keys
    const b1 = BigInt('0x' + privkey)
    const b2 = BigInt('0x' + hash)
    const b3 = BigInt.asUintN(256, b1 + b2)

    var keyPair3 = bitcoin.ECPair.fromPrivateKey(
      Buffer.from(b3.toString(16).padStart(64, 0), 'hex')
    )

    // address from priv key addition
    var { address } = bitcoin.payments.p2pkh({
      pubkey: keyPair3.publicKey,
      network: BITMARK
    })

    var mine = utxo.filter(e => e.addr === address)
    mine= mine.sort((a, b) => b.amount - a.amount)
    console.log('mine', mine)
    var biggest = mine[0]
    console.log('biggest', biggest)


    if (missing.length > 0) {
      console.log('missing', missing)
      ctx.reply('missing tx ' + missing)
      return
    }

    if (amount > biggest.amount) {
      console.log('amount too high max', biggest.amount)
      ctx.reply('witdhrawal amount too high max is ' + biggest.amount)
      return
    }

    var min = 100 
    if (amount <  min) {
      console.log('min amount is', min)
      ctx.reply('with withdrawal ' + min)
      return
    }

    var fee = 0.01
    var newtx = {
      txin: biggest.txin,
      inputAmount: biggest.amount,
      outputAddress: message[2],
      amount: amount,
      fee: fee,
      proceeds: amount - fee,
      changeAddress: biggest.addr,
      changeAmount: biggest.amount - amount
    }

    console.log(newtx)

    var keyPair3 = bitcoin.ECPair.fromPrivateKey(
      Buffer.from(b3.toString(16).padStart(64, 0), 'hex'),
      { network: BITMARK }
    )
    var privkey = keyPair3.toWIF()
    console.log('private key WIF:', privkey)

    if (newtx.changeAmount === 0) {
      console.log(`btm bin/tx.sh ${newtx.txin.split(':')[0]} ${newtx.txin.split(':')[1]} ${newtx.outputAddress} ${newtx.proceeds / 1000} ${privkey}`)
    } else {
      console.log(`btm bin/tx.sh ${newtx.txin.split(':')[0]} ${newtx.txin.split(':')[1]} ${newtx.outputAddress} ${newtx.proceeds / 1000} ${privkey}`)
    }

    ctx.reply(`${JSON.stringify(newtx, null, 2)}`)


    ctx.reply(`withdrawal request from ${biggest.txin} ${amount} of ${biggest.amount} to ${message[2]} queued for processing`)
  }

  // help
  if (message[0].toLocaleLowerCase() === 'help') {
    console.log('help', message)

    ctx.reply(`Markbot help:

balance [user] - get balance
balances - all balances
deposit - get your deposit adddress
mark @user amount [comment] - mark user
sweep - sweep a desposit into the ledger`)
  }



  // fun stuff
  if (text === 'open pod bay doors') {
    ctx.reply('I cant allow you to do that, Dave')
  }


})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))