package com.aligna.app

import android.content.Context
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Contents
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.SamplerConfig
import java.io.File

/**
 * On-device Gemma 4 (E2B Instruct) via LiteRT-LM — replaces the earlier MediaPipe
 * tasks-genai integration. See aligna_gemma4_integration_plan.md for the full plan;
 * this class covers Phase 1-3 of it (engine setup + GPU/CPU fallback + generation).
 *
 * SETUP REQUIRED BEFORE THIS WORKS (development path — see plan Phase 2 / README):
 *   1. Download `gemma-4-E2B-it.litertlm` from litert-community/gemma-4-E2B-it-litert-lm
 *      on Kaggle/Hugging Face after accepting Google's Gemma license.
 *   2. adb push it to MODEL_PATH below.
 *   3. `modelFileExists()` gates the AI chat UI until it finds a file there of a
 *      plausible size (a crude but cheap sanity check — it doesn't validate the
 *      file is actually a valid model, just that something real is present).
 *
 * NOTE: written against the plan's example structure and the LiteRT-LM API surface as
 * documented, but not build/run-tested on a device by me. One "Unresolved reference"
 * has already been fixed this way: `Message` has no `.text` property — every official
 * LiteRT-LM example gets the generated text via `toString()` on the returned `Message`
 * (its toString is documented to render the content), so `generate()` below uses that.
 */
class LlmHelper(private val context: Context) : AutoCloseable {

    private var engine: Engine? = null

    /** Call once, off the main thread, before the first generate() — see MainActivity's
     *  lazy-load-on-first-question pattern (Phase 6 of the plan). */
    fun initialize() {
        if (engine != null) return
        require(modelFileExists()) { "Gemma 4 model not found at $MODEL_PATH" }
        engine = createEngine()
    }

    private fun createEngine(): Engine {
        val backends = listOf(Backend.GPU(), Backend.CPU())
        var lastError: Throwable? = null

        for (backend in backends) {
            try {
                val candidate = Engine(
                    EngineConfig(
                        modelPath = MODEL_PATH,
                        backend = backend,
                        cacheDir = context.cacheDir.absolutePath
                    )
                )
                candidate.initialize()
                return candidate
            } catch (error: Throwable) {
                lastError = error
            }
        }
        throw IllegalStateException("Gemma 4 could not initialize using GPU or CPU", lastError)
    }

    /**
     * Blocking call — always invoke from a background thread.
     * Creates one short-lived conversation per call so each question from the web app
     * is an independent, stateless request rather than an accumulating chat history
     * (matches how MainActivity.askAI is actually called — see plan Phase 4/5 notes).
     */
    fun generate(systemInstruction: String, userMessage: String): String {
        val activeEngine = engine ?: error("LiteRT-LM engine is not initialized")

        val conversationConfig = ConversationConfig(
            systemInstruction = Contents.of(systemInstruction),
            samplerConfig = SamplerConfig(
                topK = 20,
                topP = 0.9,
                temperature = 0.4
            )
        )

        activeEngine.createConversation(conversationConfig).use { conversation ->
            // Message has no `.text` property — every official LiteRT-LM example just
            // does println(response)/message.toString() to get the generated text, so
            // toString() is the documented way to pull a plain String out of a Message.
            return conversation.sendMessage(Contents.of(userMessage)).toString()
        }
    }

    override fun close() {
        try { engine?.close() } finally { engine = null }
    }

    companion object {
        // Development-only path (see plan Phase 2/8) — for production this should move to
        // context.filesDir/"models/gemma-4-E2B-it.litertlm" behind an in-app downloader.
        const val MODEL_PATH = "/data/local/tmp/aligna/model.litertlm"

        fun modelFileExists(): Boolean {
            val file = File(MODEL_PATH)
            return file.isFile && file.length() > 100_000_000L
        }
    }
}
