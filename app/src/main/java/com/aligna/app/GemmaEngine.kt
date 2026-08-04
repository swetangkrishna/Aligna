package com.aligna.app

import android.content.Context
import android.util.Log
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Contents
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.ExperimentalApi
import com.google.ai.edge.litertlm.ExperimentalFlags
import com.google.ai.edge.litertlm.SamplerConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

class GemmaEngine(
    context: Context
) : AutoCloseable {

    private val appContext =
        context.applicationContext

    private val initializationMutex =
        Mutex()

    /*
     * LiteRT-LM conversations and the underlying engine should not be
     * used concurrently from unrelated requests unless explicitly
     * designed for that usage.
     */
    private val inferenceMutex =
        Mutex()

    @Volatile
    private var engine: Engine? = null

    @Volatile
    private var activeBackend: String =
        "Not initialized"

    @OptIn(ExperimentalApi::class)
    suspend fun initialize() {
        if (engine != null) {
            return
        }

        initializationMutex.withLock {
            if (engine != null) {
                return@withLock
            }

            withContext(Dispatchers.IO) {
                val modelFile =
                    GemmaModelLocator.getModelFile(
                        appContext
                    )

                require(
                    GemmaModelLocator.modelExists(
                        appContext
                    )
                ) {
                    "Gemma model not found or incomplete at " +
                            modelFile.absolutePath
                }

                /*
                 * Multi-token prediction/speculative decoding is
                 * recommended for compatible Gemma models on GPU.
                 */
                ExperimentalFlags.enableSpeculativeDecoding =
                    true

                val loadedEngine =
                    try {
                        createAndInitializeEngine(
                            Backend.GPU()
                        ).also {
                            activeBackend = "GPU"
                        }
                    } catch (gpuError: Throwable) {
                        Log.w(
                            TAG,
                            "GPU initialization failed; falling back to CPU.",
                            gpuError
                        )

                        createAndInitializeEngine(
                            Backend.CPU()
                        ).also {
                            activeBackend = "CPU"
                        }
                    }

                engine = loadedEngine

                Log.i(
                    TAG,
                    "Gemma initialized with backend=$activeBackend"
                )
            }
        }
    }

    private fun createAndInitializeEngine(
        backend: Backend
    ): Engine {
        val modelFile =
            GemmaModelLocator.getModelFile(
                appContext
            )

        val config =
            EngineConfig(
                modelPath =
                    modelFile.absolutePath,

                backend =
                    backend,

                cacheDir =
                    appContext.cacheDir.absolutePath
            )

        return Engine(config).also {
            it.initialize()
        }
    }

    suspend fun generateAnswer(
        systemInstruction: String,
        userMessage: String,
        temperature: Double = 0.25
    ): String {
        initialize()

        return inferenceMutex.withLock {
            withContext(Dispatchers.IO) {
                val currentEngine =
                    requireNotNull(engine) {
                        "Gemma engine is not initialized"
                    }

                val conversationConfig =
                    ConversationConfig(
                        systemInstruction =
                            Contents.of(
                                systemInstruction
                            ),

                        samplerConfig =
                            SamplerConfig(
                                topK = 20,
                                topP = 0.9,
                                temperature =
                                    temperature.coerceIn(
                                        0.0,
                                        1.5
                                    )
                            )
                    )

                currentEngine
                    .createConversation(
                        conversationConfig
                    )
                    .use { conversation ->
                        val response =
                            conversation.sendMessage(
                                Contents.of(
                                    userMessage
                                )
                            )

                        response
                            .toString()
                            .trim()
                            .ifBlank {
                                throw IllegalStateException(
                                    "Gemma returned an empty response"
                                )
                            }
                    }
            }
        }
    }

    fun getBackend(): String {
        return activeBackend
    }

    fun isInitialized(): Boolean {
        return engine != null
    }

    override fun close() {
        try {
            engine?.close()
        } catch (error: Throwable) {
            Log.w(
                TAG,
                "Error while closing Gemma engine",
                error
            )
        } finally {
            engine = null
            activeBackend =
                "Not initialized"
        }
    }

    companion object {
        private const val TAG =
            "AlignaGemma"
    }
}