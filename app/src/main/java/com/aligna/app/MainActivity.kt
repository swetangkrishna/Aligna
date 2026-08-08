package com.aligna.app

import android.Manifest
import android.app.Activity
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import java.util.Calendar
import android.content.pm.ApplicationInfo
import com.aligna.app.auth.AuthBridge
import com.aligna.app.auth.AuthManager
import com.aligna.app.sync.StateSyncBridge

class MainActivity : Activity() {

    private lateinit var webView: WebView
    private lateinit var aiManager: AlignaAiManager
    private lateinit var aiBridge: AlignaAiBridge
    private lateinit var authManager: AuthManager
    private lateinit var authBridge: AuthBridge
    private lateinit var stateSyncBridge: StateSyncBridge

    override fun onCreate(
        savedInstanceState: Bundle?
    ) {
        super.onCreate(
            savedInstanceState
        )

        createNotificationChannel()
        requestRequiredPermissions()

        webView =
            WebView(this)

        setContentView(
            webView
        )

        authManager =
            AuthManager(
                applicationContext
            )

        authBridge =
            AuthBridge(
                webView = webView,
                authManager = authManager
            )

        stateSyncBridge =
            StateSyncBridge(
                webView = webView,
                authManager = authManager
            )

        webView.addJavascriptInterface(
            authBridge,
            "AlignaAuth"
        )

        webView.addJavascriptInterface(
            stateSyncBridge,
            "AlignaStateSync"
        )

        aiManager =
            AlignaAiManager(
                applicationContext
            )

        configureWebView()
        registerJavaScriptBridges()

        webView.loadUrl(
            "file:///android_asset/index.html"
        )
    }

    private fun configureWebView() {
        val isDebuggable =
            applicationInfo.flags and
                    ApplicationInfo.FLAG_DEBUGGABLE != 0

        WebView.setWebContentsDebuggingEnabled(
            isDebuggable
        )

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            mediaPlaybackRequiresUserGesture = false
        }

        webView.webViewClient =
            WebViewClient()

        webView.webChromeClient =
            object : WebChromeClient() {

