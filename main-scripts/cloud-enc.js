const constants = require("../constants")
const format = require("string-format")
const fs = require("fs");
const path = require('path')
var shell = require("shelljs")
var os = require('os');
const colors = require('colors');


console.log("cloud-enc imported")


module.exports = class CloudEnc {
    constructor(source, destination, volumeName = "") {
        this.checkOS()

        this.source = this.checkDir(source)
        this.destination = this.checkDir(destination)
        if ("" == volumeName)
            this.volumeName = path.basename(source).concat(constants.VOLUME_NAME_SUFIX)
        else
            this.volumeName = volumeName
    }

    checkDir(dir) {
        var fullpath = path.resolve(dir)
        console.debug("absolute path", fullpath)

        if (!fs.existsSync(fullpath)) {
            console.debug("creating directoory", fullpath)
            fs.mkdirSync(fullpath)
        }

        if (fs.statSync(fullpath).isDirectory()) {
            return fullpath
        }
        else {
            // console.error("it is not a directory")
            throw new Error("it is not a directory " + fullpath)
        }

    }

    checkOS() {
        // https://nodejs.org/dist/latest-v5.x/docs/api/os.html#os_os_platform
        console.debug(format("running on {0}, {1}", os.type(), os.release()).green)

        if (constants.SUPPORTED_PLATFORM.indexOf(os.platform()) < 0) {
            console.error(format("unsuported platform {0}", os.platform()))
            throw new Error("unsuported platform " + os.platform())
        }
        console.info(format("platform supported {0}", os.platform()).green)

        // cheking ENCFS
        var result = shell.which(constants.ENCFS)
        if (result.code === 0)
            console.info("found encfs at", result.stdout)
        else {
            console.debug(result)
            throw new Error("EncFS not found, please install")
        }




    }


    getMountOrCreateCmd() {
        // TODO create an standalone script to ask for password. it will be called by encfs anytime the idle timeout is reached
        var extpass_call = "security 2>&1 >/dev/null find-generic-password -gl \"EncFS-Cloud\" | grep password | cut -d \\\" -f 2"
        var raw = "{encfs}  {container} {mount_point} --extpass='{passwd_prg}' --idle={idle} --ondemand --delaymount --standard --require-macs -ovolname={name} -oallow_root -olocal -ohard_remove -oauto_xattr -onolocalcaches"
        return format(raw, {
            encfs: "encfs",
            idle: 25,
            container: this.source,
            mount_point: this.destination,
            passwd_prg: extpass_call,
            name: this.volumeName
        })
    }

    getUnmountCmd() {

        switch (os.platform()) {
            case "darwin":
                // return format("fusermount -u {0}", destination)
                return format("umount {0}", this.destination)
                break;
            case "freebsd":
                return format("umount {0}", this.destination)
                break;
            case "linux":
                return format("umount {0}", this.destination)
                break;
            default:
                return format("umount {0}", this.destination)
        }
    }

    execute(cmd) {
        // console.debug(cmd)
        var result = shell.exec(cmd)
        // console.debug(result.code, result.stdout)
        if (result.code != 0) {
            console.error(result)
            throw new Error(result.stderr)
        }
    }

    mount() {
       
        if (this.isMounted()) {
            console.info(format("{0} already mounted",this.destination).red)
        } else {
            console.debug(format("mountind {0} -> {1} as {2}", this.source, this.destination, this.volumeName).grey)
            console.time()
            this.execute(this.getMountOrCreateCmd())
            console.timeEnd()
        }
    }

    unmont() {
        if (this.isMounted()) {
            console.debug(format("unmounting {0} ({1})", this.destination, this.volumeName).grey)
            console.time()
            this.execute(this.getUnmountCmd())
            console.timeEnd()
        } else {
            console.info(format("{0} not mounted",this.destination).red)
        }
    }

    isMounted() {

        var cmd = format("mount | grep -qs '{}' ", (this.destination))
        // console.log(cmd)
        var result = shell.exec(cmd)
  

        if (result.stderr != '' || result.stdout != '') {
            var msg = format("Failed to check is [{dst}] mounted\n\n return = {code}\n\n stderr=[{stderr}] \n\n stdout=[{stdout}]",
                { stderr: result.stderr, stdout: result.stdout, code: result.code, dst: this.destination })
            console.error(cmd, result)
            throw new Error(msg);
        }


        if (result.code == 0)
            return true
        if (result.code == 1)
            return false
    }
}









