const getNickFromId = require('../functions.js').getNickFromId

const computeSHA256 = require('../functions.js').computeSHA256

const getPrivKey = require('../functions.js').getPrivKey

const addressFromKeys = require('../functions.js').addressFromKeys

function deposit (ctx, message, user, file, usernames) {
  console.log('deposit', message)

  const hash = computeSHA256(user)
  const privkey = getPrivKey(file)

  const address = addressFromKeys(privkey, hash)
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

exports.deposit = deposit
