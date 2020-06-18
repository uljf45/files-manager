const {ipcRenderer, remote} = require('electron')
const db = require('../datastore')
const util = require('../../scripts/web/util')
const path = require('path')
const fs = require('fs-extra')

// ipcRenderer.on('show', (event, args) => {
//     let notify = new Notification('Name Exists!')
// })

let template = {
    property: `
        <div class="property-wrap">
            <span class="property-name">$0</span>
            <span class="property-content">$1</span>
        </div>
    `,
    separator: `<div class="property-separator"></div>`
}

let proertyListDom = document.querySelector('.property-list')

function makePropertyDom (params) {
    let html 

    switch(util.typeof(params)) {
        case 'Object':
            if (param.type == 'separator') {
                return template.separator
            }
            html = template.property.replace('$1', params.content).replace('$0', params.name)
            return util.createElement(html)
        break
        case 'Array':
            html = params.map(param => {
                if (param.type == 'separator') {
                    return template.separator
                }
                return template.property.replace('$1', param.content).replace('$0', param.name)    
            }).join('')
            return util.createElements(html)

        break
    }
    
    
}

function init() {
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
                let isExist = fs.existsSync(file.path)
                if (isExist) {
                    let stat = fs.statSync(file.path)
                    if (fs.link)
                    console.log(stat)
                    proertyListDom.append(...makePropertyDom([{
                        name: '名称:',
                        content: path.basename(file.path)
                    }, {
                        name: '位置:',
                        content: path.dirname(file.path)
                    }, {
                        name: '大小:',
                        content: `${util.bytesFormat(stat.size, 'GB')} (${util.toThousands(stat.size)} 字节)`
                    }, {
                        type: 'separator'
                    }, {
                        name: '创建时间:',
                        content: stat.birthtime.toLocaleString()
                    }, {
                        name: '修改时间:',
                        content: stat.ctime.toLocaleString()
                    }, {
                        name: '访问时间:',
                        content: stat.atime.toLocaleString()
                    }, {
                        name: 'mode:',
                        content: stat.mode
                    }]))
                } else {
                    proertyListDom.append('Not exists!')
                }
                
            }
        }

    })

    document.querySelector('#property-cancel').addEventListener('click', function (e) {
        remote.getCurrentWindow().close()
    })
}
init()