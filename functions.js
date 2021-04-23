
function getNickFromId(key) {
  var usernames = require('./usernames.json')
  var keys = Object.keys(usernames)
  var ret = keys.find(el => usernames[el] === key) 
  return ret || key
}

exports.getNickFromId = getNickFromId