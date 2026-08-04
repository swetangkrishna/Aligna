package com.aligna.app

object AiSafety {

    private val urgentTerms =
        listOf(
            "face drooping",
            "facial drooping",
            "one sided weakness",
            "one-sided weakness",
            "chest pain",
            "cannot breathe",
            "can't breathe",
            "difficulty breathing",
            "loss of consciousness",
            "passed out",
            "fainted",
            "severe bleeding",
            "stroke symptoms"
        )

    private val severePainTerms =
        listOf(
            "severe pain",
            "sharp chest pain",
            "bone sticking out",
            "cannot put weight on",
            "can't put weight on"
        )

    fun urgentResponse(
        question: String
    ): String? {
        val normalised =
            question
                .lowercase()
                .replace(
                    Regex("\\s+"),
                    " "
                )

        val urgent =
            urgentTerms.any {
                normalised.contains(it)
            } ||
                    severePainTerms.any {
                        normalised.contains(it)
                    }

        if (!urgent) {
            return null
        }

        return """
This may need urgent medical assessment. Do not rely on exercise, facial routines, or chatbot advice for these symptoms. Stop the activity and contact the appropriate emergency medical service or seek urgent medical care now.
        """.trimIndent()
    }

    fun validateQuestion(
        question: String
    ) {
        require(
            question.isNotBlank()
        ) {
            "Question cannot be empty"
        }

        require(
            question.length <= 2_000
        ) {
            "Question is too long"
        }
    }
}