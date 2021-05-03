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
 * @param {string} user - User URI
 * @param {string} privkeyFile - Private key file
 */
function deposit (ctx, user, privkeyFile) {
  // action
  const ret = depositAction(user, privkeyFile)

  // render
  const str = render(ret.user, ret.hash, ret.address)
  ctx.reply(str)
}

/**
 * Middleware for deposit
 * @param {string} user - User URI
 * @param {string} privkeyFile - Private key file
 * @returns
 */
function depositAction (user, privkeyFile) {
  const hash = sha256(user)
  const privkey = getPrivKey(privkeyFile)
  const address = pubAddressFromKeys(privkey, hash)

  return { user: user, hash: hash, address: address }
}

/**
 * Render to chat
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
