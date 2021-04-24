function wallet (ctx, wallet) {
  ctx.reply(JSON.stringify(wallet, null, 2))
}

exports.wallet = wallet
