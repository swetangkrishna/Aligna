package com.aligna.app

data class WorkoutPlanProposal(
    val planName: String,
    val goal: String,
    val days: List<WorkoutDayProposal>,
    val notes: List<String>,
    val requiresConfirmation: Boolean = true
)

data class WorkoutDayProposal(
    val day: String,
    val type: String,
    val estimatedMinutes: Int,
    val exercises: List<PlannedExercise>
)

data class PlannedExercise(
    val exerciseId: String,
    val name: String,
    val sets: Int?,
    val repetitions: String?,
    val durationSeconds: Int?,
    val restSeconds: Int,
    val reason: String
)