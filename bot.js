#!/usr/bin/env node

// USAGE: export token then run bot

// requires
const fs = require('fs')
const argv = require('minimist')(process.argv.slice(2))
const homedir = require('os').homedir()

const bitcoin = require('bitcoinjs-lib')
const { Telegraf } = require('telegraf')
const exec = require('child_process').exec

// commands
const commands = {}
commands.help = require('./commands/help.js').help
commands.marks = require('./commands/marks.js').marks
commands.balances = require('./commands/balances.js').balances
commands.wallet = require('./commands/wallet.js').wallet
commands.givers = require('./commands/givers.js').givers
commands.balance = require('./commands/balance.js').balance
commands.mark = require('./commands/mark.js').mark

// functions
const getNickFromId = require('./functions.js').getNickFromId

const computeSHA256 = require('./functions.js').computeSHA256

const getPrivKey = require('./functions.js').getPrivKey
const addressFromKeys = require('./functions.js').addressFromKeys


// network
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


// model
globalThis.data = {
  ledger: null,
  credits: null,
  file: null,
  txexe: ''
}


//  init
var ledgerFile = argv.ledger 
var creditsFile = argv.credits 
var walletFile = argv.wallet
data.file = argv.file || data.file
data.txexe = argv.txexe || data.txexe

var ledger = require(ledgerFile)
var credits = require(creditsFile)
var wallet = require(walletFile)

var usernames = require('./usernames.json')





// main
const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start((ctx) => ctx.reply('Welcome'))
bot.help((ctx) => ctx.reply('Send me a sticker'))

