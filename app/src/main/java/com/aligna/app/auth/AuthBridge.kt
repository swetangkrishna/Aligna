package com.aligna.app.auth

import android.webkit.JavascriptInterface
import android.webkit.WebView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import org.json.JSONObject

class AuthBridge(
    private val webView: WebView,
    private val authManager: AuthManager
) {
    private val scope =
        CoroutineScope(
            SupervisorJob() +
                Dispatchers.Main
        )

    @JavascriptInterface
    fun login(
        email: String,
        password: String
    ) {
        scope.launch {
            try {
                val session =
                    authManager.login(
                        email = email,
                        password = password
                    )

                sendEvent(
                    name = "aligna-auth-login",
                    success = true,
                    data = sessionToJson(session)
                )
            } catch (error: Throwable) {
                sendEvent(
                    name = "aligna-auth-login",
                    success = false,
                    error = error.message
                        ?: "Login failed"
                )
            }
        }
    }

    @JavascriptInterface
    fun register(
        email: String,
        password: String,
        fullName: String?
    ) {
        scope.launch {
            try {
                val session =
                    authManager.register(
                        email = email,
                        password = password,
                        fullName = fullName
                    )

                sendEvent(
                    name = "aligna-auth-register",
                    success = true,
                    data = sessionToJson(session)
                )
            } catch (error: Throwable) {
                sendEvent(
                    name = "aligna-auth-register",
                    success = false,
                    error = error.message
                        ?: "Registration failed"
                )
            }
        }
    }

    @JavascriptInterface
    fun restoreSession() {
        val user =
            authManager.getStoredUser()

        if (
            user == null ||
            !authManager.isSignedIn()
        ) {
            sendEvent(
                name = "aligna-auth-session",
                success = false
            )

            return
        }

        sendEvent(
            name = "aligna-auth-session",
            success = true,
            data = JSONObject().apply {
                put(
                    "user",
                    userToJson(user)
                )
            }
        )
    }

    @JavascriptInterface
    fun logout() {
        authManager.logout()

        sendEvent(
            name = "aligna-auth-logout",
            success = true
        )
    }

    @JavascriptInterface
    fun isSignedIn(): Boolean {
        return authManager.isSignedIn()
    }

    fun notifySessionExpired() {
        authManager.logout()

        sendEvent(
            name = "aligna-auth-expired",
            success = false,
            error = "Your session has expired"
        )
    }

    fun close() {
        scope.cancel()
    }

    private fun sessionToJson(
        session: AuthSession
    ): JSONObject {
        return JSONObject().apply {
            put(
                "expires_in",
                session.expiresInSeconds
            )

            put(
                "user",
                userToJson(session.user)
            )
        }
    }

    private fun userToJson(
        user: AuthenticatedUser
    ): JSONObject {
        return JSONObject().apply {
            put("id", user.id)
            put("email", user.email)
            put("full_name", user.fullName)
            put("is_active", user.isActive)
            put(
                "is_verified",
                user.isVerified
            )
        }
    }

    private fun sendEvent(
        name: String,
        success: Boolean,
        data: JSONObject? = null,
        error: String? = null
    ) {
        val detail =
            JSONObject().apply {
                put("success", success)

                if (data != null) {
                    put("data", data)
                }

                if (error != null) {
                    put("error", error)
                }
            }

        val script =
            """
            window.dispatchEvent(
                new CustomEvent(
                    ${JSONObject.quote(name)},
                    { detail: $detail }
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
