const constants = require("../constants")
const format = require("string-format")
const fs = require("fs");
const path = require('path')
var shell = require("shelljs")
var os = require('os');
const colors = require('colors');
const log = require('electron-log');

// https://github.com/shelljs/shelljs/wiki/Electron-compatibility
shell.config.execPath = shell.which("node").stdout;

log.info("logged")
// class CloudEnc {
//     constructor(source, destination, volumeName = "") {
//         this.checkOS()

//         this.source = this.checkDir(source)
//         this.destination = this.checkDir(destination)
//         if ("" == volumeName)
//             this.volumeName = path.basename(source).concat(constants.VOLUME_NAME_SUFIX)
//         else
//             this.volumeName = volumeName
//     }

function checkDir(dir) {
    var fullpath = path.resolve(dir)
    log.debug("absolute path", fullpath)

    if (!fs.existsSync(fullpath)) {
        log.debug("creating directoory", fullpath)
        fs.mkdirSync(fullpath)
    }

    if (fs.statSync(fullpath).isDirectory()) {
        return fullpath
    }
    else {
        // log.error("it is not a directory")
        throw new Error("it is not a directory " + fullpath)
    }
}

function checkOS() {
    // https://nodejs.org/dist/latest-v5.x/docs/api/os.html#os_os_platform
    log.debug(format("running on {0}, {1}", os.type(), os.release()).green)

    if (constants.SUPPORTED_PLATFORM.indexOf(os.platform()) < 0) {
        log.error(format("unsuported platform {0}", os.platform()))
        throw new Error("unsuported platform " + os.platform())
    }
    log.info(format("platform supported {0}", os.platform()).green)

    // cheking ENCFS
    var result = shell.which(constants.ENCFS)
    if (result.code === 0)
        log.info("found encfs at", result.stdout)
    else {
        log.debug(result)
        throw new Error("EncFS not found, please install")
    }
}


function getMountOrCreateCmd(source, destination, volumeName) {
    // TODO create an standalone script to ask for password. it will be called by encfs anytime the idle timeout is reached
    // var extpass_call = format("security 2>&1 >/dev/null find-generic-password -gl \"{0}\" | grep password | cut -d \\\" -f 2", getAccountName(source))
    getKeyChainSearch
    // var raw = "{encfs}  {container} {mount_point} --extpass='{passwd_prg}' --idle={idle} --ondemand --delaymount --standard --require-macs -ovolname={name} -oallow_root -olocal -ohard_remove -oauto_xattr -onolocalcaches"
    var raw = "{encfs}  {container} {mount_point} --extpass='{passwd_prg}'  --standard --require-macs -ovolname={name} -oallow_root -olocal -ohard_remove -oauto_xattr -onolocalcaches"

    return format(raw, {
        encfs: "encfs",
        idle: 25,
        container: source,
        mount_point: destination,
        passwd_prg: getKeyChainSearch(source),
        name: volumeName
    })
}

function getUnmountCmd(destination) {
    switch (os.platform()) {
        case "darwin":
            // return format("fusermount -u {0}", destination)
            return format("umount {0}", destination)
            break;
        case "freebsd":
            return format("umount {0}", destination)
            break;
        case "linux":
            return format("umount {0}", destination)
            break;
        default:
            return format("umount {0}", destination)
    }
}

function execute(cmd) {
    // log.debug(cmd)
    var result = shell.exec(cmd)
    // log.log(result)
    if (result.code != 0) {
        log.log ("cmd="+cmd)
        log.error(result)
        throw new Error(result.stderr)
    }
    return result.stdout
}

function mount(source, destination, volumeName) {
    destination = checkDir(destination)
    source = checkDir(source)

    if (!volumeName)
        volumeName = path.basename(source).concat(constants.VOLUME_NAME_SUFIX)

    if (isMounted(destination)) {
        log.info(format("{0} already mounted", destination).red)
    } else {
        log.debug(format("mountind {0} -> {1} as {2}", source, destination, volumeName).grey)
        console.time()
        execute(getMountOrCreateCmd(source, destination, volumeName))
        console.timeEnd()
    }
}

function unmont(destination) {
    destination = checkDir(destination)

    if (isMounted(destination)) {
        log.debug(format("unmounting {0} ({1})", destination).grey)
        console.time()
        execute(getUnmountCmd(destination))
        console.timeEnd()
    } else {
        log.info(format("{0} not mounted", destination).red)
    }
}

