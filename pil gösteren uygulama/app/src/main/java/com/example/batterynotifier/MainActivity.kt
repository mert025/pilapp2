package com.example.batterynotifier

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
            text = "Bu uygulama arka planda çalışarak, ekranı aşağı kaydırdığınızda sabit kalan ve büyük sayılarla pil seviyenizi gösteren bir bildirim oluşturur.\n\nBaşlat butonuna bastıktan sonra uygulamadan çıkabilirsiniz."
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
