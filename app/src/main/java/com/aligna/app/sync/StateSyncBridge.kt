package com.aligna.app.sync

import android.webkit.JavascriptInterface
import android.webkit.WebView
import com.aligna.app.auth.AuthManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import org.json.JSONObject

class StateSyncBridge(
    private val webView: WebView,
    private val authManager: AuthManager
) {
    private val apiClient =
        StateSyncApiClient()

    private val scope =
        CoroutineScope(
            SupervisorJob() +
                Dispatchers.Main
        )

    @JavascriptInterface
    fun downloadState(
        requestId: String
    ) {
        scope.launch {
            val token =
                authManager
                    .getAccessToken()

            if (token == null) {
                sendResult(
                    requestId =
                        requestId,

                    operation =
                        "download",

                    success =
                        false,

                    error =
                        "You must be signed in before downloading state."
                )

                return@launch
            }

            try {
                val result =
                    apiClient
                        .downloadState(
                            accessToken =
                                token
                        )

                sendResult(
                    requestId =
                        requestId,

                    operation =
                        "download",

                    success =
                        true,

                    data =
                        result
                )
            } catch (
                error:
                    StateSyncException
            ) {
                if (
                    error.statusCode ==
                    401
                ) {
                    authManager.logout()
                }

                sendResult(
                    requestId =
                        requestId,

                    operation =
                        "download",

                    success =
                        false,

                    error =
                        error.message
                )
            } catch (
                error: Throwable
            ) {
                sendResult(
                    requestId =
                        requestId,

                    operation =
                        "download",

                    success =
                        false,

                    error =
                        error.message
                            ?: "State download failed."
                )
            }
        }
    }

    @JavascriptInterface
    fun uploadState(
        requestId: String,
        stateJson: String,
        clientUpdatedAt: String
    ) {
        scope.launch {
            val token =
                authManager
                    .getAccessToken()

            if (token == null) {
                sendResult(
                    requestId =
                        requestId,

                    operation =
                        "upload",

                    success =
                        false,

                    error =
                        "You must be signed in before uploading state."
                )

                return@launch
            }

            try {
                val state =
                    JSONObject(
                        stateJson
                    )

                val result =
                    apiClient
                        .uploadState(
                            accessToken =
                                token,

                            state =
                                state,

                            stateVersion =
                                1,

                            clientUpdatedAt =
                                clientUpdatedAt
                        )

                sendResult(
                    requestId =
                        requestId,

                    operation =
                        "upload",

                    success =
                        true,

                    data =
                        result
                )
            } catch (
                error:
                    StateSyncException
            ) {
                if (
                    error.statusCode ==
                    401
                ) {
                    authManager.logout()
                }

                sendResult(
                    requestId =
                        requestId,

                    operation =
                        "upload",

                    success =
                        false,

                    error =
                        error.message
                )
            } catch (
                error: Throwable
            ) {
                sendResult(
                    requestId =
                        requestId,

                    operation =
                        "upload",

                    success =
                        false,

                    error =
                        error.message
                            ?: "State upload failed."
                )
            }
        }
    }

    fun close() {
        scope.cancel()
    }

    private fun sendResult(
        requestId: String,
        operation: String,
        success: Boolean,
        data: JSONObject? = null,
        error: String? = null
    ) {
        val detail =
            JSONObject().apply {
                put(
                    "requestId",
                    requestId
                )

                put(
                    "operation",
                    operation
                )

                put(
                    "success",
                    success
                )

                if (data != null) {
                    put(
                        "data",
                        data
                    )
                }

                if (error != null) {
                    put(
                        "error",
                        error
                    )
                }
            }

        val script =
            """
            window.dispatchEvent(
                new CustomEvent(
                    "aligna-state-sync-result",
                    {
                        detail: $detail
                    }
                )
            );
            """.trimIndent()

        webView.post {
            webView.evaluateJavascript(
                script,
                null
            )
        }
    }
}
