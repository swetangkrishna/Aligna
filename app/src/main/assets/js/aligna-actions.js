(() => {
  const supportedActions = new Set([
    "navigate_to_page",
    "save_workout_plan",
    "save_meal_plan",
    "replace_meal",
    "add_grocery_item",
    "remove_grocery_item",
    "schedule_reminder",
    "mark_workout_complete",
    "update_user_goal"
  ]);

  const stateChangingActions = new Set([
    "save_workout_plan",
    "save_meal_plan",
    "replace_meal",
    "add_grocery_item",
    "remove_grocery_item",
    "schedule_reminder",
    "mark_workout_complete",
    "update_user_goal"
  ]);

  function validateAction(action) {
    if (!action || typeof action !== "object") {
      throw new Error("Invalid AI action");
    }

    if (!supportedActions.has(action.type)) {
      throw new Error(
        `Unsupported AI action: ${action.type}`
      );
    }

    const payload =
      action.payload &&
      typeof action.payload === "object"
        ? action.payload
        : {};

    return {
      type: action.type,
      payload,
      requiresConfirmation:
        action.requires_confirmation !== false &&
        stateChangingActions.has(action.type)
    };
  }

  function dispatchAppAction(
    eventName,
    payload
  ) {
    window.dispatchEvent(
      new CustomEvent(
        eventName,
        {
          detail: payload
        }
      )
    );

    return {
      status: "completed",
      event: eventName
    };
  }

  function navigateToPage(payload) {
    const page =
      String(payload.page || "")
        .trim()
        .toLowerCase();

    if (!page) {
      throw new Error(
        "Navigation action has no page"
      );
    }

    window.dispatchEvent(
      new CustomEvent(
        "aligna-navigate",
        {
          detail: {
            page
          }
        }
      )
    );

    return {
      status: "completed",
      page
    };
  }

  async function executeConfirmedAction(
    action
  ) {
    const validated =
      validateAction(action);

    switch (validated.type) {
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
          `No executor for ${validated.type}`
        );
    }
  }

  async function executeAction(action) {
    const validated =
      validateAction(action);

    if (validated.requiresConfirmation) {
      window.dispatchEvent(
        new CustomEvent(
          "aligna-ai-action-confirmation",
          {
            detail: validated
          }
        )
      );

      return {
        status: "confirmation_required",
        action: validated
      };
    }

    return executeConfirmedAction(
      validated
    );
  }

  window.AlignaActions = {
    validateAction,
    executeAction,
    executeConfirmedAction
  };
})();(() => {
    const supportedActions = new Set([
      "navigate_to_page",
      "save_workout_plan",
      "save_meal_plan",
      "replace_meal",
      "add_grocery_item",
      "remove_grocery_item",
      "schedule_reminder",
      "mark_workout_complete",
      "update_user_goal"
    ]);
  
    const stateChangingActions = new Set([
      "save_workout_plan",
      "save_meal_plan",
      "replace_meal",
      "add_grocery_item",
      "remove_grocery_item",
      "schedule_reminder",
      "mark_workout_complete",
      "update_user_goal"
    ]);
  
    function validateAction(action) {
      if (!action || typeof action !== "object") {
        throw new Error("Invalid AI action");
      }
  
      if (!supportedActions.has(action.type)) {
        throw new Error(
          `Unsupported AI action: ${action.type}`
        );
      }
  
      const payload =
        action.payload &&
        typeof action.payload === "object"
          ? action.payload
          : {};
  
      return {
        type: action.type,
        payload,
        requiresConfirmation:
          action.requires_confirmation !== false &&
          stateChangingActions.has(action.type)
      };
    }
  
    function dispatchAppAction(
      eventName,
      payload
    ) {
      window.dispatchEvent(
        new CustomEvent(
          eventName,
          {
            detail: payload
          }
        )
      );
  
      return {
        status: "completed",
        event: eventName
      };
    }
  
    function navigateToPage(payload) {
      const page =
        String(payload.page || "")
          .trim()
          .toLowerCase();
  
      if (!page) {
        throw new Error(
          "Navigation action has no page"
        );
      }
  
      window.dispatchEvent(
        new CustomEvent(
          "aligna-navigate",
          {
            detail: {
              page
            }
          }
        )
      );
  
      return {
        status: "completed",
        page
      };
    }
  
    async function executeConfirmedAction(
      action
    ) {
      const validated =
        validateAction(action);
  
      switch (validated.type) {
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
            `No executor for ${validated.type}`
          );
      }
    }
  
    async function executeAction(action) {
      const validated =
        validateAction(action);
  
      if (validated.requiresConfirmation) {
        window.dispatchEvent(
          new CustomEvent(
            "aligna-ai-action-confirmation",
            {
              detail: validated
            }
          )
        );
  
        return {
          status: "confirmation_required",
          action: validated
        };
      }
  
      return executeConfirmedAction(
        validated
      );
    }
  
    window.AlignaActions = {
      validateAction,
      executeAction,
      executeConfirmedAction
    };
  })();