                override fun onPermissionRequest(
                    request: PermissionRequest
                ) {
                    runOnUiThread {
                        val cameraRequested =
                            request.resources.contains(
                                PermissionRequest
                                    .RESOURCE_VIDEO_CAPTURE
                            )

                        val cameraGranted =
                            checkSelfPermission(
                                Manifest.permission.CAMERA
                            ) ==
                                    PackageManager
                                        .PERMISSION_GRANTED

                        if(
                            cameraRequested &&
                            cameraGranted
                        ){
                            request.grant(
                                arrayOf(
                                    PermissionRequest
                                        .RESOURCE_VIDEO_CAPTURE
                                )
                            )
                        }else{
                            request.deny()
                        }
                    }
                }
            }
    }

    private fun registerJavaScriptBridges() {
        webView.addJavascriptInterface(
            AndroidBridge(),
            "Android"
        )

        aiBridge =
            AlignaAiBridge(
                webView =
                    webView,

                aiManager =
                    aiManager
            )

        webView.addJavascriptInterface(
            aiBridge,
            "AlignaAI"
        )
    }

    private fun requestRequiredPermissions() {
        val permissions =
            buildList {
                if (
                    Build.VERSION.SDK_INT >=
                    Build.VERSION_CODES.TIRAMISU &&
                    checkSelfPermission(
                        Manifest.permission
                            .POST_NOTIFICATIONS
                    ) !=
                    PackageManager
                        .PERMISSION_GRANTED
                ) {
                    add(
                        Manifest.permission
                            .POST_NOTIFICATIONS
                    )
                }

                if (
                    checkSelfPermission(
                        Manifest.permission.CAMERA
                    ) !=
                    PackageManager
                        .PERMISSION_GRANTED
                ) {
                    add(
                        Manifest.permission.CAMERA
                    )
                }
            }

        if (permissions.isNotEmpty()) {
            requestPermissions(
                permissions.toTypedArray(),
                PERMISSION_REQUEST_CODE
            )
        }
    }

    override fun onBackPressed() {
        if (
            ::webView.isInitialized &&
            webView.canGoBack()
        ) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        if (::aiBridge.isInitialized) {
            aiBridge.close()
        }

        if (::authBridge.isInitialized) {
            authBridge.close()
        }
        stateSyncBridge.close()
        
        if (::aiManager.isInitialized) {
            aiManager.close()
        }

        if (::webView.isInitialized) {
            webView.removeJavascriptInterface(
                "AlignaAI"
            )

            webView.removeJavascriptInterface(
                "Android"
            )

            webView.stopLoading()
            webView.loadUrl("about:blank")
            webView.clearHistory()
            webView.removeAllViews()
            webView.destroy()
        }

        
        super.onDestroy()
    }

    private fun createNotificationChannel() {
        if (
            Build.VERSION.SDK_INT <
            Build.VERSION_CODES.O
        ) {
            return
        }

        val channel =
            NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "Aligna reminders",
                NotificationManager
                    .IMPORTANCE_HIGH
            ).apply {
                description =
                    "Meal, drink, workout and grocery reminders"
            }

        val manager =
            getSystemService(
                NOTIFICATION_SERVICE
            ) as NotificationManager

        manager.createNotificationChannel(
            channel
        )
    }

    inner class AndroidBridge {

        private val context: Context
            get() = this@MainActivity

        @JavascriptInterface
        fun scheduleDailyReminder(
            id: Int,
            hour: Int,
            minute: Int,
            title: String,
            text: String
        ) {
            val safeHour =
                hour.coerceIn(
                    0,
                    23
                )

            val safeMinute =
                minute.coerceIn(
                    0,
                    59
                )

            val alarmManager =
                context.getSystemService(
                    Context.ALARM_SERVICE
                ) as AlarmManager

            val intent =
                Intent(
                    context,
                    ReminderReceiver::class.java
                ).apply {
                    putExtra(
                        "title",
                        title.take(120)
                    )

                    putExtra(
                        "text",
                        text.take(300)
                    )

                    putExtra(
                        "id",
                        id
                    )
                }

            val pendingIntent =
                PendingIntent.getBroadcast(
                    context,
                    id,
                    intent,
                    PendingIntent
                        .FLAG_UPDATE_CURRENT or
                            PendingIntent
                                .FLAG_IMMUTABLE
                )

            val calendar =
                Calendar.getInstance().apply {
                    set(
                        Calendar.HOUR_OF_DAY,
                        safeHour
                    )

                    set(
                        Calendar.MINUTE,
                        safeMinute
                    )

                    set(
                        Calendar.SECOND,
                        0
                    )

                    set(
                        Calendar.MILLISECOND,
                        0
                    )

                    if (
                        timeInMillis <=
                        System.currentTimeMillis()
                    ) {
                        add(
                            Calendar.DAY_OF_MONTH,
                            1
                        )
                    }
                }

            alarmManager.setInexactRepeating(
                AlarmManager.RTC_WAKEUP,
                calendar.timeInMillis,
                AlarmManager.INTERVAL_DAY,
                pendingIntent
            )
        }

        @JavascriptInterface
        fun scheduleOneOff(
            minutesFromNow: Int,
            title: String,
            text: String
        ) {
            val safeMinutes =
                minutesFromNow.coerceIn(
                    1,
                    10_080
                )

            val alarmManager =
                context.getSystemService(
                    Context.ALARM_SERVICE
                ) as AlarmManager

            val intent =
                Intent(
                    context,
                    ReminderReceiver::class.java
                ).apply {
                    putExtra(
                        "title",
                        title.take(120)
                    )

                    putExtra(
                        "text",
                        text.take(300)
                    )

                    putExtra(
                        "id",
                        GROCERY_REMINDER_ID
                    )
                }

            val pendingIntent =
                PendingIntent.getBroadcast(
                    context,
                    GROCERY_REMINDER_ID,
                    intent,
                    PendingIntent
                        .FLAG_UPDATE_CURRENT or
                            PendingIntent
                                .FLAG_IMMUTABLE
                )

            val triggerAt =
                System.currentTimeMillis() +
                        safeMinutes * 60_000L

            alarmManager.set(
                AlarmManager.RTC_WAKEUP,
                triggerAt,
                pendingIntent
            )
        }

        @JavascriptInterface
        fun cancelAll() {
            val alarmManager =
                context.getSystemService(
                    Context.ALARM_SERVICE
                ) as AlarmManager

            for (
            requestCode in
            0..MAX_DAILY_REMINDER_ID
            ) {
                cancelReminder(
                    alarmManager,
                    requestCode
                )
            }

            cancelReminder(
                alarmManager,
                GROCERY_REMINDER_ID
            )
        }

        private fun cancelReminder(
            alarmManager: AlarmManager,
            requestCode: Int
        ) {
            val intent =
                Intent(
                    context,
                    ReminderReceiver::class.java
                )

            val pendingIntent =
                PendingIntent.getBroadcast(
                    context,
                    requestCode,
                    intent,
                    PendingIntent
                        .FLAG_NO_CREATE or
                            PendingIntent
                                .FLAG_IMMUTABLE
                )

            if (pendingIntent != null) {
                alarmManager.cancel(
                    pendingIntent
                )

                pendingIntent.cancel()
            }
        }
    }

    companion object {
        private const val PERMISSION_REQUEST_CODE =
            100

        private const val NOTIFICATION_CHANNEL_ID =
            "aligna"

        private const val GROCERY_REMINDER_ID =
            999

        private const val MAX_DAILY_REMINDER_ID =
            50
    }
}