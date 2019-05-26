// const { getSessionState } = require('electron-notification-state')
// console.log(getSessionState());

const mountBtn = document.getElementById('mountBtn')



mountBtn.onclick = () => {
    notify("worked")
    
   var destination =  document.getElementById("encfsFolder").value
   var source =  document.getElementById("clearFolder").value

    // if (source === '' || !source )
    //     {
            
    //     }
    
    var status = document.getElementById("statusLbl")
    console.log(status)
    status.innerHTML="test"
}

function notify(title="CloudEnc", message){
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