function isMounted(destination) {
    destination = checkDir(destination)

    var cmd = format("mount | grep -qs '{}' ", (destination))
    var result = shell.exec(cmd)

    if (result.stderr != '' || result.stdout != '') {
        var msg = format("Failed to check is [{dst}] mounted\n\n return = {code}\n\n stderr=[{stderr}] \n\n stdout=[{stdout}]",
            { stderr: result.stderr, stdout: result.stdout, code: result.code, dst: destination })
        log.error(cmd, result)
        throw new Error(msg);
    }

    if (result.code == 0)
        return true
    if (result.code == 1)
        return false
}

function getAccountName(source) {
    return format("{0}:{1}", constants.KEYCHAIN_ACCOUNT, source)
}
function getKeyChainSearch(source){
    var command = format('security find-generic-password  -a "{account}" -s "{service}" -w ',
        {
            account: getAccountName(source),
            service: constants.KEYCHAIN_ACCOUNT,
        })
    return command
}

// password format is cloud-enc:<sourceFolder>
function reateKeyChainPassword(source, password) {
    var command = format(
        "security add-generic-password -a '{account}' -s '{service}' -D 'application password' -j \"{comment}\" -w'{password}' -U",
        {
            account: getAccountName(source),
            service: constants.KEYCHAIN_ACCOUNT,
            password: password,
            comment: "Created by cloud-enc @ $( date +'%Y.%m.%d-%H:%M')",
        })
    return execute(command)
}

//  TODO, shelljs module always print the stdout, which means the password endup bing printed on stdout :(
function getKeyChainPassword(source) {
    // var command = format("security find-generic-password  -a '{account}' -s '{service}' -w ",
    //     {
    //         account: getAccountName(source),
    //         service: constants.KEYCHAIN_ACCOUNT,
    //     })
    var command = getKeyChainSearch(source)
    var result = shell.exec(command)
    if (result.code === 0)
        return result.stdout
    if (result.code === 44) // not found
        return null
    if (result.code === 0) {
        log.error(result)
        throw new Error(result.stderr)
    }
}



const { ipcMain } = require('electron')

log.debug("registering account_exists")


ipcMain.on("account_exists_reuse", (event, arg) => {
    var source = arg['source'];
    if (!source || source === '') {
        log.error(format("source folder [{0}]", source).red)
    }

    var destination = arg['destination'];
    if (!destination || destination === '') {
        log.error(format("destination folder [{0}]", destination).red)
        event.return = false
    }
    var password = getKeyChainPassword(source)

    // if (password) { event.returnValue = true }
    // else { event.returnValue = false }

    if (password) {
        const options = {
            type: 'info',
            title: 'password confirmation',
            message: 'There is a pasword recorded on keychain for this folder, would you like reuse or replace? note that the previous password will be lost',
            buttons: ['Reuse existing password', 'Replace with a new password']
        }
        dialog.showMessageBox(options, (index) => {
            if (index === 0)
                event.returnValue = true
            if (index === 1)
                event.returnValue = false

        })
    }
    else event.returnValue = false

})


const { dialog } = require('electron')

ipcMain.on("get_direcotry_natively", (event, arg) => {
    var directory = dialog.showOpenDialog({ properties: ['openDirectory'] })
    if (directory)
        event.returnValue = directory[0]
    else
        event.returnValue = null
})


ipcMain.on("is_mounted", (event, arg) => {
    var destination = arg['destination'];
    var mounted = isMounted(destination)
    if (mounted)
        event.returnValue = true
    else
        event.returnValue = false
})

ipcMain.on("mount_unmount", (event, arg) => {
    var source = arg['source'];
    var destination = arg['destination'];
    var volumeName = arg['volumeName'];

    if (!isMounted(destination)){
        log.log(format("{0} is not mounted, mounting", destination))
        mount(source,destination,volumeName)
        event.returnValue = "Mounted"
        log.log(format("{0} -> {1} mounted with success", source, destination))
    } else {
        log.log(format("{0} is  mounted, unmounting", destination))
        unmont(destination)
        event.returnValue = "Unmounted"
        log.log(format("{0} unounted with success", destination))
    }
})







