#!/usr/bin/env node

// USAGE: export token then run bot

// requires
const argv = require('minimist')(process.argv.slice(2))

const { Telegraf } = require('telegraf')

// commands
const commands = {}
commands.help = require('./commands/help.js').help
commands.marks = require('./commands/marks.js').marks
commands.balances = require('./commands/balances.js').balances
commands.wallet = require('./commands/wallet.js').wallet
commands.givers = require('./commands/givers.js').givers
commands.balance = require('./commands/balance.js').balance
commands.mark = require('./commands/mark.js').mark
commands.deposit = require('./commands/deposit.js').deposit
commands.sweep = require('./commands/sweep.js').sweep
commands.withdraw = require('./commands/withdraw.js').withdraw

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

  // deposit
  if (message[0].toLocaleLowerCase() === 'deposit') {
    console.log('deposit', message)
    commands.deposit(ctx, message, from, data.file, usernames)
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

  // sweep
  if (message[0].toLocaleLowerCase() === 'sweep') {
    console.log('sweep', message)
    commands.sweep(ctx, message, from, data.file, ledger, credits, ledgerFile, creditsFile)
  }

  // withdraw
  if (message[0].toLocaleLowerCase() === 'withdraw') {
    console.log('withdraw', message)
    commands.withdraw(ctx, message, from, data.file, ledger, credits, ledgerFile, creditsFile)
  }

})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))