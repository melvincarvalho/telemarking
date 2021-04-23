const getNickFromId = require('../functions.js').getNickFromId

function balance(ctx, message, user, ledger, usernames) {

    // get user for balance
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

exports.balance = balance