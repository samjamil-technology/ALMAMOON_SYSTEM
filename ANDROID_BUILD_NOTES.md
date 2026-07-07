# Android build notes

## Issue found
The Android build failed because the installed Java runtime is too old for the Gradle build used by Capacitor.

Current Java version detected:
- java version "1.1.8.24"

## What you need
Install a modern JDK such as:
- JDK 17
- or JDK 21

## Recommended setup on Windows
1. Install Temurin JDK 17 or 21.
2. Set JAVA_HOME to the installation folder, for example:
   - C:\Program Files\Eclipse Adoptium\jdk-17.0.x\n
3. Add %JAVA_HOME%\bin to PATH.
4. Restart the terminal.
5. Run:
   - npx cap build android

## If Android Studio is installed
You can also set the Java runtime inside Android Studio:
- File > Project Structure > Project
- Set Gradle JDK to JDK 17
