// NETWORK
//
// var NETWORK = BITCOIN
// var NETWORK = LITECOIN
// var NETWORK = BITMARK
// var NETWORK = TESTNET
const NETWORK = require('./networks.js').BITMARK

// REQUIRES
const bitcoin = require('bitcoinjs-lib')
const { createHash } = require('crypto')
const fs = require('fs')
const homedir = require('os').homedir()

/**
 * Add two 256 bit unsigned BigInts together
 * @param {BigInt} a - First number to add
 * @param {BigInt} b - Second number to add
 * @returns {BigInt} Sum as unsigned BigInt
 */
function add (a, b) {
  return BigInt.asUintN(256, a + b)
}

/**
 * Gets a base58 public key from a privkey and hash
 * @param {string} privkey - Private key in hex
 * @param {string} hash - Hash in hex
 * @returns {string} Public key base58
 */
function pubAddressFromKeys (privkey, hash) {
  const privkeyInt = hex2BigInt(privkey)
  const hashInt = hex2BigInt(hash)
  const sumInt = add(privkeyInt, hashInt)

  const pubkeyAddress = bigIntToPubKeyAddress(sumInt, NETWORK)

  return pubkeyAddress
}

/**
 * Gets a base58 private key from a privkey and hash
 * @param {string} privkey - Private key in hex
 * @param {string} hash - Hash in hex
 * @returns {string} Private key base58
 */
 function privAddressFromKeys (privkey, hash) {
  const b1 = BigInt('0x' + privkey)
  const b2 = BigInt('0x' + hash)
  const b3 = BigInt.asUintN(256, b1 + b2)

  const keyPair3 = bitcoin.ECPair.fromPrivateKey(
    Buffer.from(b3.toString(16).padStart(64, 0), 'hex'),
    { network: NETWORK }
  )
  return keyPair3.toWIF()
}

/**
 * Converts a BigInt to a base58 public key address
 * @param {BigInt} num - The public key
 * @param {string} network - Network to use
 * @returns {string} Public key address for that network
 */
function bigIntToPubKeyAddress (num, network) {
  const pair = bitcoin.ECPair.fromPrivateKey(
    Buffer.from(num.toString(16).padStart(64, 0), 'hex')
  )

  // address from priv key addition
  const { address } = bitcoin.payments.p2pkh({
    pubkey: pair.publicKey,
    network: network
  })

  return address
}

/**
 * Converts hex to a BigInt
 * @param {string} hex - 64 byte hex
 * @returns {BigInt} 256 bit BigInt
 */
function hex2BigInt (hex) {
  return BigInt('0x' + hex)
}

/**
 * Gets a privkey from a file
 * @param {string} file - Containing privkey
 * @returns {string} Privkey
 */
function getPrivKey (file) {
  try {
    const fetchHeadDir = './.git/'
    const fetchHeadFile = fetchHeadDir + 'FETCH_HEAD'

    const fetchHead = fs.readFileSync(fetchHeadFile).toString()

    const repo = fetchHead
      .split(' ')
      .pop()
      .replace(':', '/')
      .replace('\n', '')

    const gitmarkRepoBase = homedir + '/.gitmark/repo'

    const gitmarkFile = file || gitmarkRepoBase + '/' + repo + '/gitmark.json'

    return require(gitmarkFile).privkey
  } catch (e) {
    const fetchHeadDir = './.git/'
    const fetchHeadFile = fetchHeadDir + 'FETCH_HEAD'

    const fetchHead = fs.readFileSync(fetchHeadFile).toString()

    const repo = fetchHead
      .split(' ')
      .pop()
      .replace(':', '/')
      .replace('\n', '')

    const gitmarkRepoBase = homedir + '/.gitmark/repo'

    const gitmarkFile = gitmarkRepoBase + '/' + repo + '/gitmark.json'

    console.log('no priv key found in', gitmarkFile)
    return undefined
  }
}

/**
 * Tries to get a nick from a key
 * @param {string} key - What to lookup
 * @returns {string} Nick or original key
 */
function getNickFromId (key) {
  const usernames = require('./usernames.json')
  const keys = Object.keys(usernames)
  const ret = keys.find(el => usernames[el] === key)
  return ret || key
}

/**
 * Gets a sha256 of a string
 * @param {string} input - String
 * @returns {string} Sha256 of a string
 */
function sha256 (lines) {
  const hash = createHash('sha256')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim() // remove leading/trailing whitespace
    if (line === '') continue // skip empty lines
    hash.write(line) // write a single line to the buffer
  }

  return hash.digest('hex') // returns hash as string
}

exports.getNickFromId = getNickFromId
exports.getPrivKey = getPrivKey
exports.pubAddressFromKeys = pubAddressFromKeys
exports.privAddressFromKeys = privAddressFromKeys
exports.sha256 = sha256
