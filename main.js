const { app, BrowserWindow } = require('electron')

const { Menu } = require('electron')
const fs = require("fs");
const path = require('path')

// to capture renderers stdout
process.env.ELECTRON_ENABLE_LOGGING = 1

let mainWindow
let appIcon = null
const icoPath = './resources/elec.icns'
const icoPathPNG = './resources/cloud-enc.png'

function createWindow() {

    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        // frame: false,
        fullscreenable: false,
        resizable: false,
        icon: path.join(__dirname, icoPath),
        webPreferences: {
            nodeIntegration: true
        }
    })

    mainWindow.loadFile('index.html')

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    mainWindow.on('closed', function () {
        mainWindow = null
    })
}

function createTray() {
    const { Tray } = require('electron')
    appIcon = new Tray(path.join(__dirname, icoPathPNG))

    const trayMenu = Menu.buildFromTemplate([{
        label: "testing...",
        click: () => { console.log("tray menu clicked") }
    }])
    // appIcon.setTitle("Testing...")
    appIcon.setContextMenu(trayMenu)
}

app.on('ready', () => {
    loadScripts();
    createTray();
    createWindow();
});

//  ensure the app is closed when the main window is closed
app.on('window-all-closed', function () {
    // if (process.platform !== 'darwin') app.quit()
    if (appIcon) appIcon.destroy()
    app.quit()
})

app.on('activate', function () {
    if (mainWindow === null) createWindow()
})

process.on('uncaughtException', function (error) {
    console.log("UNCATCH EXCEPTION FOUND ")
    console.log(error)
})



function loadScripts() {
    const scripts = fs.readdirSync("./main-scripts")
    scripts.forEach(script => {
        script.endsWith(".js") && require("./main-scripts/" + script)
         // if (script.endsWith(".js")) {
        //     require("./main-scripts/" + script) && console.info(script, "imported")
        // }
    });
}

