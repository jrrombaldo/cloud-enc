#!/bin/bash
clear

#===== variables
target=~/secured
ciphered_container="/Volumes/data/Dropbox/secured/"
keychain_account_name="EncFS-Cloud"
volume="secured"
umount_after=20
#===============


#===== resolving mount point
mountpoint=$(ls -d $target)

#===== extraction password from keychain based on account name
extpass_call="security 2>&1 >/dev/null find-generic-password -gl '$keychain_account_name' |grep password|cut -d \\\" -f 2"

#===== is alredy mounted ???
mount | grep -q $mountpoint
is_mounted=$?

#===== if not mounted already then mount. Otherwise umount.
if [ $is_mounted = "0" ]; then
	umount $mountpoint
	echo -e "$0 > \tumounted (result = $?)"
	logger -p local0.info "$0 umounted (result = $?)"

else
	encfs --idle=$umount_after  $ciphered_container $mountpoint --extpass="$extpass_call" --idle=$umount_after -ovolname=$volume -oallow_root -olocal -ohard_remove -oauto_xattr -onolocalcaches
	echo -e "$0 > \tmounted (result = $?)"
	logger -p local0.info "$0 mounted (result = $?)"
fi;