// events
bot.on('text', (ctx) => {
  // log
  console.log(ctx.message)

  // get from id
  var from = 'urn:telegram:' + ctx.message.from.id

  // get text and split into message array
  var text = ctx.message.text
  var message = text.split(' ')

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
    var credit = { source: tx[0] + ':' + tx[1], destination: user, amount: amount, comment: 'deposit', timestamp: Math.floor(Date.now() / 1000) }
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


  // deposit
  if (message[0].toLocaleLowerCase() === 'deposit') {
    console.log('deposit', message)

    var user = from
    var hash = computeSHA256(user)
    var privkey = getPrivKey(data.file)

    var address = addressFromKeys(privkey, hash)
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
        ctx.reply('missing tx ' + out.split(':')[0])
        return
      }

      var vout = parseInt(out.split(':')[1])
      console.log('vout', vout)
      if (type === 'deposit') {
        var output = tx.outputs[vout]
      } else {
        var vout = vout === 0 ? 1 : 0        
        console.log('withdrawal vout', vout)
        var output = tx.outputs[vout]
        
        if (!output) {
          var obj = { txid: `${out.split(':')[0]}:${0}`, amount: 0, fee: 0, addr: 0, txin: out, comment: e.comment }
          utxo.push(obj)
          return
        }
      }
      console.log('tx', tx)
      console.log('received', tx.inputs.received_from)
      console.log(output)
      var obj = { txid: `${out.split(':')[0]}:${vout}`, amount: output.amount * 1000, fee: tx.fees*1000, addr: output.addr, txin: out, comment: e.comment }
      utxo.push(obj)
      
    })
    
    console.log('utxo', utxo)
    var withdrawals = utxo.filter(e => e.comment && e.comment.match && e.comment.match(/withdrawal /) )
    console.log('withdrawals', withdrawals)
    withdrawals.forEach(i => {
      console.log('processing withdrawals')
      console.log(i.comment)
      var f = utxo.findIndex(e => e.txid === i.comment.split(' ')[1])
      console.log('f', f, utxo[f])
      utxo[f].amount = 0
      
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
      ctx.reply('im missing tx ' + missing[0] + ' try again in 15s...')

      var cmd = `./tx.sh ${missing[0]}`
      console.log('downloading')
      console.log(cmd)
      exec(cmd, console.log)

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
      txin: biggest.txid,
      inputAmount: biggest.amount,
      outputAddress: message[2],
      amount: amount,
      fee: fee,
      proceeds: amount - fee,
      changeAddress: biggest.addr,
      changeAmount: biggest.amount - amount
    }

    console.log('newtx', newtx)

    var keyPair3 = bitcoin.ECPair.fromPrivateKey(
      Buffer.from(b3.toString(16).padStart(64, 0), 'hex'),
      { network: BITMARK }
    )
    var privkey = keyPair3.toWIF()
    console.log('private key WIF:', privkey)

    if (newtx.changeAmount === 0) {
      var cmd = `${data.txexe}tx.sh ${newtx.txin.split(':')[0]} ${newtx.txin.split(':')[1]} ${newtx.outputAddress} ${newtx.proceeds / 1000} ${privkey}`
      console.log('running', cmd)
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error(`error: ${error.message}`);
          ctx.reply(`error: ${error.message}`)
          return;
        }
      
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          ctx.reply(`stderr: ${stderr}`)
          return;
        }
      
        console.log(`txid:\n${stdout}`);
        ctx.reply(`transaction submitted, please wait c. 2 minutes for one confirmation`);
        ctx.reply(`txid:\n${stdout}`);

        ledger[user] -= newtx.amount
        var credit = { source: user, destination: `${stdout.replace('\n', '')}:0`, comment: `withdrawal ${w.txin}`, amount: newtx.amount, timestamp: Math.floor(Date.now() / 1000) }
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

      })
    } else {
      var cmd = `${data.txexe}txc.sh ${newtx.txin.split(':')[0]} ${newtx.txin.split(':')[1]} ${newtx.outputAddress} ${newtx.proceeds / 1000} ${privkey} ${newtx.changeAddress} ${newtx.changeAmount/1000}`
      console.log('running', cmd)    
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error(`error: ${error.message}`);
          ctx.reply(`error: ${error.message}`)
          return;
        }
      
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          ctx.reply(`stderr: ${stderr}`)
          return;
        }
      
        console.log(`txid:\n${stdout}`);
        ctx.reply(`transaction submitted, please wait c. 2 minutes for one confirmation`);
        ctx.reply(`txid:\n${stdout}`);

        ledger[user] -= newtx.amount
        var credit = { source: user, destination: `${stdout.replace('\n', '')}:0`, comment: `withdrawal ${newtx.txin}`, amount: newtx.amount, timestamp: Math.floor(Date.now() / 1000) }
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

      })
    }

    ctx.reply(`${JSON.stringify(newtx, null, 2)}`)


    ctx.reply(`withdrawal request from ${biggest.txin} ${amount} of ${biggest.amount} to ${message[2]} queued for processing`)
  }

  // marks
  if (message[0].toLocaleLowerCase() === 'marks') {
    console.log('marks', message)

    commands.marks(ctx, wallet, credits)
  }

  // givers
  if (message[0].toLocaleLowerCase() === 'givers') {
    console.log('givers', message)

    commands.givers(ctx, credits)
  }

  // balances
  if (message[0].toLocaleLowerCase() === 'balances') {
    console.log('balances', message)

    commands.balances(ctx, ledger)
  }

  // balance
  if (message[0].toLocaleLowerCase() === 'balance') {
    console.log('balance', message)
    commands.balance(ctx, message, from, ledger, usernames)
  }
  

  // wallet
  if (message[0].toLocaleLowerCase() === 'wallet') {
    console.log('wallet', message)
    commands.wallet(ctx, wallet)
  }

  // mark
  if (message[0].toLocaleLowerCase() === 'mark') {
    console.log('mark', message)
    commands.mark(ctx, from, usernames, message, ledger, credits, ledgerFile, creditsFile)
  }  

  // help
  if (message[0].toLocaleLowerCase() === 'help') {
    console.log('help', message)
    commands.help(ctx)
  }


})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))