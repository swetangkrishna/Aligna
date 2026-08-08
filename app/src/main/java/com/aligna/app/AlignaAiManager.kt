package com.aligna.app

import android.content.Context
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import com.aligna.app.ai.AiProvider
import com.aligna.app.ai.AiProviderFactory

class AlignaAiManager(
    context: Context
) : AutoCloseable {

    private val provider: AiProvider =
        AiProviderFactory.create(
            context.applicationContext
        )

    suspend fun initialize() {
        provider.initialize()
    }

    suspend fun answerQuestion(
        question: String,
        profile: UserProfile?,
        appContext: String,
        retrievedKnowledge: String
    ): String {
        AiSafety.validateQuestion(
            question
        )

        AiSafety
            .urgentResponse(question)
            ?.let {
                return it
            }

        /*
         * Prevent accidental enormous prompts from exhausting the
         * model context or device memory.
         */
        val safeContext =
            appContext
                .trim()
                .take(MAX_CONTEXT_CHARACTERS)

        val safeKnowledge =
            retrievedKnowledge
                .trim()
                .take(MAX_KNOWLEDGE_CHARACTERS)

        val validatedProfile =
            profile?.validated()

        val systemPrompt =
            AlignaPromptBuilder
                .queryAnsweringSystemPrompt(
                    profile =
                        validatedProfile,

                    appContext =
                        safeContext
                )

        val userPrompt =
            buildString {
                appendLine(
                    "Relevant records retrieved from Aligna:"
                )

                appendLine(
                    if (safeKnowledge.isBlank()) {
                        """{"relevantMeals":[],"relevantExercises":[]}"""
                    } else {
                        safeKnowledge
                    }
                )

                appendLine()
                appendLine(
                    "User question:"
                )

                appendLine(
                    question.trim()
                )

                appendLine()
                appendLine(
    "Answer using the retrieved records when they are relevant."
)

appendLine(
    "If those records do not support a specific claim, say that the information is unavailable."
)

appendLine()
appendLine(
    "Return ONLY valid JSON using this exact structure:"
)

appendLine(
    """
{
  "message": "A short natural-language response for the user.",
  "action": null
}
    """.trimIndent()
)

appendLine()
appendLine(
    "When the user explicitly asks Aligna to change app data, action may contain exactly one supported action."
)

appendLine(
    "Supported action types are:"
)

appendLine(
    """
- add_grocery_item
- remove_grocery_item
- add_kitchen_item
- remove_kitchen_item
- mark_grocery_as_owned
- save_workout_plan
- save_meal_plan
- replace_meal
- schedule_reminder
- mark_workout_complete
- update_user_goal
- navigate_to_page
    """.trimIndent()
)

appendLine()
appendLine(
    "For a state-changing action use:"
)

appendLine(
    """
{
  "message": "I can add six bananas to your grocery list.",
  "action": {
    "type": "add_grocery_item",
    "requires_confirmation": true,
    "payload": {
      "name": "Bananas",
      "quantity": "6"
    }
  }
}
    """.trimIndent()
)

appendLine()
appendLine(
    "KITCHEN INVENTORY ACTION RULES:"
)

appendLine(
    "Kitchen inventory contains food the user already owns or has at home."
)

appendLine(
    "The grocery list contains food the user still needs to buy."
)

appendLine(
    "Use add_kitchen_item when the user asks to add an item to kitchen inventory or says they already have the item."
)

appendLine(
    "Use remove_kitchen_item when the user asks to remove an item from kitchen inventory."
)

appendLine(
    "Use mark_grocery_as_owned when an item on the grocery list is already available at home."
)

appendLine(
    "Never use add_grocery_item or remove_grocery_item for a request that explicitly mentions kitchen inventory, pantry, already owned, or already at home."
)

appendLine(
    "For explicit app-data changes, action must not be null."
)

appendLine(
    """
Examples:

User: "Add eggs to my kitchen inventory."

{
  "message": "I can add eggs to your kitchen inventory.",
  "action": {
    "type": "add_kitchen_item",
    "requires_confirmation": true,
    "payload": {
      "name": "Eggs",
      "quantity": "",
      "category": "Kitchen"
    }
  }
}

User: "Remove eggs from my kitchen inventory."

{
  "message": "I can remove eggs from your kitchen inventory.",
  "action": {
    "type": "remove_kitchen_item",
    "requires_confirmation": true,
    "payload": {
      "name": "Eggs"
    }
  }
}

User: "I already have bread."

{
  "message": "I can mark bread as already available at home.",
  "action": {
    "type": "mark_grocery_as_owned",
    "requires_confirmation": true,
    "payload": {
      "name": "Bread",
      "quantity": "",
      "category": "Cupboard"
    }
  }
}

User: "Add bread to my grocery list."

{
  "message": "I can add bread to your grocery list.",
  "action": {
    "type": "add_grocery_item",
    "requires_confirmation": true,
    "payload": {
      "name": "Bread",
      "quantity": ""
    }
  }
}
    """.trimIndent()
)

appendLine()
appendLine(
    "WORKOUT PLAN ACTION RULES:"
)

appendLine(
    "For save_workout_plan, use only exercises present in retrievedKnowledge."
)

appendLine(
    "Use permanent exercise IDs in each day's exercises array."
)

appendLine(
    "Do not invent exercise IDs."
)

appendLine(
    """
Example:
{
  "message": "I created a three-day beginner strength plan.",
  "action": {
    "type": "save_workout_plan",
    "requires_confirmation": true,
    "payload": {
      "planName": "Three-day beginner strength",
      "days": [
        {
          "day": "Monday",
          "title": "Full body strength",
          "estimatedMinutes": 40,
          "exercises": [
            {
              "id": "goblet_squat",
              "sets": 3,
              "repetitions": "8"
            },
            {
              "id": "pushup_or_dumbbell_bench_press",
              "sets": 3,
              "repetitions": "8"
            }
          ]
        }
      ]
    }
  }
}
    """.trimIndent()
)

appendLine()
appendLine(
    "NAVIGATION ACTION RULES:"
)

appendLine(
    "When the user asks to open, show, view, or go to an app section, return navigate_to_page."
)

appendLine(
    "Valid navigation pages are: today, ideas, train, face, progress, personalised."
)

appendLine(
    """
Examples:

User: "Show my grocery list."
Action:
{
  "type": "navigate_to_page",
  "requires_confirmation": false,
  "payload": {
    "page": "ideas"
  }
}

User: "Open my workout."
Action:
{
  "type": "navigate_to_page",
  "requires_confirmation": false,
  "payload": {
    "page": "train"
  }
}

User: "Show my personalised plan."
Action:
{
  "type": "navigate_to_page",
  "requires_confirmation": false,
  "payload": {
    "page": "personalised"
  }
}
    """.trimIndent()
)

appendLine(
    "Navigation actions must not require confirmation."
)

appendLine()
appendLine(
    "MEAL PLAN ACTION RULES:"
)

appendLine(
    "For save_meal_plan, use only meals that appear in retrievedKnowledge."
)

appendLine(
    "Return their permanent meal IDs in payload.mealIds."
)

appendLine(
    "Do not invent meal IDs."
)

appendLine(
    """
Example:
{
  "message": "I created a simple high-protein meal plan.",
  "action": {
    "type": "save_meal_plan",
    "requires_confirmation": true,
    "payload": {
      "planName": "High-protein starter plan",
      "mealIds": [
        "cheesy_scrambled_eggs",
        "rice_olive_oil_protein",
        "milk_protein_shake"
      ]
    }
  }
}
    """.trimIndent()
)
appendLine()
appendLine(
    "REMAINING ACTION RULES:"
)

appendLine(
    "Use replace_meal when the user asks to swap or replace a meal."
)

appendLine(
    "For replace_meal, provide currentMealId and replacementMealId using IDs from retrievedKnowledge."
)

appendLine(
    "Use schedule_reminder when the user asks for a reminder. Return minutesFromNow as a positive integer."
)

appendLine(
    "Use update_user_goal when the user explicitly changes their fitness goal."
)

appendLine(
    "Use mark_workout_complete only when the user explicitly asks to mark the selected or named workout complete."
)

appendLine(
    """
Examples:

{
  "message": "I can replace cheesy scrambled eggs with avocado toast and egg.",
  "action": {
    "type": "replace_meal",
    "requires_confirmation": true,
    "payload": {
      "currentMealId": "cheesy_scrambled_eggs",
      "replacementMealId": "avocado_toast_egg"
    }
  }
}

{
  "message": "I can remind you to train in 45 minutes.",
  "action": {
    "type": "schedule_reminder",
    "requires_confirmation": true,
    "payload": {
      "title": "Time to train",
      "message": "Your Aligna workout is ready.",
      "minutesFromNow": 45
    }
  }
}

{
  "message": "I can update your primary goal to muscle gain.",
  "action": {
    "type": "update_user_goal",
    "requires_confirmation": true,
    "payload": {
      "goal": "muscle gain"
    }
  }
}

{
  "message": "I can mark your selected workout complete.",
  "action": {
    "type": "mark_workout_complete",
    "requires_confirmation": true,
    "payload": {}
  }
}
    """.trimIndent()
)

appendLine()
appendLine(
    "KITCHEN INVENTORY ACTION RULES:"
)

appendLine(
    "Kitchen inventory means food the user already owns at home."
)

appendLine(
    "Grocery list means food the user still needs to buy."
)

appendLine(
    "Never use add_grocery_item when the user says they already have, own, possess, keep at home, or want to add something to their kitchen inventory."
)

appendLine(
    "Use add_kitchen_item when the user asks to add an item they already have at home."
)

appendLine(
    "Use remove_kitchen_item when the user asks to remove an item from kitchen inventory."
)

appendLine(
    "Use mark_grocery_as_owned when an existing grocery item should be moved into kitchen inventory."
)

appendLine(
    """
Examples:

User: "Add eggs to my kitchen inventory."
{
  "message": "I can add eggs to your kitchen inventory.",
  "action": {
    "type": "add_kitchen_item",
    "requires_confirmation": true,
    "payload": {
      "name": "Eggs",
      "quantity": "",
      "category": "Kitchen"
    }
  }
}

User: "I already have bread."
{
  "message": "I can mark bread as already available at home.",
  "action": {
    "type": "mark_grocery_as_owned",
    "requires_confirmation": true,
    "payload": {
      "name": "Bread",
      "quantity": "",
      "category": "Cupboard"
    }
  }
}

User: "Add bread to my shopping list."
{
  "message": "I can add bread to your grocery list.",
  "action": {
    "type": "add_grocery_item",
    "requires_confirmation": true,
    "payload": {
      "name": "Bread",
      "quantity": ""
    }
  }
}

User: "Remove eggs from my kitchen inventory."
{
  "message": "I can remove eggs from your kitchen inventory.",
  "action": {
    "type": "remove_kitchen_item",
    "requires_confirmation": true,
    "payload": {
      "name": "Eggs"
    }
  }
}
    """.trimIndent()
)

appendLine()
appendLine(
    "KITCHEN QUANTITY RULES:"
)

appendLine(
    "Use kitchenInventory to determine what the user already has at home."
)

appendLine(
    "Use groceryRequirements to determine what the user still needs to buy."
)

appendLine(
    "Do not tell the user to buy an item when groceryRequirements shows that no additional amount is needed."
)

appendLine(
    "When quantities are available, distinguish between having some of an ingredient and having enough."
)

appendLine(
    "Do not assume that simply owning an ingredient means there is enough for every planned meal."
)

appendLine()
appendLine(
    "Never invent unsupported action types."
)

appendLine(
    "Use action null when the user only asks a question or requests advice."
)

appendLine(
    "Do not return action null when the user explicitly asks to add, remove, save, replace, update, mark, schedule, move, or navigate."
)

appendLine(
    "The natural-language message must describe the proposed change in future or conditional language before confirmation."
)

appendLine(
    "Do not claim that a state-changing action has already completed inside the model response."
)
appendLine(
    "Do not include Markdown fences, commentary, or text outside the JSON object."
)
            }

        Log.d(
            TAG,
            buildString {
                append("prompt sizes: system=")
                append(systemPrompt.length)
                append(", user=")
                append(userPrompt.length)
                append(", context=")
                append(safeContext.length)
                append(", knowledge=")
                append(safeKnowledge.length)
            }
        )

        return provider.generate(
            systemInstruction =
                systemPrompt,

            userMessage =
                userPrompt,

            temperature =
                0.2
        )
    }

    suspend fun createWorkoutPlan(
        profile: UserProfile,
        allowedExercisesJson: String
    ): String {
        val validatedProfile =
            profile.validated()

        validateWorkoutProfile(
            validatedProfile
        )

        val safeExercises =
            allowedExercisesJson
                .trim()
                .take(
                    MAX_PLAN_LIBRARY_CHARACTERS
                )

        val request =
            """
User profile:
${profileAsJson(validatedProfile)}

Allowed exercises:
$safeExercises

Return this JSON structure:
{
  "planName": "string",
  "goal": "string",
  "days": [
    {
      "day": "string",
      "type": "training or rest",
      "estimatedMinutes": 45,
      "exercises": [
        {
          "exerciseId": "existing exercise ID",
          "sets": 3,
          "repetitions": "8-10",
          "durationSeconds": null,
          "restSeconds": 90,
          "reason": "string"
        }
      ]
    }
  ],
  "notes": ["string"],
  "requiresConfirmation": true
}
            """.trimIndent()

        return provider.generate(
            systemInstruction =
                AlignaPromptBuilder
                    .workoutPlanSystemPrompt(),

            userMessage =
                request,

            temperature =
                0.1
        )
    }

    suspend fun createMealPlan(
        profile: UserProfile,
        recipeLibraryJson: String,
        pantryJson: String,
        numberOfDays: Int
    ): String {
        require(
            numberOfDays in 1..7
        ) {
            "Meal-plan duration must be between 1 and 7 days"
        }

        val validatedProfile =
            profile.validated()

        val request =
            """
User profile:
${profileAsJson(validatedProfile)}

Number of days:
$numberOfDays

Available recipes:
${recipeLibraryJson.take(MAX_PLAN_LIBRARY_CHARACTERS)}

Current pantry:
${pantryJson.take(MAX_PANTRY_CHARACTERS)}

Return this JSON structure:
{
  "days": [
    {
      "day": "string",
      "mealIds": ["existing recipe ID"]
    }
  ],
  "grocerySections": [
    {
      "section": "string",
      "items": [
        {
          "name": "string",
          "quantity": "string"
        }
      ]
    }
  ],
  "notes": ["string"],
  "requiresConfirmation": true
}
            """.trimIndent()

        return provider.generate(
            systemInstruction =
                AlignaPromptBuilder
                    .mealPlanSystemPrompt(),

            userMessage =
                request,

            temperature =
                0.1
        )
    }

    private fun validateWorkoutProfile(
        profile: UserProfile
    ) {
        require(
            !profile.primaryGoal.isNullOrBlank()
        ) {
            "Primary goal is required"
        }

        require(
            !profile.experienceLevel.isNullOrBlank()
        ) {
            "Experience level is required"
        }

        require(
            profile.trainingDaysPerWeek != null &&
                    profile.trainingDaysPerWeek in 1..6
        ) {
            "Training days must be between 1 and 6"
        }

        require(
            profile.workoutDurationMinutes != null &&
                    profile.workoutDurationMinutes in 15..120
        ) {
            "Workout duration must be between 15 and 120 minutes"
        }

        require(
            profile.equipment.isNotEmpty()
        ) {
            "Available equipment is required"
        }
    }

    private fun profileAsJson(
        profile: UserProfile
    ): String {
        return JSONObject().apply {
            putNullable(
                "name",
                profile.name
            )

            putNullable(
                "age",
                profile.age
            )

            putNullable(
                "heightCm",
                profile.heightCm
            )

            putNullable(
                "weightKg",
                profile.weightKg
            )

            putNullable(
                "primaryGoal",
                profile.primaryGoal
            )

            putNullable(
                "experienceLevel",
                profile.experienceLevel
            )

            putNullable(
                "trainingDaysPerWeek",
                profile.trainingDaysPerWeek
            )

            putNullable(
                "workoutDurationMinutes",
                profile.workoutDurationMinutes
            )

            put(
                "equipment",
                JSONArray(profile.equipment)
            )

            put(
                "limitations",
                JSONArray(profile.limitations)
            )

            putNullable(
                "dietaryPreference",
                profile.dietaryPreference
            )

            put(
                "allergies",
                JSONArray(profile.allergies)
            )

            put(
                "dislikedFoods",
                JSONArray(profile.dislikedFoods)
            )

            putNullable(
                "calorieTarget",
                profile.calorieTarget
            )

            putNullable(
                "proteinTargetGrams",
                profile.proteinTargetGrams
            )

            putNullable(
                "groceryBudget",
                profile.groceryBudget
            )

            putNullable(
                "cookingLevel",
                profile.cookingLevel
            )
        }.toString()
    }

    fun backend(): String {
        return provider.providerName()
    }

    fun isInitialized(): Boolean {
        return provider.isInitialized()
    }

    override fun close() {
        provider.close()
    }

    private fun JSONObject.putNullable(
        key: String,
        value: Any?
    ) {
        if (value == null) {
            put(
                key,
                JSONObject.NULL
            )
        } else {
            put(
                key,
                value
            )
        }
    }

    companion object {
        private const val TAG =
            "AlignaGemma"

        private const val MAX_CONTEXT_CHARACTERS =
            8_000

        private const val MAX_KNOWLEDGE_CHARACTERS =
            14_000

        private const val MAX_PLAN_LIBRARY_CHARACTERS =
            30_000

        private const val MAX_PANTRY_CHARACTERS =
            10_000
    }
}