const db = require('./scripts/datastore')
const fs = require('fs')
const path = require('path')
const util = require('./scripts/web/util')

const { ipcRenderer, remote } = require('electron');

const { Menu, MenuItem } = remote

const BrowseWindow = remote.BrowserWindow

const noneClass = 'display-none'

const test = document.getElementById('test')

let curDir = {
    name: '',
    level: -1
}

let dirs = db.get('dirs').filter({parent: ''}).value()
// let win = new BrowseWindow({
//     width: 100, height: 100
// })

// win.loadURL('https://www.360.cn/')

// console.log(ipcRenderer.sendSync('synchronous-message', 'sync-ping')); // prints "pong"

ipcRenderer.on('asynchronous-reply', function(event, arg) {
//   console.log(arg); // prints "pong"
});

ipcRenderer.send('asynchronous-message', 'async-ping');

const dirInputBox = document.getElementById('dir-input-box')

ipcRenderer.on('show-input-box', (event, arg) => {
    dirInputBox.classList.remove(noneClass)
    setTimeout(() => {
        dirInputBox.querySelector('.dir-input').focus()
    }, 1)
    
})

function hideDirInputBox () {
    dirInputBox.querySelector('.dir-input').value = ''
    dirInputBox.classList.add(noneClass)
}

dirInputBox.addEventListener('keydown', (event) => {
    switch(event.keyCode) {
        case 13:
            let v = event.target.value.trim()
            // test.innerText = v
            let find = db.get('dirs').find({name: v}).value()
    
            console.log('find ' + find)
            if (find == undefined) {
                db.get('dirs').insert({name: v, parent:curDir.name, level: curDir.level + 1}).write()
                let dir = db.read().get('dirs').find({name: v}).value()
                dirs.push(dir)
                let div = document.createElement('div')
                div.innerHTML = folderHtml(dir)
                document.getElementById('folders').appendChild(div.children[0])
            }
            
            hideDirInputBox()
            break
        case 27:
            hideDirInputBox()
            break
    }
})

const template = {
    'folder': 
`<div class="folder">
    <div class="folder-self" data-id="" style="text-indent:">
        <i class="fa fa-folder v-align-mid" aria-hidden="true"></i>
        <span class="folder-name v-align-mid">
            $0
        </span>
    </div>
    <ul class="files" style="text-indent:">
        <!--<li class="file">
            <i class="fa fa-file v-align-mid" aria-hidden="true"></i>
            <span class="file-name v-align-mid">tt</span>
        </li> -->
    </ul>
</div>`,
    'file': 
`<li class="file" data-id="">
    <i class="fa fa-file v-align-mid" aria-hidden="true"></i>
    <span class="file-name v-align-mid">$0</span>
</li>
`
}

function folderHtml(dir) {
    return template.folder
        .replace('$0', dir.name)
        .replace('data-id=""', `data-id="${dir.id}"`)
        .replace('style="text-indent:"', `style="text-indent:${dir.level * 20}px;"`)
}

function fileHtml(file, dir) {
    return template.file
        .replace('$0', file.name)
        .replace('data-id=""', `data-id="${file.id}"`)
        .replace('style="text-indent:"', `style="text-indent:${dir.level * 20 + 20}px;"`)
}

function init() {
    dirs = db.get('dirs').filter({parent: ''}).value()
    if (dirs && dirs.length) {
        let html = dirs.map(dir => {
            return folderHtml(dir)
        }).join('')
        document.getElementById('folders').innerHTML = html
    }
}

init()

document.getElementById('drag-file-link').addEventListener('dragstart', (event) => {
    event.preventDefault()
    ipcRenderer.send('ondragstart', __filename)
})

function findDropTarget(target) {
    let parent = target
    if (!parent.classList.contains('folder-self') && !parent.classList.contains('file')) {
        parent = util.parent(target, '.folder-self')
        if (!parent) {
            parent = util.parent(target, '.file')
        }
    }
    return parent
}

function findDropDir(target) {
    let folder = util.parent(target, '.folder')

    return folder.querySelector('.folder-self')
}

const dragWrapper = document.getElementById('folders')

