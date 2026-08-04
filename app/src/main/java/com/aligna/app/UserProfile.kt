package com.aligna.app

data class UserProfile(
    val name: String? = null,
    val age: Int? = null,

    val heightCm: Double? = null,
    val weightKg: Double? = null,

    val primaryGoal: String? = null,
    val experienceLevel: String? = null,

    val trainingDaysPerWeek: Int? = null,
    val workoutDurationMinutes: Int? = null,

    val equipment: List<String> =
        emptyList(),

    val limitations: List<String> =
        emptyList(),

    val dietaryPreference: String? = null,

    val allergies: List<String> =
        emptyList(),

    val dislikedFoods: List<String> =
        emptyList(),

    val calorieTarget: Int? = null,
    val proteinTargetGrams: Int? = null,

    val groceryBudget: String? = null,
    val cookingLevel: String? = null
) {

    fun validated(): UserProfile {
        return copy(
            age =
                age?.takeIf {
                    it in 13..120
                },

            heightCm =
                heightCm?.takeIf {
                    it in 100.0..250.0
                },

            weightKg =
                weightKg?.takeIf {
                    it in 25.0..350.0
                },

            trainingDaysPerWeek =
                trainingDaysPerWeek?.takeIf {
                    it in 1..7
                },

            workoutDurationMinutes =
                workoutDurationMinutes?.takeIf {
                    it in 10..180
                },

            calorieTarget =
                calorieTarget?.takeIf {
                    it in 800..7000
                },

            proteinTargetGrams =
                proteinTargetGrams?.takeIf {
                    it in 10..400
                },

            equipment =
                cleanList(equipment),

            limitations =
                cleanList(limitations),

            allergies =
                cleanList(allergies),

            dislikedFoods =
                cleanList(dislikedFoods)
        )
    }

    private fun cleanList(
        values: List<String>
    ): List<String> {
        return values
            .map(String::trim)
            .filter(String::isNotBlank)
            .distinct()
            .take(30)
    }
}