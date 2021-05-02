// REQUIRES
const {
  pubAddressFromKeys,
  sha256,
  getNickFromId,
  getPrivKey
} = require('../functions.js')

/**
 *
 * @param {Object} ctx - Telegram context
 * @param {Array} message - Tokenized message
 * @param {string} user - User URI
 * @param {string} privkeyfile - Private key file
 * @param {Array} usernames - Array of usernames
 */
function deposit (ctx, message, user, privkeyfile, usernames) {
  const obj = action(message, user, privkeyfile, usernames)

  // reply
  const str = render(obj.user, obj.hash, obj.address)
  ctx.reply(str)
}

/**
 *
 * @param {Array} message - Tokenized message
 * @param {string} user - User URI
 * @param {string} privkeyfile - Private key file
 * @param {Array} usernames - Array of usernames
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
  const address = pubAddressFromKeys(privkey, hash)

  console.log('address computed from private', address)

  return { user: user, hash: hash, address: address }
}

funciton pubAddressForUser(user, key) {
  
}

/**
 *
 * @param {string} user - The user URI
 * @param {string} hash - Sha256 of user URI
 * @param {string} address - Address to deposit to
 * @returns {string} Message to display
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
