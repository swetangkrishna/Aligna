package com.aligna.app.ai

import com.aligna.app.GemmaEngine

class OnDeviceGemmaProvider(
    private val engine: GemmaEngine
) : AiProvider {

    override suspend fun initialize() {
        engine.initialize()
    }

    override suspend fun generate(
        systemInstruction: String,
        userMessage: String,
        temperature: Double
    ): String {
        return engine.generateAnswer(
            systemInstruction = systemInstruction,
            userMessage = userMessage,
            temperature = temperature
        )
    }

    override fun isInitialized(): Boolean {
        return engine.isInitialized()
    }

    override fun providerName(): String {
        return "on-device-gemma-${engine.getBackend()}"
    }

    override fun close() {
        engine.close()
    }
}
