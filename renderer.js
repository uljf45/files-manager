const db = require('./scripts/datastore')
const fs = require('fs')
const path = require('path')
const util = require('./scripts/web/util')

const { ipcRenderer, remote, shell } = require('electron');

const { Menu, MenuItem } = remote

const BrowseWindow = remote.BrowserWindow

const noneClass = 'display-none'

const test = document.getElementById('test')

let curDir = {
    name: '',
    level: -1
}

const historyStack = [
]

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

function showInputbox() {
    dirInputBox.classList.remove(noneClass)
    setTimeout(() => {
        dirInputBox.querySelector('.dir-input').focus()
    }, 1)
}

const dirEditBox = document.getElementById('dir-edit-box')

let curEditDir = null

function showEditBox(dom) {
    dirEditBox.classList.remove(noneClass)
    let editBox = dirEditBox.querySelector('input')
    let id = dom.dataset.id
    let dir = db.read().get('dirs').find({id}).value()
    curEditDir = dir
    editBox.value = dir.name

    setTimeout(() => {
        editBox.focus()
        editBox.select()
    }, 1)
}

ipcRenderer.on('show-input-box', (event, arg) => {
    showInputbox()
})

function hideDirInputBox () {
    dirInputBox.querySelector('.dir-input').value = ''
    dirInputBox.classList.add(noneClass)
}

function hideDirEditBox() {
    curEditDir = null
    trigger.reset()
    dirEditBox.querySelector('input').value = ''
    dirEditBox.querySelector('.warn-tip').innerText = ''
    dirEditBox.classList.add(noneClass)
}

