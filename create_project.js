const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const appDir = path.join(rootDir, 'app');
const srcDir = path.join(appDir, 'src', 'main');
const javaDir = path.join(srcDir, 'java', 'com', 'example', 'batterynotifier');
const resDir = path.join(srcDir, 'res');
const drawableDir = path.join(resDir, 'drawable');
const githubDir = path.join(rootDir, '.github', 'workflows');

// Helper to create directories
const dirs = [javaDir, drawableDir, githubDir];
dirs.forEach(d => fs.mkdirSync(d, { recursive: true }));

// 1. build.gradle.kts (root)
fs.writeFileSync(path.join(rootDir, 'build.gradle.kts'), `buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.1.1")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.0")
    }
}
allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
`);

// 2. settings.gradle.kts
fs.writeFileSync(path.join(rootDir, 'settings.gradle.kts'), `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "BatteryNotifier"
include(":app")
`);

// 3. app/build.gradle.kts
fs.writeFileSync(path.join(appDir, 'build.gradle.kts'), `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.example.batterynotifier"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.example.batterynotifier"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.10.0")
    implementation("androidx.activity:activity-ktx:1.8.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
}
`);

// 4. AndroidManifest.xml
fs.writeFileSync(path.join(srcDir, 'AndroidManifest.xml'), `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.example.batterynotifier">

    <uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
    <!-- Required depending on Android version -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>

    <application
        android:allowBackup="true"
        android:icon="@drawable/ic_launcher_foreground"
        android:label="Pil Gösterici"
        android:supportsRtl="true"
        android:theme="@style/Theme.AppCompat.Light.NoActionBar"
        tools:targetApi="31">
        
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        
        <service
            android:name=".BatteryService"
            android:exported="false"
            android:foregroundServiceType="specialUse" />
    </application>
</manifest>
`);

// 5. ic_launcher_foreground.xml (drawable)
fs.writeFileSync(path.join(drawableDir, 'ic_launcher_foreground.xml'), `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
  <path
      android:fillColor="#008800"
      android:pathData="M34,44h40v40H34z"/>
</vector>
`);

// 6. ic_battery.xml (drawable) - Used for notification
fs.writeFileSync(path.join(drawableDir, 'ic_battery.xml'), `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
  <path
      android:fillColor="#ffffff"
      android:pathData="M15.67,4H14V2h-4v2H8.33C7.6,4 7,4.6 7,5.33v15.33C7,21.4 7.6,22 8.33,22h7.33c0.74,0 1.34,-0.6 1.34,-1.33V5.33C17,4.6 16.4,4 15.67,4z"/>
</vector>
`);

// 7. MainActivity.kt
fs.writeFileSync(path.join(javaDir, 'MainActivity.kt'), `package com.example.batterynotifier

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat

class MainActivity : ComponentActivity() {

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            startBatteryService()
        } else {
            Toast.makeText(this, "Bildirim izni vermelisiniz!", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val layout = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER
            setPadding(32, 32, 32, 32)
        }
        
        val titleText = TextView(this).apply {
            text = "Pil Göstergesi"
            textSize = 28f
            setTextColor(android.graphics.Color.DKGRAY)
            textAlignment = android.view.View.TEXT_ALIGNMENT_CENTER
        }
        
        val descText = TextView(this).apply {
            text = "Bu uygulama arka planda çalışarak, ekranı aşağı kaydırdığınızda sabit kalan ve büyük sayılarla pil seviyenizi gösteren bir bildirim oluşturur.\\n\\nBaşlat butonuna bastıktan sonra uygulamadan çıkabilirsiniz."
            textSize = 16f
            setTextColor(android.graphics.Color.GRAY)
            setPadding(0, 32, 0, 64)
            textAlignment = android.view.View.TEXT_ALIGNMENT_CENTER
        }
        
        val startButton = Button(this).apply {
            text = "BİLDİRİMİ BAŞLAT"
            textSize = 18f
            setPadding(16, 24, 16, 24)
            setOnClickListener {
                checkPermissionsAndStartService()
            }
        }
        
        layout.addView(titleText)
        layout.addView(descText)
        layout.addView(startButton)
        
        setContentView(layout)
    }

    private fun checkPermissionsAndStartService() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            } else {
                startBatteryService()
            }
        } else {
            startBatteryService()
        }
    }

    private fun startBatteryService() {
        val serviceIntent = Intent(this, BatteryService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
        Toast.makeText(this, "Pil göstergesi başlatıldı! Ekranı aşağı kaydırın.", Toast.LENGTH_LONG).show()
    }
}
`);

// 8. BatteryService.kt
fs.writeFileSync(path.join(javaDir, 'BatteryService.kt'), `package com.example.batterynotifier

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class BatteryService : Service() {
    private val CHANNEL_ID = "BatteryStatusChannel"
    private val NOTIFICATION_ID = 1

    private val batteryReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            val level: Int = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
            val scale: Int = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
            val batteryPct = level * 100 / scale.toFloat()
            updateNotification(batteryPct.toInt())
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        // Başlangıçta 0 gösterip hemen güncellenmesini bekleriz
        startForeground(NOTIFICATION_ID, buildNotification(0))
        val filter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        registerReceiver(batteryReceiver, filter)
    }

    override fun onDestroy() {
        super.onDestroy()
        unregisterReceiver(batteryReceiver)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun updateNotification(batteryPct: Int) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, buildNotification(batteryPct))
    }

    private fun buildNotification(batteryPct: Int): Notification {
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Pil Durumu")
            .setContentText("%$batteryPct")
            .setSmallIcon(R.drawable.ic_battery)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(pendingIntent)
            // Büyük text özelliği bildirimi dikkat çekici yapar
            .setStyle(NotificationCompat.BigTextStyle().bigText("Telefonunuzun şarj seviyesi: %$batteryPct\\nKalıcı bildirim aktif."))
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Pil Durumu",
                NotificationManager.IMPORTANCE_LOW 
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(serviceChannel)
        }
    }
}
`);

// 9. GitHub Actions build.yml
fs.writeFileSync(path.join(githubDir, 'build.yml'), `name: Build Android APK
on:
  push:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v3
        with:
          gradle-version: '8.4'
      - name: Grant execute permission for gradlew
        run: chmod +x gradlew || true
      - name: Build with Gradle
        run: gradle assembleDebug
      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: pil-gosterici-app
          path: app/build/outputs/apk/debug/app-debug.apk
`);

console.log('Project created successfully!');
