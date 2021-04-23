const getNickFromId = require('../functions.js').getNickFromId


function getMarks(credits) {
  return credits.filter(e => e.comment && !e.comment.match(/^withdraw/) && !e.comment.match(/^deposit/)  )
}

function givers(ctx, credits) {
  var marks = getMarks(credits)
  var top = {}
  marks.forEach(el => {
    var source = getNickFromId(el.source)
    top[source] = top[source] || 0
    top[source] += el.amount
  })
  
  var reply = '';
  for (var property in top) {
    reply += top[property] + ' ' + property + '\n'
  }
  
  ctx.reply(`Top Givers
  ____________
${reply}`)
}

exports.givers = givers





