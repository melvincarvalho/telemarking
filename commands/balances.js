function balances (ctx, ledger) {
  const reply = JSON.stringify(ledger, null, 2)
  ctx.reply(reply)
}

exports.balances = balances
