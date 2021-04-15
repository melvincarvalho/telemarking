
// USAGE: export token then run bot

// requires
const fs = require('fs')
const { Telegraf } = require('telegraf')
var argv = require('minimist')(process.argv.slice(2))


// MODEL
globalThis.data = {
  ledger: null,
  credits: null
}

//  init
var ledgerFile = argv.ledger 
var creditsFile = argv.credits 

var ledger = require(ledgerFile)
var credits = require(creditsFile)

var usernames = require('./usernames.json')

// functions
function getNickFromId(key) {
  var keys = Object.keys(usernames)
  var ret = keys.find(el => usernames[el] === key) 
  return ret || key
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

  // fun stuff
  if (text === 'open pod bay doors') {
    ctx.reply('I cant allow you to do that, Dave')
  }


})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))