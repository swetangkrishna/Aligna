package com.aligna.app.ai

import com.aligna.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

class RemoteAiProvider(
    private val baseUrl: String = BuildConfig.AI_BASE_URL
) : AiProvider {

    private val jsonMediaType =
        "application/json; charset=utf-8".toMediaType()

    private val client =
        OkHttpClient.Builder()
            .connectTimeout(20, TimeUnit.SECONDS)
            .readTimeout(120, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()

    @Volatile
    private var initialized = false

    override suspend fun initialize() {
        require(baseUrl.isNotBlank()) {
            "AI server URL is not configured"
        }

        initialized = true
    }

    override suspend fun generate(
        systemInstruction: String,
        userMessage: String,
        temperature: Double
    ): String {
        initialize()

        return withContext(Dispatchers.IO) {
            val payload =
                JSONObject().apply {
                    put(
                        "messages",
                        JSONArray().apply {
                            put(
                                JSONObject().apply {
                                    put("role", "system")
                                    put("content", systemInstruction)
                                }
                            )

                            put(
                                JSONObject().apply {
                                    put("role", "user")
                                    put("content", userMessage)
                                }
                            )
                        }
                    )

                    put(
                        "temperature",
                        temperature.coerceIn(0.0, 1.5)
                    )
                }

            val requestId =
                java.util.UUID
                    .randomUUID()
                    .toString()

            val request =
                Request.Builder()
                    .url(
                        "${baseUrl.trimEnd('/')}/api/v1/chat/completions"
                    )
                    .post(
                        payload
                            .toString()
                            .toRequestBody(jsonMediaType)
                    )
                    .header(
                        "Accept",
                        "application/json"
                    )
                    .header(
                        "X-Aligna-API-Key",
                        BuildConfig.AI_API_KEY
                    )
                    .header(
                        "X-Request-ID",
                        requestId
                    )
                    .build()

            client
                .newCall(request)
                .execute()
                .use { response ->
                    val responseBody =
                        response.body?.string().orEmpty()

                    if (!response.isSuccessful) {
                        val requestId =
                            response.header(
                                "X-Request-ID"
                            ).orEmpty()

                        val errorMessage =
                            try {
                                JSONObject(responseBody)
                                    .optJSONObject("error")
                                    ?.optString("message")
                                    ?.takeIf {
                                        it.isNotBlank()
                                    }
                            } catch (_: Throwable) {
                                null
                            }

                        throw IOException(
                            buildString {
                                append(
                                    errorMessage
                                        ?: "AI server request failed"
                                )

                                append(
                                    " (status=${response.code}"
                                )

                                if (requestId.isNotBlank()) {
                                    append(
                                        ", requestId=$requestId"
                                    )
                                }

                                append(")")
                            }
                        )
                    }

                    val json =
                        JSONObject(responseBody)

                    json
                        .optString("content")
                        .trim()
                        .ifBlank {
                            throw IOException(
                                "AI server returned an empty response"
                            )
                        }
                }
        }
    }

    override fun isInitialized(): Boolean {
        return initialized
    }

    override fun providerName(): String {
        return "remote"
    }

    override fun close() {
        client.connectionPool.evictAll()
        client.dispatcher.executorService.shutdown()
        initialized = false
    }
}