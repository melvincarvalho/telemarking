const exec = require('child_process').exec

const homedir = require('os').homedir()
const fs = require('fs')

const computeSHA256 = require('../functions.js').computeSHA256

const getPrivKey = require('../functions.js').getPrivKey

const addressFromKeys = require('../functions.js').addressFromKeys
const privAddressFromKeys = require('../functions.js').privAddressFromKeys

function withdraw (ctx, message, user, file, ledger, credits, ledgerFile, creditsFile) {
  console.log('withdraw', message)

  const amount = message[1]
  if (!amount || amount > ledger[user]) {
    ctx.reply('not enough funds')
    return
  }

  const destination = message[2]
  if (!destination) {
    ctx.reply('need a destination')
    return
  }

  function getAllPegs () {
    const deposits = credits.filter(e => { return e.source.match(/^[0-9a-f]{64}:[0-9]+$/) })

    const withdrawals = credits.filter(e => { return e.destination.match(/^[0-9a-f]{64}:[0-9]+$/) })

    return deposits.concat(withdrawals)
  }

  const allPegs = getAllPegs()
  console.log('allpegs', allPegs)

  const utxo = []
  const missing = []
  allPegs.forEach(e => {
    let type = 'deposit'
    let out = e.source
    let mult = 1
    if (e.destination.match(/^[0-9a-f]{64}:[0-9]+$/)) {
      type = 'withdrawal'
      out = e.destination
      mult = -1
    }

    const gitmarkTxBase = homedir + '/.gitmark/tx'

    const txFile = gitmarkTxBase + '/' + out.split(':')[0] + '.json'

    try {
      var tx = require(txFile)
    } catch {
      console.log('missing', out.split(':')[0])
      missing.push(out.split(':')[0])
      ctx.reply('missing tx ' + out.split(':')[0])
      return
    }

    var vout = parseInt(out.split(':')[1])
    console.log('vout', vout)
    if (type === 'deposit') {
      var output = tx.outputs[vout]
    } else {
      var vout = vout === 0 ? 1 : 0
      console.log('withdrawal vout', vout)
      var output = tx.outputs[vout]

      if (!output) {
        let obj = { txid: `${out.split(':')[0]}:${0}`, amount: 0, fee: 0, addr: 0, txin: out, comment: e.comment }
        utxo.push(obj)
        return
      }
    }
    console.log('tx', tx)
    console.log('received', tx.inputs.received_from)
    console.log(output)
    let obj = { txid: `${out.split(':')[0]}:${vout}`, amount: output.amount * 1000, fee: tx.fees * 1000, addr: output.addr, txin: out, comment: e.comment }
    utxo.push(obj)
  })

  console.log('utxo', utxo)
  const withdrawals = utxo.filter(e => e.comment && e.comment.match && e.comment.match(/withdrawal /))
  console.log('withdrawals', withdrawals)
  withdrawals.forEach(i => {
    console.log('processing withdrawals')
    console.log(i.comment)
    const f = utxo.findIndex(e => e.txid === i.comment.split(' ')[1])
    console.log('f', f, utxo[f])
    utxo[f].amount = 0
  })
  console.log('processed utxo', utxo)

  const hash = computeSHA256(user)
  var privkey = getPrivKey(file)

  // priv keys
  const address = addressFromKeys(privkey, hash)

  let mine = utxo.filter(e => e.addr === address)
  mine = mine.sort((a, b) => b.amount - a.amount)
  console.log('mine', mine)
  const biggest = mine[0]
  console.log('biggest', biggest)

  if (missing.length > 0) {
    console.log('missing', missing)
    ctx.reply('im missing tx ' + missing[0] + ' try again in 15s...')

    var cmd = `./tx.sh ${missing[0]}`
    console.log('downloading')
    console.log(cmd)
    exec(cmd, console.log)

    return
  }

  if (amount > biggest.amount) {
    console.log('amount too high max', biggest.amount)
    ctx.reply('witdhrawal amount too high max is ' + biggest.amount)
    return
  }

  const min = 100
  if (amount < min) {
    console.log('min amount is', min)
    ctx.reply('with withdrawal ' + min)
    return
  }

  const fee = 0.01
  const newtx = {
    txin: biggest.txid,
    inputAmount: biggest.amount,
    outputAddress: message[2],
    amount: amount,
    fee: fee,
    proceeds: amount - fee,
    changeAddress: biggest.addr,
    changeAmount: biggest.amount - amount
  }

  console.log('newtx', newtx)

  var privkey = privAddressFromKeys(privkey, hash)
  console.log('private key WIF:', privkey)

  if (newtx.changeAmount === 0) {
    var cmd = `${data.txexe}tx.sh ${newtx.txin.split(':')[0]} ${newtx.txin.split(':')[1]} ${newtx.outputAddress} ${newtx.proceeds / 1000} ${privkey}`
    console.log('running', cmd)
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`error: ${error.message}`)
        ctx.reply(`error: ${error.message}`)
        return
      }

      if (stderr) {
        console.error(`stderr: ${stderr}`)
        ctx.reply(`stderr: ${stderr}`)
        return
      }

      console.log(`txid:\n${stdout}`)
      ctx.reply('transaction submitted, please wait c. 2 minutes for one confirmation')
      ctx.reply(`txid:\n${stdout}`)

      ledger[user] -= newtx.amount
      const credit = { source: user, destination: `${stdout.replace('\n', '')}:0`, comment: `withdrawal ${w.txin}`, amount: newtx.amount, timestamp: Math.floor(Date.now() / 1000) }
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
    })
  } else {
    var cmd = `${data.txexe}txc.sh ${newtx.txin.split(':')[0]} ${newtx.txin.split(':')[1]} ${newtx.outputAddress} ${newtx.proceeds / 1000} ${privkey} ${newtx.changeAddress} ${newtx.changeAmount / 1000}`
    console.log('running', cmd)
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`error: ${error.message}`)
        ctx.reply(`error: ${error.message}`)
        return
      }

      if (stderr) {
        console.error(`stderr: ${stderr}`)
        ctx.reply(`stderr: ${stderr}`)
        return
      }

      console.log(`txid:\n${stdout}`)
      ctx.reply('transaction submitted, please wait c. 2 minutes for one confirmation')
      ctx.reply(`txid:\n${stdout}`)

      ledger[user] -= newtx.amount
      const credit = { source: user, destination: `${stdout.replace('\n', '')}:0`, comment: `withdrawal ${newtx.txin}`, amount: newtx.amount, timestamp: Math.floor(Date.now() / 1000) }
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
    })
  }

  ctx.reply(`${JSON.stringify(newtx, null, 2)}`)

  ctx.reply(`withdrawal request from ${biggest.txin} ${amount} of ${biggest.amount} to ${message[2]} queued for processing`)
}

exports.withdraw = withdraw
