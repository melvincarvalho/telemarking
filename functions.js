const {createHash} = require('crypto')
const fs = require('fs')
const homedir = require('os').homedir()


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
