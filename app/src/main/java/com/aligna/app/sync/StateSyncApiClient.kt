package com.aligna.app.sync

import com.aligna.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.net.HttpURLConnection
import java.net.URL

class StateSyncApiClient {

    suspend fun downloadState(
        accessToken: String
    ): JSONObject =
        withContext(
            Dispatchers.IO
        ) {
            request(
                method = "GET",
                accessToken = accessToken,
                body = null
            )
        }

    suspend fun uploadState(
        accessToken: String,
        state: JSONObject,
        stateVersion: Int,
        clientUpdatedAt: String
    ): JSONObject =
        withContext(
            Dispatchers.IO
        ) {
            val body =
                JSONObject().apply {
                    put(
                        "state",
                        state
                    )

                    put(
                        "state_version",
                        stateVersion
                    )

                    put(
                        "client_updated_at",
                        clientUpdatedAt
                    )
                }

            request(
                method = "POST",
                accessToken = accessToken,
                body = body
            )
        }

    private fun request(
    method: String,
    accessToken: String,
    body: JSONObject?
): JSONObject {
    val baseUrl =
        BuildConfig.AI_BASE_URL
            .trimEnd('/')

    val url =
        URL(
            "$baseUrl/api/v1/state"
        )

    val connection =
        url.openConnection()
            as HttpURLConnection

    return try {
        connection.requestMethod =
            method

        connection.connectTimeout =
            15_000

        connection.readTimeout =
            20_000

        connection.setRequestProperty(
            "Authorization",
            "Bearer $accessToken"
        )

        connection.setRequestProperty(
            "Accept",
            "application/json"
        )

        if (body != null) {
            connection.doOutput = true

            connection.setRequestProperty(
                "Content-Type",
                "application/json"
            )

            connection.outputStream
                .bufferedWriter()
                .use { writer ->
                    writer.write(
                        body.toString()
                    )
                }
        }

        val statusCode =
            connection.responseCode

        val stream =
            if (
                statusCode in
                200..299
            ) {
                connection.inputStream
            } else {
                connection.errorStream
            }

        val responseText =
            stream
                ?.bufferedReader()
                ?.use(
                    BufferedReader::readText
                )
                .orEmpty()

        if (
            statusCode !in
            200..299
        ) {
            throw StateSyncException(
                statusCode =
                    statusCode,

                message =
                    extractErrorMessage(
                        responseText
                    )
            )
        }

        if (
            responseText.isBlank()
        ) {
            throw StateSyncException(
                statusCode =
                    statusCode,

                message =
                    "The state API returned an empty response."
            )
        }

        JSONObject(
            responseText
        )
    } finally {
        connection.disconnect()
    }
}

    private fun extractErrorMessage(
        responseText: String
    ): String {
        return try {
            val json =
                JSONObject(
                    responseText
                )

            when {
                json.has("message") ->
                    json.optString(
                        "message"
                    )

                json.has("detail") -> {
                    val detail =
                        json.opt(
                            "detail"
                        )

                    when (detail) {
                        is JSONObject ->
                            detail.optString(
                                "message",
                                detail.toString()
                            )

                        else ->
                            detail?.toString()
                                ?: responseText
                    }
                }

                else ->
                    responseText
            }
        } catch (
            error: Throwable
        ) {
            responseText.ifBlank {
                "State synchronization failed."
            }
        }
    }
}


class StateSyncException(
    val statusCode: Int,
    override val message: String
) : Exception(message)
