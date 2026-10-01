package com.aligna.app.auth

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class AuthTokenStore(
    context: Context
) {
    private val masterKey =
        MasterKey.Builder(context)
            .setKeyScheme(
                MasterKey.KeyScheme.AES256_GCM
            )
            .build()

    private val preferences =
        EncryptedSharedPreferences.create(
            context,
            "aligna_auth",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )

    fun saveSession(
        session: AuthSession
    ) {
        val expiresAt =
            System.currentTimeMillis() +
                session.expiresInSeconds * 1000L

        preferences
            .edit()
            .putString(
                ACCESS_TOKEN_KEY,
                session.accessToken
            )
            .putLong(
                EXPIRES_AT_KEY,
                expiresAt
            )
            .putString(
                USER_ID_KEY,
                session.user.id
            )
            .putString(
                USER_EMAIL_KEY,
                session.user.email
            )
            .putString(
                USER_NAME_KEY,
                session.user.fullName
            )
            .putBoolean(
                USER_ACTIVE_KEY,
                session.user.isActive
            )
            .putBoolean(
                USER_VERIFIED_KEY,
                session.user.isVerified
            )
            .apply()
    }

    fun getValidAccessToken(): String? {
        val token =
            preferences.getString(
                ACCESS_TOKEN_KEY,
                null
            )

        val expiresAt =
            preferences.getLong(
                EXPIRES_AT_KEY,
                0L
            )

        if (
            token.isNullOrBlank() ||
            expiresAt <= System.currentTimeMillis()
        ) {
            clear()
            return null
        }

        return token
    }

    fun getStoredUser(): AuthenticatedUser? {
        if (getValidAccessToken() == null) {
            return null
        }

        val id =
            preferences.getString(
                USER_ID_KEY,
                null
            )
                ?: return null

        val email =
            preferences.getString(
                USER_EMAIL_KEY,
                null
            )
                ?: return null

        return AuthenticatedUser(
            id = id,
            email = email,
            fullName =
                preferences.getString(
                    USER_NAME_KEY,
                    null
                ),
            isActive =
                preferences.getBoolean(
                    USER_ACTIVE_KEY,
                    true
                ),
            isVerified =
                preferences.getBoolean(
                    USER_VERIFIED_KEY,
                    false
                )
        )
    }

    fun isSignedIn(): Boolean {
        return getValidAccessToken() != null
    }

    fun clear() {
        preferences
            .edit()
            .clear()
            .apply()
    }

    companion object {
        private const val ACCESS_TOKEN_KEY =
            "access_token"

        private const val EXPIRES_AT_KEY =
            "expires_at"

        private const val USER_ID_KEY =
            "user_id"

        private const val USER_EMAIL_KEY =
            "user_email"

        private const val USER_NAME_KEY =
            "user_name"

        private const val USER_ACTIVE_KEY =
            "user_active"

        private const val USER_VERIFIED_KEY =
            "user_verified"
    }
}
