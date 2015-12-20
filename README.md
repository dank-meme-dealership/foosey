# CS 471 Project

## File Organization
- The `www/app` directory is where we'll spend most of our time. This is where all of our Angular code and HTML templates will go.
- `www/css` will contain any CSS we need, and `www/img` contains any images we might use in our app (not counting stuff like the app icon or splash screens).
- `www/lib` is where Ionic stores all of it's fancy schmancy stuff. We shouldn't need to touch this at all.
- The root directory is where everything relating to the Ionic project on a larger scale goes. This is where the app stores information regarding stuff like plugins, platforms, app icons, etc. Most of the files here are automatically taken care of by Ionic.

## Setup
To get started, first follow [our install guide](https://docs.google.com/document/d/1PjuJ3a932o-g4IEGrjsTkI5s30GmzY1_wQErD1J8HYM/edit?usp=sharing) or [Ionic's instructions](http://ionicframework.com/docs/guide/installation.html).

After installing all necessary dependencies and cloning the repo, run:

- `ionic platform add android` to add the Android platform to the project
- `ionic platform add ios` to add the iOS platform to the project

From there, run `ionic build android` or `ionic build ios` to build the project. Outputs will be stored undern:
- `platforms/android/build` for Android
- `platforms/ios/build` for iOS

Android developers can use the command `ionic run android`. to run the project on an emulator or Android device with USB debugging enabled.

iOS users will have to open the Xcode project generated when building the project to then run it on an emulator or iOS device.
