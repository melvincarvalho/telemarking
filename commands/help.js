function help(ctx) {
  ctx.reply(`Markbot help:

balance [user] - get balance
balances - all balances
deposit - get your deposit adddress
givers - list top givers
mark @user amount [comment] - mark user
marks - get last 20 marks
sweep - sweep a desposit into the ledger
withdraw <amount> <address> - withdraws amount`)
}

exports.help = help