
const { ipcRenderer } = require('electron')




console.log(ipcRenderer)

// ======  reading directories with native dialog, to avoid security issues with browsers
const source = document.getElementById('source')
const destination = document.getElementById('destination')

const password = document.getElementById('password')
const volumeName = document.getElementById('volumeName')
const status = document.getElementById('statusLbl')



source.onclick = ()=>{ 
    var dir = ipcRenderer.sendSync("get_direcotry_natively", {})
    if(dir){
        source.value = dir
        console.log("before")
        var exists = ipcRenderer.sendSync("account_exists", { source: dir, destination: dir })
        if (exists){
            status.innerText = "credential already exists would like to update?"
        }  
    }
}


destination.onclick = ()=>{ 
    var dir = ipcRenderer.sendSync("get_direcotry_natively", {})
    if(dir) destination.value = dir
}




const mountBtn = document.getElementById('mountBtn')
mountBtn.onclick = () => {
    
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


}

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