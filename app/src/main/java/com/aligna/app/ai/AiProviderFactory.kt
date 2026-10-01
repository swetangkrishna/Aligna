package com.aligna.app.ai

import android.content.Context
import com.aligna.app.BuildConfig
import com.aligna.app.GemmaEngine
import com.aligna.app.auth.AuthManager

object AiProviderFactory {

    fun create(
        context: Context
    ): AiProvider {
        val appContext =
            context.applicationContext

        return when (
            BuildConfig.AI_PROVIDER
                .trim()
                .lowercase()
        ) {
            "remote" -> {
                val authManager =
                    AuthManager(appContext)

                RemoteAiProvider(
                    accessTokenProvider = {
                        authManager.getAccessToken()
                    },
                    onSessionExpired = {
                        authManager.logout()
                    }
                )
            }

            "on_device",
            "on-device",
            "gemma" -> {
                OnDeviceGemmaProvider(
                    GemmaEngine(appContext)
                )
            }

            else -> {
                OnDeviceGemmaProvider(
                    GemmaEngine(appContext)
                )
            }
        }
    }
}
