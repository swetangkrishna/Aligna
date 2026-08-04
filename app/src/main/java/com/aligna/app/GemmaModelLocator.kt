package com.aligna.app

import android.content.Context
import android.util.Log
import java.io.File

object GemmaModelLocator {

    private const val MODEL_FOLDER =
        "models"

    private const val MODEL_FILE_NAME =
        "gemma-4-E2B-it.litertlm"

    /*
     * This protects against an empty or partially copied model.
     * It is not a cryptographic integrity check.
     */
    private const val MINIMUM_MODEL_SIZE_BYTES =
        1_000_000_000L

    fun getModelDirectory(
        context: Context
    ): File {
        return File(
            context.filesDir,
            MODEL_FOLDER
        )
    }

    fun getModelFile(
        context: Context
    ): File {
        return File(
            getModelDirectory(context),
            MODEL_FILE_NAME
        )
    }

    fun modelExists(
        context: Context
    ): Boolean {
        val file =
            getModelFile(context)

        val valid =
            file.isFile &&
                    file.canRead() &&
                    file.length() >=
                    MINIMUM_MODEL_SIZE_BYTES

        Log.d(
            TAG,
            buildString {
                append("Model path=")
                append(file.absolutePath)
                append(", exists=")
                append(file.exists())
                append(", isFile=")
                append(file.isFile)
                append(", readable=")
                append(file.canRead())
                append(", bytes=")
                append(file.length())
                append(", valid=")
                append(valid)
            }
        )

        return valid
    }

    fun status(
        context: Context
    ): ModelStatus {
        val file =
            getModelFile(context)

        return ModelStatus(
            path =
                file.absolutePath,

            exists =
                file.exists(),

            isFile =
                file.isFile,

            readable =
                file.canRead(),

            sizeBytes =
                file.length(),

            valid =
                modelExists(context)
        )
    }

    data class ModelStatus(
        val path: String,
        val exists: Boolean,
        val isFile: Boolean,
        val readable: Boolean,
        val sizeBytes: Long,
        val valid: Boolean
    )

    private const val TAG =
        "AlignaGemma"
}