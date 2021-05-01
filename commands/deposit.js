// REQUIRES
const {
  addressFromKeys,
  sha256,
  getNickFromId,
  getPrivKey
} = require('../functions.js')

/**
 *
 * @param {Context} ctx Telegram context
 * @param {string} message message string
 * @param {string} user user URI
 * @param {string} privkeyfile where the private key is
 * @param {array} usernames array of usernames
 */
function deposit (ctx, message, user, privkeyfile, usernames) {
  const obj = action(message, user, privkeyfile, usernames)

  // reply
  const str = render(obj.user, obj.hash, obj.address)
  ctx.reply(str)
}
/**
 *
 * @param {string} message message string
 * @param {*} user user URI
 * @param {*} privkeyfile where the private key is
 * @param {*} usernames array of usernames
 * @returns
 */
function action (message, user, privkeyfile, usernames) {
  console.log('deposit', message)

  // get user for desposit
  if (message[1] && usernames[message[1]]) {
    user = usernames[message[1]]
  }

  const hash = sha256(user)
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
