const exec = require('child_process').exec

const homedir = require('os').homedir()
const fs = require('fs')

const computeSHA256 = require('../functions.js').computeSHA256

const getPrivKey = require('../functions.js').getPrivKey

const addressFromKeys = require('../functions.js').addressFromKeys

function sweep (ctx, message, user, file, ledger, credits, ledgerFile, creditsFile) {
  // get sweep tx
  const tx = message[1].split(':')
  const vout = tx[1] || 0
  if (!tx) {
    ctx.reply('need a tx to sweep')
    return
  }

  try {
    var rawtx = require(homedir + '/.gitmark/tx/' + tx[0] + '.json')
  } catch (e) {
    console.log(e)
    ctx.reply(`I dont know about tx: ${tx[0]}
searching ... try again in 15s`)
    console.log(tx[0], tx[0].length === 64, tx[0].match(/^[0-9]abcdef$/))
    if (tx[0] && tx[0].length === 64 && tx[0].match(/^[0-9abcdef]+$/)) {
      const cmd = `./tx.sh ${tx[0]}`
      console.log('downloading')
      console.log(cmd)
      exec(cmd, console.log)
    }
    return
  }

  console.log('rawtx', rawtx)
  outputs = rawtx.outputs
  console.log('outputs', outputs)
  const output = outputs[vout]
  console.log('output', output)

  const amount = output.amount * 1000
  const outputaddress = output.addr

  const hash = computeSHA256(user)
  const privkey = getPrivKey(file)

  // priv keys
  const address = addressFromKeys(privkey, hash)

  if (address === outputaddress) {
    console.log('matches')
  } else {
    console.log('address does not match user')
    ctx.reply('address does not match user')
    return
  }

  // check for dups
  const dup = credits.find(e => e.source === message[1])
  if (dup) {
    console.log('duplicate')
    ctx.reply('duplicate')
    return
  }

  console.log('sweeping')
  const source = message[1]
  ledger[user] += amount
  console.log('newledger', ledger)
  ctx.reply('swept ' + amount + ' to ' + user + ' via ' + message[1])
  const credit = { source: tx[0] + ':' + tx[1], destination: user, amount: amount, comment: 'deposit', timestamp: Math.floor(Date.now() / 1000) }
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
}

exports.sweep = sweep
