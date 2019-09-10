
const { ipcRenderer, dialog } = require('electron')
const log = require('electron-log');

const source = document.getElementById('source')
const destination = document.getElementById('destination')

const passwordDiv = document.getElementById('passwordDiv')
const password = document.getElementById('password')
const volumeName = document.getElementById('volumeName')
const status = document.getElementById('statusLbl')
const cloudEncForm = document.getElementById('cloudEncForm')

var mounted = false;
const mountBtn = document.getElementById('mountBtn')

function updateBtn() {
    console.log("updating mount/unmont button")
    var mounted = ipcRenderer.sendSync("is_mounted", { destination: destination.value })
    if (mounted)
        mountBtn.innerText = "UnMount"
    else
        mountBtn.innerText = "Mount"
}



// ======  reading directories with native dialog, to avoid security issues with browsers
source.onclick = () => {
    ipcRenderer.send('put-in-tray')

    // var dir = ipcRenderer.sendSync("get_direcotry_natively", {})
    // if (dir) {
    //     source.value = dir
    //     var reuse = ipcRenderer.sendSync("account_exists_reuse", { source: dir, destination: dir })
    //     if (reuse) {
    //         passwordDiv.disabled = true
    //         password.value = ""
    //     }
    //     else {
    //         passwordDiv.disabled = false
    //     }
    // }
}

// ======  reading directories with native dialog, to avoid security issues with browsers
destination.onclick = () => {
    var dir = ipcRenderer.sendSync("get_direcotry_natively", {})
    if (dir) {
        destination.value = dir
        updateBtn()
    }
}


cloudEncForm.onsubmit = ()=>{
    var args = {
        source: source.value,
        destination: destination.value,
        volumeName: volumeName.value,
    }
    var result = ipcRenderer.sendSync("mount_unmount", args)
    updateBtn();
    notify(result+" with success")

    // avoid the form to reload
    return false
}


// var volumeName = document.getElementById("volumeName").value
// var password = document.getElementById("password").value
// var destination = document.getElementById("encfsFolder").value
// var status = document.getElementById("statusLbl")

// console.log(document.getElementById("clearFolder").value)
// notify(source)

// var replay = ipcRenderer.sendSync("account_exists", { source: source, destination: destination })
// console.log(replay)
// status.innerHTML = replay

// notify(replay)


// var replay = ipcRenderer.sendSync("set_keychain_password", {password:"test123", "volumeName":"volTest"})
// console.log(replay)
// if (source === '' || !source) {
//     status.innerHTML = "Unecrypted folder required"
//     return;
// }
// if (destination === '' || !destination) {
//     status.innerHTML = "Ecrypted folder required"
//     return;
// }

// console.log




function notify(title = "CloudEnc", message) {
    const notification = {
        title: title,
        body: message,
        silent: true,
        icon: './resources/cloud-enc2.ico'
    }
    const myNotification = new window.Notification(notification.title, notification)

    myNotification.onclick = () => {
        console.log('Notification clicked')
    }
}