dirInputBox.addEventListener('keydown', (event) => {
    switch(event.keyCode) {
        case 13:
            let v = event.target.value.trim()
            // test.innerText = v
            if (v === '') {
                v = "New Folder " + new Date().getTime()
            }
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

dirEditBox.addEventListener('keydown', (event) => {
    switch(event.keyCode) {
        case 27: 
            trigger.reset()
            hideDirEditBox()
        break
        case 13:
            let v = event.target.value.trim()
            let dir = curEditDir
            if (v == dir.name) {
                hideDirEditBox()
            } else {
                let has = db.get('dirs').find({
                    name: v,
                    level: dir.level
                }).value()
                if (has) {
                    // dirEditBox.querySelector('.warn-tip').innerText = 'name exists'
                    let notify = new Notification('Name Exists!')
                    
                    setTimeout(() => notify.close(), 2000)
                } else {
                    db.get('dirs').find({
                        id: dir.id
                    }).assign({
                        name: v
                    }).write()
                    trigger.dom.querySelector('.folder-name').innerText = v
                    hideDirEditBox()
                }
            }
            
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
    dirs.sort((a,b) => {
        return util.stringCompare(a.name,b.name)
    })
    // console.log(dirs)
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
    let target = findDropTarget(e.target)
    if (files && files.length >= 1) {
        
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
    
         
        // dropTarget = null
        // const content = fs.readFileSync(path)
        // console.log(content.toString())
        e.preventDefault()
    }
    target.classList.remove('dropover')
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
    // console.log(e.target)
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

dragWrapper.addEventListener('dblclick', (e) => {
    if (e.target.classList.contains('file')) {
        let target = e.target
        let id = target.dataset.id
        let file = db.read().get('files').find({id}).value()
        shell.openPath(file.path)
    }
})

// file ContextMenu
const fileMenu = new Menu()
fileMenu.append(new MenuItem({
    label: 'Open',
    click() {
        let dom = trigger.dom
        let id = dom.dataset.id
        let file = db.get('files').find({id}).value()
        let path = file.path
        shell.openPath(path)
    }
}))
fileMenu.append(new MenuItem({
    label: 'Reveal in File Explorer',
    click() {
        let dom = trigger.dom
        let id = dom.dataset.id
        let file = db.get('files').find({id}).value()
        let path = file.path
        shell.showItemInFolder(path)
    }
}))
fileMenu.append(new MenuItem({
    type: 'separator'
}))
fileMenu.append(new MenuItem({
    label: 'Delete',
    click() {
        switch(trigger.type) {
            case 'file':
                let dom = trigger.dom
                let id = dom.dataset.id
                let file = db.get('files').find({id}).value()
                historyStack.push({
                    type: 'file',
                    entity: file,
                    dom: dom
                })
                db.get('files').remove({
                    id
                }).write()
                dom.classList.add(noneClass)
                trigger.reset()
            break
        }
    }
}))
fileMenu.append(new MenuItem({
    type: 'separator'
}))

//folder ContextMenu
const folderMenu = new Menu()
folderMenu.append(new MenuItem({
    label: 'Delete',
    click() {
        let dom = trigger.dom
        let id = dom.dataset.id
        let dir = db.get('dirs').find({id}).value()
        historyStack.push({
            type: 'folder',
            entity: dir,
            dom
        })
        console.log(historyStack)
        db.get('dirs').remove({
            id
        }).write()
        // db.get('files').remove({
        //     dirid: id
        // }).write()
        dom.parentElement.classList.add(noneClass)
        trigger.reset()
        
    }
}))
folderMenu.append(new MenuItem({
    label: 'Rename',
    click () {
        showEditBox(trigger.dom)
        // trigger.reset()
    }
}))

//ContextMenu
const contextMenu = new Menu()
contextMenu.append(new MenuItem({
    label: 'New Folder',
    click () {
        showInputbox()
    },
}))

function undo() {
    let who = historyStack.pop() // type entity dom
    
    switch (who.type) {
        case 'file':
            who.dom.classList.remove(noneClass)
            db.get('files').push(who.entity).write()
        break
        case 'folder':
            who.dom.parentElement.classList.remove(noneClass)
            db.get('dirs').push(who.entity).write()
        break
        case 'select':
            let doms = who.dom
            let dirs = who.entity[0]
            let files = who.entity[1]

            if (dirs.length) {
                db.get('dirs').push(...dirs).write()
            }
            if (files.length) {
                db.get('files').push(...files).write(0)
            }
            doms.forEach(dom => {
                if (dom.classList.contains('file')) {
                    dom.classList.remove(noneClass)
                } else {
                    dom.parentElement.classList.remove(noneClass)
                }
            })
            
        break
    }
}

let undoItem = new MenuItem({
    label: 'Undo',
    click () {
        undo()
    }
})

contextMenu.append(undoItem)

//selectMenu 右键鼠标框选
const selectMenu = new Menu()
selectMenu.append(new MenuItem({
    label: 'Delete Selected',
    click () {
        let doms = trigger.dom
        let ids = Array.prototype.map.call(doms, dom => {
            return {
                dom: dom,
                id: dom.dataset.id,
                type: dom.classList.contains('file') ? 'file' : 'folder'
            }
        })
        let dirIds = ids.filter(id => {
            return id.type == 'folder'
        }).map(v => v.id)

        let fileIds = ids.filter(id => {
            return id.type == 'file'
        }).map(v => v.id)

        let dirs = db.get('dirs').filter(dir => {
            return dirIds.includes(dir.id)
        }).value()

        let files = db.get('files').filter(file => {
            return fileIds.includes(file.id)
        }).value()

        if (dirIds.length) {
            dirIds.forEach(id => {
                db.get('dirs').remove({id}).write()
            })
        }

        if (fileIds.length) {
            fileIds.forEach(id => {
                db.get('files').remove({id}).write()
            })
        }

        ids.forEach(item => {
            let dom = item.dom
            switch(item.type) {
                case 'file':
                    dom.classList.add(noneClass)
                break

                case 'folder':
                    dom.parentElement.classList.add(noneClass)
                break
            }
        })

        historyStack.push({
            type: 'select',
            entity: [dirs, files],
            dom: doms
        })

        console.log(dirs, files)

        
    }
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
    console.log('window contextmenu')
    e.preventDefault()
    if (e.target.classList.contains('select')) {
        trigger.set({
            type: 'select',
            dom: foldersDom.querySelectorAll('.select')
        })
        selectMenu.popup({
            window: remote.getCurrentWindow()
        })
    }
    else if (e.target.classList.contains('file')) {
        foldersDom.querySelectorAll('.file, .folder-self').forEach(dom => {
            dom.classList.remove('select')
        })
        let fileDom = e.target
        let id = fileDom.dataset.id
        trigger.set({
            type: 'file',
            dom: fileDom
        })

        fileMenu.popup({
            window: remote.getCurrentWindow()
        })
    } else if (e.target.classList.contains('folder-self')) {
        foldersDom.querySelectorAll('.file, .folder-self').forEach(dom => {
            dom.classList.remove('select')
        })
        let dirDom = e.target
        let id = dirDom.dataset.id
        trigger.set({
            type: 'folder',
            dom: dirDom
        })

        folderMenu.popup({
            window: remote.getCurrentWindow()
        })
    } else {
        if (historyStack.length === 0) {
            undoItem.visible = false
        } else {
            undoItem.visible = true
        }
        contextMenu.popup({
            window: remote.getCurrentWindow()
        })
        foldersDom.querySelectorAll('.file, .folder-self').forEach(dom => {
            dom.classList.remove('select')
        })
    }
    
})

let mainDom = document.querySelector('.main')
let foldersDom = mainDom.querySelector('.folders')
let selectBox = document.querySelector('#select-box')
let pos = {}
function setPos() {
    selectBox.style.left = Math.min(pos.startX, pos.x) + 'px'
    selectBox.style.top = Math.min(pos.startY, pos.y) + 'px'
    selectBox.style.width = Math.abs(pos.startX - pos.x) + 'px'
    selectBox.style.height = Math.abs(pos.startY - pos.y) + 'px'
    
}
const EventStatus = {
    select: false
}

let mainRect = {

}

window.addEventListener('mousedown', (e) => {
    console.dir(e)
    let target = e.target
    let classList = target.classList
    if (!classList.contains('folder-self') && !classList.contains('file')) {
        pos.startX = e.x
        pos.startY = e.y
        pos.x = e.x
        pos.y = e.y
        setPos()
        selectBox.classList.remove(noneClass)

        mainRect = mainDom.getBoundingClientRect()
        let foldersRect = foldersDom.getBoundingClientRect()

        foldersDom.querySelectorAll('.file, .folder-self').forEach(dom => {
            dom.classList.remove('select')
        })

        function move(e) {
            EventStatus.select = true
            pos.x = e.x
            pos.y = e.y
            setPos()
            let height = 26
            let innerTop = mainRect.top + mainDom.scrollTop
            selectArea()


        }
        window.addEventListener('mousemove', move)
        
        function up(event) {
            selectBox.classList.add(noneClass)
            EventStatus.select = false
            Object.assign(pos, {
                x: 0, y: 0, startX: 0, startY: 0
            })
            setPos()
            window.removeEventListener('mousemove', move)
            window.removeEventListener('mouseup', up)
        }
        window.addEventListener('mouseup', up)

        function over(e) {
            let target = e.target
            let classList = target.classList
            if (classList.contains('folder-self') && classList.contains('file')) {
                target.classList.add('select')
            }
        }
    }

    else if ( classList.contains('select') && e.button == 2 ) {

    } else {
        foldersDom.querySelectorAll('.file, .folder-self').forEach(dom => {
            dom.classList.remove('select')
        })
    }
})

function selectArea() {
    let foldersRect = foldersDom.getBoundingClientRect()
    let selectLeft = Math.min(pos.startX, pos.x)
    let selectTop = Math.min(pos.startY, pos.y)
    let selectRight = Math.max(pos.startX, pos.x)
    let selectBottom = Math.max(pos.startY, pos.y)

    if ((selectTop > mainRect.bottom) ||
        selectLeft > foldersRect.right ||
        selectBottom < mainRect.top ||
        selectRight < mainRect.left 
    ) {
        foldersDom.querySelectorAll('.file, .folder-self').forEach(dom => {
            dom.classList.remove('select')
        })
    } else {
        let isFirst = true
        let prevFirst = foldersDom.querySelector('.bdr-t')
        if (prevFirst) prevFirst.classList.remove('bdr-t')

        foldersDom.querySelectorAll(`.file:not(.${noneClass}), .folder-self:not(.${noneClass})`).forEach(dom => {
            let rect = dom.getBoundingClientRect()
            if (rect.top < selectBottom && rect.bottom > selectTop) {
                if (!dom.classList.contains('select')) {
                    dom.classList.add('select')
                }
                if (isFirst) {
                    dom.classList.add('bdr-t')
                    isFirst = false
                }
            } else {
                dom.classList.remove('select')
            }
        })
    }
}

mainDom.addEventListener('scroll', (event) => {
    if(EventStatus.select) {
       selectArea()
    }
})