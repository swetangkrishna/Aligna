package com.aligna.app

import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.atomic.AtomicBoolean

class AlignaAiBridge(
    private val webView: WebView,
    private val aiManager: AlignaAiManager
) {

    private val scope =
        CoroutineScope(
            SupervisorJob() +
                    Dispatchers.IO
        )

    /*
     * The JavaScript side also blocks concurrent requests, but the
     * native side must protect itself independently.
     */
    private val requestInProgress =
        AtomicBoolean(false)

    @JavascriptInterface
    fun ping(): String {
        return "AlignaAI bridge connected"
    }

    @JavascriptInterface
    fun modelStatus(
        requestId: String
    ) {
        val status =
            GemmaModelLocator.status(
                webView.context
            )

        val response =
            JSONObject().apply {
                put(
                    "requestId",
                    requestId
                )

                put(
                    "modelInstalled",
                    status.valid
                )

                put(
                    "modelPath",
                    status.path
                )

                put(
                    "modelSizeBytes",
                    status.sizeBytes
                )

                put(
                    "modelReadable",
                    status.readable
                )

                put(
                    "backend",
                    aiManager.backend()
                )

                put(
                    "initialized",
                    aiManager.isInitialized()
                )
            }

        callJavaScript(
            functionName =
                "window.onModelStatus",

            payload =
                response
        )
    }

    @JavascriptInterface
    fun askQuestion(
        requestId: String,
        question: String,
        profileJson: String,
        appContext: String,
        retrievedKnowledge: String
    ) {
        if (
            !requestInProgress.compareAndSet(
                false,
                true
            )
        ) {
            callJavaScript(
                "window.onAiAnswer",
                errorResponse(
                    requestId,
                    "Another AI request is already running"
                )
            )

            return
        }

        Log.d(
            TAG,
            buildString {
                append("requestId=")
                append(requestId)
                append(", questionChars=")
                append(question.length)
                append(", profileChars=")
                append(profileJson.length)
                append(", contextChars=")
                append(appContext.length)
                append(", knowledgeChars=")
                append(retrievedKnowledge.length)
            }
        )

        scope.launch {
            val response =
                try {
                    val profile =
                        parseUserProfile(
                            profileJson
                        )

                    val answer =
                        aiManager.answerQuestion(
                            question =
                                question,

                            profile =
                                profile,

                            appContext =
                                appContext,

                            retrievedKnowledge =
                                retrievedKnowledge
                        )

                    JSONObject().apply {
                        put(
                            "requestId",
                            requestId
                        )

                        put(
                            "success",
                            true
                        )

                        put(
                            "answer",
                            answer
                        )
                    }
                } catch (error: Throwable) {
                    Log.e(
                        TAG,
                        "AI generation failed for $requestId",
                        error
                    )

                    errorResponse(
                        requestId,
                        describeError(error)
                    )
                } finally {
                    requestInProgress.set(
                        false
                    )
                }

            callJavaScript(
                functionName =
                    "window.onAiAnswer",

                payload =
                    response
            )
        }
    }

    @JavascriptInterface
    fun generateWorkoutPlan(
        requestId: String,
        profileJson: String,
        allowedExercisesJson: String
    ) {
        if (
            !requestInProgress.compareAndSet(
                false,
                true
            )
        ) {
            callJavaScript(
                "window.onWorkoutPlanGenerated",
                errorResponse(
                    requestId,
                    "Another AI request is already running"
                )
            )

            return
        }

        scope.launch {
            val response =
                try {
                    val profile =
                        requireNotNull(
                            parseUserProfile(
                                profileJson
                            )
                        ) {
                            "User profile is required"
                        }

                    val result =
                        aiManager.createWorkoutPlan(
                            profile =
                                profile,

                            allowedExercisesJson =
                                allowedExercisesJson
                        )

                    val cleanJson =
                        removeMarkdownCodeFence(
                            result
                        )

                    JSONObject().apply {
                        put(
                            "requestId",
                            requestId
                        )

                        put(
                            "success",
                            true
                        )

                        put(
                            "plan",
                            JSONObject(cleanJson)
                        )
                    }
                } catch (error: Throwable) {
                    Log.e(
                        TAG,
                        "Workout-plan generation failed",
                        error
                    )

                    errorResponse(
                        requestId,
                        describeError(error)
                    )
                } finally {
                    requestInProgress.set(
                        false
                    )
                }

            callJavaScript(
                "window.onWorkoutPlanGenerated",
                response
            )
        }
    }

    @JavascriptInterface
    fun generateMealPlan(
        requestId: String,
        profileJson: String,
        recipeLibraryJson: String,
        pantryJson: String,
        numberOfDays: Int
    ) {
        if (
            !requestInProgress.compareAndSet(
                false,
                true
            )
        ) {
            callJavaScript(
                "window.onMealPlanGenerated",
                errorResponse(
                    requestId,
                    "Another AI request is already running"
                )
            )

            return
        }

        scope.launch {
            val response =
                try {
                    val profile =
                        requireNotNull(
                            parseUserProfile(
                                profileJson
                            )
                        ) {
                            "User profile is required"
                        }

                    val result =
                        aiManager.createMealPlan(
                            profile =
                                profile,

                            recipeLibraryJson =
                                recipeLibraryJson,

                            pantryJson =
                                pantryJson,

                            numberOfDays =
                                numberOfDays
                        )

                    val cleanJson =
                        removeMarkdownCodeFence(
                            result
                        )

                    JSONObject().apply {
                        put(
                            "requestId",
                            requestId
                        )

                        put(
                            "success",
                            true
                        )

                        put(
                            "plan",
                            JSONObject(cleanJson)
                        )
                    }
                } catch (error: Throwable) {
                    Log.e(
                        TAG,
                        "Meal-plan generation failed",
                        error
                    )

                    errorResponse(
                        requestId,
                        describeError(error)
                    )
                } finally {
                    requestInProgress.set(
                        false
                    )
                }

            callJavaScript(
                "window.onMealPlanGenerated",
                response
            )
        }
    }

    private fun parseUserProfile(
        json: String
    ): UserProfile? {
        if (json.isBlank()) {
            return null
        }

        val item =
            JSONObject(json)

        return UserProfile(
            name =
                item.optNullableString(
                    "name"
                ),

            age =
                item.optNullableInt(
                    "age"
                ),

            heightCm =
                item.optNullableDouble(
                    "heightCm"
                ),

            weightKg =
                item.optNullableDouble(
                    "weightKg"
                ),

            primaryGoal =
                item.optNullableString(
                    "primaryGoal"
                ),

            experienceLevel =
                item.optNullableString(
                    "experienceLevel"
                ),

            trainingDaysPerWeek =
                item.optNullableInt(
                    "trainingDaysPerWeek"
                ),

            workoutDurationMinutes =
                item.optNullableInt(
                    "workoutDurationMinutes"
                ),

            equipment =
                item.optStringList(
                    "equipment"
                ),

            limitations =
                item.optStringList(
                    "limitations"
                ),

            dietaryPreference =
                item.optNullableString(
                    "dietaryPreference"
                ),

            allergies =
                item.optStringList(
                    "allergies"
                ),

            dislikedFoods =
                item.optStringList(
                    "dislikedFoods"
                ),

            calorieTarget =
                item.optNullableInt(
                    "calorieTarget"
                ),

            proteinTargetGrams =
                item.optNullableInt(
                    "proteinTargetGrams"
                ),

            groceryBudget =
                item.optNullableString(
                    "groceryBudget"
                ),

            cookingLevel =
                item.optNullableString(
                    "cookingLevel"
                )
        ).validated()
    }

    private fun errorResponse(
        requestId: String,
        error: String
    ): JSONObject {
        return JSONObject().apply {
            put(
                "requestId",
                requestId
            )

            put(
                "success",
                false
            )

            put(
                "error",
                error
            )
        }
    }

    private fun describeError(
        error: Throwable
    ): String {
        return buildString {
            append(
                error.javaClass.simpleName
            )

            append(": ")

            append(
                error.message
                    ?: "No error message"
            )

            error.cause?.let { cause ->
                append(" | Cause: ")
                append(
                    cause.javaClass.simpleName
                )
                append(": ")
                append(
                    cause.message
                        ?: "No cause message"
                )
            }
        }
    }

    private fun callJavaScript(
        functionName: String,
        payload: JSONObject
    ) {
        webView.post {
            if (!webView.isAttachedToWindow) {
                return@post
            }

            val script =
                "$functionName(${payload});"

            webView.evaluateJavascript(
                script,
                null
            )
        }
    }

    private fun removeMarkdownCodeFence(
        value: String
    ): String {
        return value
            .trim()
            .replace(
                Regex(
                    "^```(?:json)?\\s*",
                    RegexOption.IGNORE_CASE
                ),
                ""
            )
            .replace(
                Regex("\\s*```$"),
                ""
            )
            .trim()
    }

    fun close() {
        scope.cancel()
    }

    companion object {
        private const val TAG =
            "AlignaGemma"
    }
}

private fun JSONObject.optNullableString(
    key: String
): String? {
    if (
        !has(key) ||
        isNull(key)
    ) {
        return null
    }

    return optString(key)
        .trim()
        .takeIf(String::isNotBlank)
}

private fun JSONObject.optNullableInt(
    key: String
): Int? {
    if (
        !has(key) ||
        isNull(key)
    ) {
        return null
    }

    val value =
        opt(key)

    return when (value) {
        is Number ->
            value.toInt()

        is String ->
            value.toIntOrNull()

        else ->
            null
    }
}

private fun JSONObject.optNullableDouble(
    key: String
): Double? {
    if (
        !has(key) ||
        isNull(key)
    ) {
        return null
    }

    val value =
        opt(key)

    return when (value) {
        is Number ->
            value.toDouble()

        is String ->
            value.toDoubleOrNull()

        else ->
            null
    }
}

private fun JSONObject.optStringList(
    key: String
): List<String> {
    val array: JSONArray =
        optJSONArray(key)
            ?: return emptyList()

    return buildList {
        for (
        index in 0 until array.length()
        ) {
            val value =
                array
                    .optString(index)
                    .trim()

            if (value.isNotBlank()) {
                add(value)
            }
        }
    }
}