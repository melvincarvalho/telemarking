const {createHash} = require('crypto')
const fs = require('fs')
const homedir = require('os').homedir()
const bitcoin = require('bitcoinjs-lib')

// network
const BITMARK = {
  messagePrefix: '\x19BITMARK Signed Message:\n',
  bech32: 'btm',
  bip32: {
    public: 0x019da462,
    private: 0x019d9cfe
  },
  pubKeyHash: 85,
  scriptHash: 0x32,
  wif: 213
}

function addressFromKeys(privkey, hash) {
  const b1 = BigInt('0x' + privkey)
  const b2 = BigInt('0x' + hash)
  const b3 = BigInt.asUintN(256, b1 + b2)

  var keyPair3 = bitcoin.ECPair.fromPrivateKey(
    Buffer.from(b3.toString(16).padStart(64, 0), 'hex')
  )

  // address from priv key addition
  var { address } = bitcoin.payments.p2pkh({
    pubkey: keyPair3.publicKey,
    network: BITMARK
  })

  return address
}

function privAddressFromKeys(privkey, hash) {
  const b1 = BigInt('0x' + privkey)
  const b2 = BigInt('0x' + hash)
  const b3 = BigInt.asUintN(256, b1 + b2)

  var keyPair3 = bitcoin.ECPair.fromPrivateKey(
    Buffer.from(b3.toString(16).padStart(64, 0), 'hex'),
    { network: BITMARK }
  )
  var privkey = keyPair3.toWIF()
  
  return privkey
}


function getPrivKey (file) {
  try {
    const fetchHeadDir = './.git/'
    var fetchHeadFile = fetchHeadDir + 'FETCH_HEAD'

    var fetchHead = fs.readFileSync(fetchHeadFile).toString()

    var repo = fetchHead
      .split(' ')
      .pop()
      .replace(':', '/')
      .replace('\n', '')

    const gitmarkRepoBase = homedir + '/.gitmark/repo'

    const gitmarkFile = file || gitmarkRepoBase + '/' + repo + '/gitmark.json'

    return require(gitmarkFile).privkey
  } catch (e) {
    const fetchHeadDir = './.git/'
    var fetchHeadFile = fetchHeadDir + 'FETCH_HEAD'

    var fetchHead = fs.readFileSync(fetchHeadFile).toString()

    var repo = fetchHead
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


function getNickFromId(key) {
  var usernames = require('./usernames.json')
  var keys = Object.keys(usernames)
  var ret = keys.find(el => usernames[el] === key) 
  return ret || key
}

function computeSHA256(lines) {
  const hash = createHash('sha256');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim(); // remove leading/trailing whitespace
    if (line === '') continue; // skip empty lines
    hash.write(line); // write a single line to the buffer
  }

  return hash.digest('hex'); // returns hash as string
}

exports.computeSHA256 = computeSHA256
exports.getNickFromId = getNickFromId
exports.getPrivKey = getPrivKey
exports.addressFromKeys = addressFromKeys
exports.privAddressFromKeys = privAddressFromKeys
