const electron = require('electron')

const { Menu, MenuItem, app, BrowserWindow, ipcMain, Tray } = electron
const path = require('path')
const createMenu = require('./scripts/main/createMenu')

let win
let tray = null

function createWindow() {
   win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true, //nodejs生效
      enableRemoteModule: true,
      // devTools: false   //发布时取消注释
    }
  })
  const menu = createMenu(win) //自定义菜单
  Menu.setApplicationMenu(menu)
  win.on('closed', (event) => {
    win = null
  })
  win.on('close', (event) => {
    win.hide();
    win.setSkipTaskbar(true)
    event.preventDefault()
  })
  win.on('show', () => {
    // tray.setHighlightMode('always')
  })
  win.on('hide', () => {
    // tray.setHighlightMode('never')
  })
  tray = new Tray(path.join(__dirname, 'images/octopus.png'));
  let trayMenu = Menu.buildFromTemplate([
    {
      label: '退出',
      click () {
        win.destroy()
      }
    }
  ])
  tray.setToolTip('八爪鱼')
  tray.setContextMenu(trayMenu)
  tray.on('click', () => {
    win.isVisible() ? win.hide() : win.show()
    win.isVisible() ? win.setSkipTaskbar(false) : win.setSkipTaskbar(true)
  })
  win.loadFile('index.html')
  // win.webContents.openDevTools() //npm start 自动打开devtool
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {

    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

ipcMain.on('asynchronous-message', function(event, arg) {
  console.log(arg);  // prints "ping"
  event.sender.send('asynchronous-reply', 'pong');
});

ipcMain.on('synchronous-message', function(event, arg) {
  console.log(arg);  // prints "ping"
  console.log('app getpaht ' + app.getPath('userData'))
  event.returnValue = 'pong';
});

ipcMain.on('ondragstart', (event, filePath) => {
  event.sender.startDrag({
    file: filePath,
    icon: './images/codeIcon.png'
  })
})

ipcMain.on('property', function(event, args) {
  console.log(args)
})