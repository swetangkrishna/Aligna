(() => {
  const supportedActions =
    new Set([
      "navigate_to_page",
      "save_workout_plan",
      "save_meal_plan",
      "replace_meal",

      "add_grocery_item",
      "remove_grocery_item",

      "add_kitchen_item",
      "remove_kitchen_item",
      "mark_grocery_as_owned",

      "schedule_reminder",
      "mark_workout_complete",
      "update_user_goal"
    ]);

  const stateChangingActions =
    new Set([
      "save_workout_plan",
      "save_meal_plan",
      "replace_meal",

      "add_grocery_item",
      "remove_grocery_item",

      "add_kitchen_item",
      "remove_kitchen_item",
      "mark_grocery_as_owned",

      "schedule_reminder",
      "mark_workout_complete",
      "update_user_goal"
    ]);

  function debug(
    stage,
    data = {}
  ){
    window.dispatchEvent(
      new CustomEvent(
        "aligna-debug",
        {
          detail: {
            source:
              "aligna-actions",

            stage,
            timestamp:
              new Date()
                .toISOString(),

            data
          }
        }
      )
    );

    console.log(
      `[AlignaActions] ${stage}`,
      data
    );
  }

  function validateAction(action){
    debug(
      "validate-input",
      action
    );

    if(
      !action ||
      typeof action !==
        "object"
    ){
      throw new Error(
        "Invalid AI action"
      );
    }

    const type =
      String(
        action.type || ""
      ).trim();

    if(
      !supportedActions.has(
        type
      )
    ){
      throw new Error(
        `Unsupported AI action: ${type}`
      );
    }

    const payload =
      action.payload &&
      typeof action.payload ===
        "object"
        ? action.payload
        : {};

    const validated = {
      type,
      payload,

      requiresConfirmation:
        action.requires_confirmation !==
          false &&
        stateChangingActions.has(
          type
        )
    };

    debug(
      "validate-success",
      validated
    );

    return validated;
  }

  function dispatchAppAction(
    eventName,
    payload
  ){
    debug(
      "dispatch-event",
      {
        eventName,
        payload
      }
    );

    window.dispatchEvent(
      new CustomEvent(
        eventName,
        {
          detail: payload
        }
      )
    );

    return {
      status:
        "completed",

      event:
        eventName
    };
  }

  function navigateToPage(
    payload
  ){
    const page =
      String(
        payload.page || ""
      )
        .trim()
        .toLowerCase();

    if(!page){
      throw new Error(
        "Navigation action has no page"
      );
    }

    return dispatchAppAction(
      "aligna-navigate",
      {
        page
      }
    );
  }

  async function executeConfirmedAction(
    action
  ){
    const validated =
      validateAction(
        action
      );

    debug(
      "execute-confirmed",
      validated
    );

    switch(
      validated.type
    ){
      case "navigate_to_page":
        return navigateToPage(
          validated.payload
        );

      case "save_workout_plan":
        return dispatchAppAction(
          "aligna-save-workout-plan",
          validated.payload
        );

      case "save_meal_plan":
        return dispatchAppAction(
          "aligna-save-meal-plan",
          validated.payload
        );

      case "replace_meal":
        return dispatchAppAction(
          "aligna-replace-meal",
          validated.payload
        );

      case "add_grocery_item":
        return dispatchAppAction(
          "aligna-add-grocery-item",
          validated.payload
        );

      case "remove_grocery_item":
        return dispatchAppAction(
          "aligna-remove-grocery-item",
          validated.payload
        );

      case "add_kitchen_item":
        return dispatchAppAction(
          "aligna-add-kitchen-item",
          validated.payload
        );

      case "remove_kitchen_item":
        return dispatchAppAction(
          "aligna-remove-kitchen-item",
          validated.payload
        );

      case "mark_grocery_as_owned":
        return dispatchAppAction(
          "aligna-mark-grocery-owned",
          validated.payload
        );

      case "schedule_reminder":
        return dispatchAppAction(
          "aligna-schedule-reminder",
          validated.payload
        );

      case "mark_workout_complete":
        return dispatchAppAction(
          "aligna-complete-workout",
          validated.payload
        );

      case "update_user_goal":
        return dispatchAppAction(
          "aligna-update-user-goal",
          validated.payload
        );

      default:
        throw new Error(
          `No executor for ${
            validated.type
          }`
        );
    }
  }

  async function executeAction(
    action
  ){
    const validated =
      validateAction(
        action
      );

    debug(
      "execute-action",
      validated
    );

    if(
      validated
        .requiresConfirmation
    ){
      window.dispatchEvent(
        new CustomEvent(
          "aligna-ai-action-confirmation",
          {
            detail:
              validated
          }
        )
      );

      return {
        status:
          "confirmation_required",

        action:
          validated
      };
    }

    return executeConfirmedAction(
      validated
    );
  }

  window.AlignaActions = {
    validateAction,
    executeAction,
    executeConfirmedAction,

    supportedActions:
      Array.from(
        supportedActions
      )
  };
})();
