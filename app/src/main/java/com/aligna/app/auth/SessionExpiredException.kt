package com.aligna.app.auth

import java.io.IOException

class SessionExpiredException(
    message: String =
        "Your session has expired. Please sign in again."
) : IOException(message)
