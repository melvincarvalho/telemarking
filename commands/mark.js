const fs = require('fs')

function mark (ctx, user, usernames, message, ledger, credits, ledgerFile, creditsFile) {
  console.log('mark', message)

  // get destination
  let destination = null
  if (message[1] && usernames[message[1]]) {
    destination = usernames[message[1]]
  }
  if (!destination) {
    ctx.reply('no destination to mark')
    return
  }

  // get amount
  var amount = null
  if (message[2]) {
    var amount = parseInt(message[2])
  }
  if (!amount) {
    ctx.reply('specify a non zero amount to mark')
    return
  }

  // get reason
  message.shift()
  message.shift()
  message.shift()
  console.log('reason', message)

  // get balance
  const balance = ledger[user] || 0
  console.log(ledger)
  console.log(balance)

  // check funds
  if (balance && balance > 0 && amount && amount > 0 && balance - amount >= 0) {
    console.log('marking')
    ledger[user] -= amount
    ledger[destination] += amount
    console.log('newledger', ledger)
    ctx.reply('marked ' + amount + ' to ' + destination)
    const credit = { source: user, destination: destination, amount: amount, comment: message.join(' '), timestamp: Math.floor(Date.now() / 1000) }
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

exports.mark = mark
