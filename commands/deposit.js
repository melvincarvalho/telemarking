const { getNickFromId } = require('../functions.js')
const { computeSHA256 } = require('../functions.js')
const { getPrivKey } = require('../functions.js')
const { addressFromKeys } = require('../functions.js')

function deposit (ctx, message, user, privkeyfile, usernames) {
  const obj = action(message, user, privkeyfile, usernames)

  // reply
  const str = render(obj.user, obj.hash, obj.address)
  ctx.reply(str)
}

function action (message, user, privkeyfile, usernames) {
  console.log('deposit', message)

  // get user for desposit
  if (message[1] && usernames[message[1]]) {
    user = usernames[message[1]]
  }

  const hash = computeSHA256(user)
  const privkey = getPrivKey(privkeyfile)
  const address = addressFromKeys(privkey, hash)

  console.log('address computed from private', address)

  return { user: user, hash: hash, address: address }
}

/**
 *
 * @param {string} user the user URI
 * @param {string} hash sha256 of user URI
 * @param {string} address address to deposit to
 * @returns string message to display
 */
function render (user, hash, address) {
  return `Deposit Details:

________________
nick: ${getNickFromId(user)}
userid: ${user} 
Hash: ${hash}
________________

deposit address: ${address}

After 1 confirmation tx type:

sweep <txid:vout>
`
}

exports.deposit = deposit
