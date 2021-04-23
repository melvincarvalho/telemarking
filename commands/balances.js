function balances(ctx, ledger) {
  var reply = JSON.stringify(ledger, null, 2)
  ctx.reply(reply)
}

exports.balances = balances