// var NETWORK = BITCOIN
// var NETWORK = LITECOIN
// var NETWORK = BITMARK
// var NETWORK = TESTNET
const NETWORK = require('./networks.js').BITMARK

const { createHash } = require('crypto')
const fs = require('fs')
const homedir = require('os').homedir()
const bitcoin = require('bitcoinjs-lib')

function addressFromKeys (privkey, hash) {
  const b1 = BigInt('0x' + privkey)
  const b2 = BigInt('0x' + hash)
  const b3 = BigInt.asUintN(256, b1 + b2)

  const keyPair3 = bitcoin.ECPair.fromPrivateKey(
    Buffer.from(b3.toString(16).padStart(64, 0), 'hex')
  )

  // address from priv key addition
  const { address } = bitcoin.payments.p2pkh({
    pubkey: keyPair3.publicKey,
    network: NETWORK
  })

  return address
}

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

function getNickFromId (key) {
  const usernames = require('./usernames.json')
  const keys = Object.keys(usernames)
  const ret = keys.find(el => usernames[el] === key)
  return ret || key
}

function computeSHA256 (lines) {
  const hash = createHash('sha256')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim() // remove leading/trailing whitespace
    if (line === '') continue // skip empty lines
    hash.write(line) // write a single line to the buffer
  }

  return hash.digest('hex') // returns hash as string
}

function sha256 (lines) {
  const hash = createHash('sha256')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim() // remove leading/trailing whitespace
    if (line === '') continue // skip empty lines
    hash.write(line) // write a single line to the buffer
  }

  return hash.digest('hex') // returns hash as string
}

exports.computeSHA256 = computeSHA256
exports.sha256 = sha256
exports.getNickFromId = getNickFromId
exports.getPrivKey = getPrivKey
exports.addressFromKeys = addressFromKeys
exports.privAddressFromKeys = privAddressFromKeys
