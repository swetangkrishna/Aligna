package com.aligna.app.auth

import com.aligna.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

class AuthApiClient(
    private val baseUrl: String =
        BuildConfig.AI_BASE_URL
) {
    private val jsonMediaType =
        "application/json; charset=utf-8"
            .toMediaType()

    private val client =
        OkHttpClient.Builder()
            .connectTimeout(
                20,
                TimeUnit.SECONDS
            )
            .readTimeout(
                60,
                TimeUnit.SECONDS
            )
            .writeTimeout(
                30,
                TimeUnit.SECONDS
            )
            .build()

    suspend fun login(
        email: String,
        password: String
    ): AuthSession {
        val payload =
            JSONObject().apply {
                put(
                    "email",
                    email.trim()
                )
                put(
                    "password",
                    password
                )
            }

        return executeAuthRequest(
            endpoint = "/api/v1/auth/login",
            payload = payload
        )
    }

    suspend fun register(
        email: String,
        password: String,
        fullName: String?
    ): AuthSession {
        val payload =
            JSONObject().apply {
                put(
                    "email",
                    email.trim()
                )
                put(
                    "password",
                    password
                )

                if (!fullName.isNullOrBlank()) {
                    put(
                        "full_name",
                        fullName.trim()
                    )
                }
            }

        return executeAuthRequest(
            endpoint = "/api/v1/auth/register",
            payload = payload
        )
    }

    private suspend fun executeAuthRequest(
        endpoint: String,
        payload: JSONObject
    ): AuthSession =
        withContext(Dispatchers.IO) {
            val request =
                Request.Builder()
                    .url(
                        baseUrl.trimEnd('/') +
                            endpoint
                    )
                    .post(
                        payload
                            .toString()
                            .toRequestBody(
                                jsonMediaType
                            )
                    )
                    .header(
                        "Accept",
                        "application/json"
                    )
                    .build()

            client
                .newCall(request)
                .execute()
                .use { response ->
                    val responseText =
                        response.body
                            ?.string()
                            .orEmpty()

                    if (!response.isSuccessful) {
                        throw IOException(
                            parseError(
                                responseText,
                                response.code
                            )
                        )
                    }

                    parseSession(responseText)
                }
        }

    private fun parseSession(
        responseText: String
    ): AuthSession {
        val json =
            JSONObject(responseText)

        val userJson =
            json.getJSONObject("user")

        return AuthSession(
            accessToken =
                json.getString(
                    "access_token"
                ),
            expiresInSeconds =
                json.getLong(
                    "expires_in"
                ),
            user =
                AuthenticatedUser(
                    id =
                        userJson.getString(
                            "id"
                        ),
                    email =
                        userJson.getString(
                            "email"
                        ),
                    fullName =
                        userJson
                            .optString(
                                "full_name"
                            )
                            .takeIf {
                                it.isNotBlank() &&
                                    it != "null"
                            },
                    isActive =
                        userJson.getBoolean(
                            "is_active"
                        ),
                    isVerified =
                        userJson.getBoolean(
                            "is_verified"
                        )
                )
        )
    }

    private fun parseError(
        responseText: String,
        statusCode: Int
    ): String {
        return try {
            JSONObject(responseText)
                .optJSONObject("error")
                ?.optString("message")
                ?.takeIf {
                    it.isNotBlank()
                }
                ?: "Authentication failed"
        } catch (_: Throwable) {
            "Authentication failed " +
                "(status=$statusCode)"
        }
    }
}
