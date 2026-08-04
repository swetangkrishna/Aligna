package com.aligna.app.ai

interface AiProvider : AutoCloseable {

    suspend fun initialize()

    suspend fun generate(
        systemInstruction: String,
        userMessage: String,
        temperature: Double = 0.2
    ): String

    fun isInitialized(): Boolean

    fun providerName(): String

    override fun close()
}