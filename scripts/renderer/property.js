const {ipcRenderer, remote} = require('electron')
const db = require('../datastore')

// ipcRenderer.on('show', (event, args) => {
//     let notify = new Notification('Name Exists!')
// })
function test() {
    remote.getCurrentWindow().getParentWindow().webContents.send('propertyId', {
        id: remote.getCurrentWindow().id
    })
    ipcRenderer.once('propertyId', function (event, args) {
        console.log(args)
        if (args.type === 'file') {
            let id = args.id
            let file = db.read().get('files').find({id}).value()
            if (file) {
                document.title = file.name + ' Property'
            }
        }

    })
}
test()