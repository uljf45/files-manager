const Datastore = require('lowdb')
const LodashId = require('lodash-id')
const FileSync = require('lowdb/adapters/FileSync')
const path = require('path')
const fs = require('fs-extra')
const { remote, app } = require('electron')

const APP = process.type === 'renderer' ? remote.app : app
const STORE_PATH = APP.getPath('userData')

if (process.type !== 'renderer') {
  if (!fs.pathExistsSync(STORE_PATH)) {
    fs.mkdirpSync(STORE_PATH)
  }
}

// const adapter = new FileSync(path.join(STORE_PATH, '/data.json'))  //发布时取消注释
const adapter = new FileSync(path.join(STORE_PATH, '/datatest.json'))
console.log(STORE_PATH)
const db = Datastore(adapter)
db._.mixin(LodashId)

if (!db.has('posts').value()) {
    const collection = db.defaults({posts: []}).get('posts')
    const newPost = collection.insert({title: 'low!'}).write()
}

if (!db.has('uploaded').value()) {
  db.set('uploaded', []).write()
}

if (!db.has('picBed').value()) {
  db.set('picBed', {
    current: 'weibo'
  }).write()
}

if (!db.has('shortKey').value()) {
  db.set('shortKey', {
    upload: 'CommandOrControl+Shift+P'
  }).write()
}

if (!db.has('dirs').value()) {
    db.set('dirs', []).write()
}
if (!db.has('files').value()) {
    db.set('files', []).write()
}

module.exports = db