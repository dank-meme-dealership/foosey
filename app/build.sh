# for ios builds you'll need Xcode installed and be connected to Matt's dev account
# 
# for android builds you'll need to install `brew install android-sdk` and install
# 'SDK Platform' for android-23, 'Android SDK Platform-tools' (latest), and 'Android 
# SDK Build-tools' (latest).
# you will also need the foosey.keystore which Matt has saved in a safe location
# the passphrase for the keystore is the K pass we know and love

# update from repo
git pull

# clear out platforms and rebuild
rm -rf platforms/
ionic platform add ios
ionic platform add android

# build icons and splash screens
ionic resources

# build and sign android apk
ionic build --release android
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore foosey.keystore platforms/android/build/outputs/apk/android-release-unsigned.apk foosey
build-tools/zipalign -v 4 platforms/android/build/outputs/apk/android-release-unsigned.apk ../backend/foosey.apk

# build for ios and open xcode for signing
ionic build ios
chmod +x modify_plist.sh
./modify_plist.sh
open platforms/ios/Foosey.xcodeproj