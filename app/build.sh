git pull
rm -rf platforms/
ionic platform add ios
ionic resources
ionic build ios
chmod +x modify_plist.sh
./modify_plist.sh
open platforms/ios/Foosey.xcodeproj
open resources/ios/icon/