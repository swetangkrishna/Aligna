package com.aligna.app.auth

data class AuthenticatedUser(
    val id: String,
    val email: String,
    val fullName: String?,
    val isActive: Boolean,
    val isVerified: Boolean
)

data class AuthSession(
    val accessToken: String,
    val expiresInSeconds: Long,
    val user: AuthenticatedUser
)
