const path = require('path')
const {ipcMain, app, Menu, Tray} = require('electron')

let appIcon = null

ipcMain.on('put-in-tray', (event) => {
  log.info("start")
  let iconPath = path.join(__dirname, '../resources/example.png')
  appIcon = new Tray(iconPath)


  log.info(appIcon)
  const contextMenu = Menu.buildFromTemplate([{
    label: 'Remove',
    click: () => {
      appIcon.destroy()
    }
  }])

  appIcon.setToolTip('Electron Demo in the tray.')
  appIcon.setContextMenu(contextMenu)

  appIcon.setHighlightMode('always');

  log.info(appIcon)
  log.info("done")
})
