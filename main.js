const electron = require('electron')

const { Menu, MenuItem, app, BrowserWindow, ipcMain } = electron

const createMenu = require('./scripts/main/createMenu')

let win

function createWindow() {
   win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true, //nodejs生效
      enableRemoteModule: true,
    }
  })
  const menu = createMenu(win) //自定义菜单
  Menu.setApplicationMenu(menu)
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
