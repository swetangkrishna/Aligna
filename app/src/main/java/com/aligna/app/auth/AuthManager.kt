package com.aligna.app.auth

import android.content.Context

class AuthManager(
    context: Context
) {
    private val apiClient =
        AuthApiClient()

    private val tokenStore =
        AuthTokenStore(
            context.applicationContext
        )

    suspend fun login(
        email: String,
        password: String
    ): AuthSession {
        val session =
            apiClient.login(
                email = email,
                password = password
            )

        tokenStore.saveSession(session)

        return session
    }

    suspend fun register(
        email: String,
        password: String,
        fullName: String?
    ): AuthSession {
        val session =
            apiClient.register(
                email = email,
                password = password,
                fullName = fullName
            )

        tokenStore.saveSession(session)

        return session
    }

    fun getAccessToken(): String? {
        return tokenStore
            .getValidAccessToken()
    }

    fun getStoredUser(): AuthenticatedUser? {
        return tokenStore
            .getStoredUser()
    }

    fun isSignedIn(): Boolean {
        return tokenStore.isSignedIn()
    }

    fun logout() {
        tokenStore.clear()
    }
}