dragWrapper.addEventListener('drop', (e) => {
    console.log(e)
    
    const files = e.dataTransfer.files
    
    if (files && files.length >= 1) {
        let target = findDropTarget(e.target)
        let folder = findDropDir(target)

        const filePath = files[0].path
        
        let dirid = folder.dataset.id
        
        console.log(dirid)
        console.log("file:", filePath)
        
        let find = db.get('files').find({
            dirid,
            path:filePath
        }).value()
        
        if (find == undefined) {
            db.get('files').insert({
                dirid,
                path: filePath,
                name: path.basename(filePath)
            }).write()
            if (folder.classList.contains('expand')) { //文件夹是打开的
                let file = db.get('files').find({
                    dirid,
                    path: filePath,
                    name: path.basename(filePath)
                }).value()

                let dir = db.get('dirs').find({
                    id: dirid
                }).value()

                let div = document.createElement('div')
                div.innerHTML = fileHtml(file, dir)

                folder.parentElement.querySelector('.files').append(div.children[0])
            }
        }
    
         target.classList.remove('dropover')
        // dropTarget = null
        // const content = fs.readFileSync(path)
        // console.log(content.toString())
        e.preventDefault()

    }
})

// let dropTarget = null
dragWrapper.addEventListener("dragenter", (e) => {
    if (e.target && (e.target.classList.contains('file') || e.target.classList.contains('folder-self'))) {

        // let target = findDropTarget(e.target)
        
        // if (target) {
            // dropTarget && dropTarget.classList.remove('dropover')
            // dropTarget = target
            
            if (!e.target.classList.contains('dropover')) {
                e.target.classList.add('dropover')
            }
        // }
    }
    // console.log(e.target)
    e.preventDefault()
})

dragWrapper.addEventListener('dragover', (e) => {
    e.preventDefault()
})

dragWrapper.addEventListener('dragleave', (e) => {
    console.log(e.target)
    if (e.target && (e.target.classList.contains('file') || e.target.classList.contains('folder-self'))) {
        // let target = findDropTarget(e.target)
        // if (target) {
            e.target.classList.remove('dropover')
        // }
    }
    e.preventDefault()
})

dragWrapper.addEventListener('click', (e) => {
    if (e.target.classList.contains('folder-self')) {
        let target = e.target
        let id = target.dataset.id
        let folder = target.parentElement

        if (target.classList.contains('expand')) {
            target.classList.remove('expand')
            folder.querySelector('.fa-folder').classList.remove('fa-folder-open')
            target.parentElement.querySelector('.files').innerHTML = ''
        } else {
            let files = db.read().get('files').filter((v) => {
                return v.dirid == id
            }).value()
            
            if (files && files.length) {
                let dir = db.read().get('dirs').find({id: id}).value()
                
                let html = files.map(file => {
                    return fileHtml(file, dir)
                }).join('')

                target.parentElement.querySelector('.files').innerHTML = html
            }

            target.classList.add('expand')
            folder.querySelector('.fa-folder').classList.add('fa-folder-open')
        }
    }
})

const menu = new Menu()
menu.append(new MenuItem({
    label: 'Delete',
    click() {
        switch(trigger.type) {
            case 'file':
                switch(trigger.opr) {
                    case 'delete':
                        let dom = trigger.dom
                        let id = dom.dataset.id
                        db.get('files').remove({
                            id
                        }).write()
                        dom.remove()
                    break
                }
            break
        }
    }
}))
menu.append(new MenuItem({
    type: 'separator'
}))

const trigger = {
    type: null, // file folder
    opr: null, //delete
    dom: null, //element
    reset() {
        this.type = null
        this.opr = null
        this.dom = null
    },
    set(opts) {
        let {type, opr, dom} = opts
        this.type = type
        this.opr = opr
        this.dom = dom
    }
}

window.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    if (e.target.classList.contains('file')) {
        let fileDom = e.target
        let id = fileDom.dataset.id
        trigger.set({
            type: 'file',
            opr: 'delete',
            dom: fileDom
        })

        menu.popup({
            window: remote.getCurrentWindow()
        })
    }
    
}) 