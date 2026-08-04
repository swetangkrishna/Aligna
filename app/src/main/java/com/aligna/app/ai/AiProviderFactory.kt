package com.aligna.app.ai

import android.content.Context
import com.aligna.app.BuildConfig
import com.aligna.app.GemmaEngine

object AiProviderFactory {

    fun create(
        context: Context
    ): AiProvider {
        return when (
            BuildConfig.AI_PROVIDER
                .trim()
                .lowercase()
        ) {
            "on_device" -> {
                OnDeviceGemmaProvider(
                    GemmaEngine(
                        context.applicationContext
                    )
                )
            }

            "remote" -> {
                RemoteAiProvider()
            }

            else -> {
                throw IllegalStateException(
                    "Unsupported AI provider: " +
                            BuildConfig.AI_PROVIDER
                )
            }
        }
    }
}