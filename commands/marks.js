const getNickFromId = require('../functions.js').getNickFromId


function getMarks(credits) {
  return credits.filter(e => e.comment && !e.comment.match(/^withdraw/) && !e.comment.match(/^deposit/)  )
}

function marks(ctx, wallet, credits) {

  // get marks
  var marks = getMarks(credits)

  // format
  var reply = marks.map(el => `${el.amount} ${getNickFromId(el.destination)} ${el.comment}`)
  console.log(reply)

  // reply
  ctx.reply(reply.slice(-20).join('\n'))

}

exports.marks = marks