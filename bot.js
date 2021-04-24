#!/usr/bin/env node

// USAGE: export token then run bot

// requires
const argv = require('minimist')(process.argv.slice(2))

const { Telegraf } = require('telegraf')

// commands
const commands = {
  help: require('./commands/help.js').help,
  marks: require('./commands/marks.js').marks,
  balances: require('./commands/balances.js').balances,
  wallet: require('./commands/wallet.js').wallet,
  givers: require('./commands/givers.js').givers,
  balance: require('./commands/balance.js').balance,
  mark: require('./commands/mark.js').mark,
  deposit: require('./commands/deposit.js').deposit,
  sweep: require('./commands/sweep.js').sweep,
  withdraw: require('./commands/withdraw.js').withdraw
}

// model
globalThis.data = {
  ledger: null,
  credits: null,
  file: null,
  txexe: '',
  // BITCOIN, LITECOIN, LIQUID, BITMARK, TESTNET3
  network: require('./networks.js').BITMARK
}

//  init
const ledgerFile = argv.ledger
const creditsFile = argv.credits
const walletFile = argv.wallet
data.file = argv.file || data.file
data.txexe = argv.txexe || data.txexe

const ledger = require(ledgerFile)
const credits = require(creditsFile)
const wallet = require(walletFile)

const usernames = require('./usernames.json')

// main
const bot = new Telegraf(process.env.BOT_TOKEN)
bot.start(ctx => ctx.reply('Welcome'))
bot.help(ctx => ctx.reply('Send me a sticker'))

// events
bot.on('text', ctx => {
  // log
  console.log(ctx.message)

  // get from id
  const from = 'urn:telegram:' + ctx.message.from.id

  // get text and split into message array
  const text = ctx.message.text
  const message = text.split(' ')

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
    commands.mark(
      ctx,
      from,
      usernames,
      message,
      ledger,
      credits,
      ledgerFile,
      creditsFile
    )
  }

  // help
  if (message[0].toLocaleLowerCase() === 'help') {
    console.log('help', message)
    commands.help(ctx)
  }

  // sweep
  if (message[0].toLocaleLowerCase() === 'sweep') {
    console.log('sweep', message)
    commands.sweep(
      ctx,
      message,
      from,
      data.file,
      ledger,
      credits,
      ledgerFile,
      creditsFile
    )
  }

  // withdraw
  if (message[0].toLocaleLowerCase() === 'withdraw') {
    console.log('withdraw', message)
    commands.withdraw(
      ctx,
      message,
      from,
      data.file,
      ledger,
      credits,
      ledgerFile,
      creditsFile
    )
  }
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
