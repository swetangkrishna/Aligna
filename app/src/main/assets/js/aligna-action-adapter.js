(() => {
    const STORAGE_KEY =
      "aligna_personalised_recommendations_v1";

    function readPersonalisedState() {
      try {
        const raw =
          localStorage.getItem(STORAGE_KEY);

        if (!raw) {
          return {
            meals: null,
            workout: null,
            groceries: []
          };
        }

        const parsed = JSON.parse(raw);

        return {
          meals:
            parsed.meals &&
            typeof parsed.meals === "object"
              ? parsed.meals
              : null,

          workout:
            parsed.workout &&
            typeof parsed.workout === "object"
              ? parsed.workout
              : null,

          groceries:
            Array.isArray(parsed.groceries)
              ? parsed.groceries
              : []
        };
      } catch (error) {
        console.error(
          "Could not read personalised state",
          error
        );

        return {
          meals: null,
          workout: null,
          groceries: []
        };
      }
    }

    function writePersonalisedState(state) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
      );

      window.dispatchEvent(
        new CustomEvent(
          "aligna-personalised-state-changed",
          {
            detail: state
          }
        )
      );
    }

    function currentState() {
      return readPersonalisedState();
    }

    function normaliseText(value) {
      return String(value || "")
        .trim()
        .replace(/\s+/g, " ");
    }

    function showToast(message) {
      let toast =
        document.getElementById(
          "aligna-action-toast"
        );

      if (!toast) {
        toast =
          document.createElement("div");

        toast.id = "aligna-action-toast";
        toast.className =
          "aligna-action-toast";

        document.body.appendChild(toast);
      }

      toast.textContent = message;
      toast.classList.add("visible");

      window.clearTimeout(
        showToast.timeoutId
      );

      showToast.timeoutId =
        window.setTimeout(
          () => {
            toast.classList.remove(
              "visible"
            );
          },
          2600
        );
    }

    function findNavigationTarget(page) {
      const pageAliases = {
        home: [
          "home",
          "today"
        ],

        meals: [
          "meal",
          "meals",
          "food"
        ],

        workouts: [
          "workout",
          "workouts",
          "gym",
          "training"
        ],

        progress: [
          "progress",
          "results"
        ],

        settings: [
          "settings",
          "profile"
        ],

        personalised: [
          "for you",
          "personalised",
          "personalized"
        ]
      };

      const aliases =
        pageAliases[page] || [page];

      const candidates =
        document.querySelectorAll(
          [
            "button",
            "a",
            "[data-page]",
            "[data-tab]",
            "[role='tab']"
          ].join(",")
        );

      return Array.from(candidates)
        .find(element => {
          const values = [
            element.textContent,
            element.dataset?.page,
            element.dataset?.tab,
            element.id,
            element.getAttribute(
              "aria-label"
            )
          ]
            .filter(Boolean)
            .map(value =>
              normaliseText(value)
                .toLowerCase()
            );

          return aliases.some(alias =>
            values.some(value =>
              value.includes(alias)
            )
          );
        });
    }

    function navigateTo(pageValue) {
      const page =
        normaliseText(pageValue)
          .toLowerCase();

      if (
        page === "personalised" ||
        page === "personalized" ||
        page === "for you"
      ) {
        openPersonalisedPage();
        return;
      }

      const target =
        findNavigationTarget(page);

      if (!target) {
        throw new Error(
          `Could not find page: ${page}`
        );
      }

      target.click();
    }

    function addGrocery(payload) {
      const name =
        normaliseText(
          payload.name ||
          payload.item
        );

      if (!name) {
        throw new Error(
          "Grocery item name is required"
        );
      }

      const quantity =
        normaliseText(
          payload.quantity
        );

      const state = currentState();

      const existing =
        state.groceries.find(
          item =>
            normaliseText(item.name)
              .toLowerCase() ===
            name.toLowerCase()
        );

      if (existing) {
        existing.quantity =
          quantity ||
          existing.quantity;
      } else {
        state.groceries.push({
          id:
            `grocery-${Date.now()}`,

          name,
          quantity:
            quantity || "",

          checked: false,
          source: "ai"
        });
      }

      writePersonalisedState(state);
      window.dispatchEvent(
        new CustomEvent(
          "aligna-main-state-refresh"
        )
      );
      renderPersonalisedPage();

      showToast(
        `${name} added to groceries`
      );
    }

    function removeGrocery(payload) {
      const name =
        normaliseText(
          payload.name ||
          payload.item
        );

      if (!name) {
        throw new Error(
          "Grocery item name is required"
        );
      }

      const state = currentState();

      state.groceries =
        state.groceries.filter(
          item =>
            normaliseText(item.name)
              .toLowerCase() !==
            name.toLowerCase()
        );

      writePersonalisedState(state);
      renderPersonalisedPage();

      showToast(
        `${name} removed from groceries`
      );
    }

    function saveMealPlan(payload) {
      const state = currentState();

      state.meals = {
        ...payload,
        savedAt:
          new Date().toISOString()
      };

      writePersonalisedState(state);
      renderPersonalisedPage();

      showToast(
        "Personalised meal plan saved"
      );
    }

    function saveWorkoutPlan(payload) {
      const state = currentState();

      state.workout = {
        ...payload,
        savedAt:
          new Date().toISOString()
      };

      writePersonalisedState(state);
      renderPersonalisedPage();

      showToast(
        "Personalised workout saved"
      );
    }

    function replaceMeal(payload) {
      const state = currentState();

      if (!state.meals) {
        state.meals = {
          days: []
        };
      }

      const replacements =
        Array.isArray(
          state.meals.replacements
        )
          ? state.meals.replacements
          : [];

      replacements.push({
        ...payload,
        replacedAt:
          new Date().toISOString()
      });

      state.meals.replacements =
        replacements;

      writePersonalisedState(state);
      renderPersonalisedPage();

      showToast("Meal updated");
    }

    function updateGoal(payload) {
      const state = currentState();

      state.goal = {
        ...payload,
        updatedAt:
          new Date().toISOString()
      };

      writePersonalisedState(state);
      renderPersonalisedPage();

      showToast("Goal updated");
    }

    function markWorkoutComplete(
      payload
    ) {
      const state = currentState();

      const completed =
        Array.isArray(
          state.completedWorkouts
        )
          ? state.completedWorkouts
          : [];

      completed.push({
        ...payload,
        completedAt:
          new Date().toISOString()
      });

      state.completedWorkouts =
        completed;

      writePersonalisedState(state);
      renderPersonalisedPage();

      showToast(
        "Workout marked complete"
      );
    }

    function scheduleReminder(payload) {
        const title =
          normaliseText(
            payload.title ||
            "Aligna reminder"
          );

        const text =
          normaliseText(
            payload.text ||
            payload.message ||
            payload.description ||
            "Time to check your Aligna plan."
          );

        const minutesRaw =
          payload.minutesFromNow ||
          payload.minutes_from_now ||
          payload.minutes ||
          payload.delayMinutes ||
          payload.delay_minutes ||
          30;

        const minutes =
          Number(
            minutesRaw
          );

        if(
          !Number.isFinite(minutes) ||
          minutes < 1
        ){
          throw new Error(
            "The reminder time is invalid."
          );
        }

        if(
          window.Android &&
          typeof window.Android
            .scheduleOneOff ===
            "function"
        ){
          window.Android.scheduleOneOff(
            Math.max(
              1,
              Math.min(
                10080,
                Math.round(minutes)
              )
            ),
            title,
            text
          );

          showToast(
            `Reminder set for ${
              Math.round(minutes)
            } minutes`
          );

          return;
        }

        throw new Error(
          "Device reminders are unavailable."
        );
      }

    function escapeHtml(value) {
      return String(value ?? "")
        .replace(
          /&/g,
          "&amp;"
        )
        .replace(
          /</g,
          "&lt;"
        )
        .replace(
          />/g,
          "&gt;"
        )
        .replace(
          /"/g,
          "&quot;"
        )
        .replace(
          /'/g,
          "&#039;"
        );
    }

    function planTitle(plan, fallback) {
      return normaliseText(
        plan?.name ||
        plan?.planName ||
        plan?.title ||
        fallback
      );
    }

    function mealSummary(plan) {
      if (!plan) {
        return {
          title:
            "No personalised meal plan yet",

          description:
            "Ask Aligna to build meals around your goals, preferences and schedule."
        };
      }

      const days =
        Array.isArray(plan.days)
          ? plan.days
          : [];

      const meals =
        Array.isArray(plan.meals)
          ? plan.meals
          : [];

      const count =
        meals.length ||
        days.reduce(
          (total, day) =>
            total +
            (
              Array.isArray(
                day.meals
              )
                ? day.meals.length
                : Array.isArray(
                    day.mealIds
                  )
                  ? day.mealIds.length
                  : 0
            ),
          0
        );

      return {
        title:
          planTitle(
            plan,
            "Your personalised meals"
          ),

        description:
          count > 0
            ? `${count} planned meal${
                count === 1 ? "" : "s"
              }`
            : "Saved from your Aligna assistant"
      };
    }

    function workoutSummary(plan) {
      if (!plan) {
        return {
          title:
            "No personalised workout yet",

          description:
            "Ask Aligna to create training around your goal, equipment and schedule."
        };
      }

      const days =
        Array.isArray(plan.days)
          ? plan.days
          : [];

      return {
        title:
          planTitle(
            plan,
            "Your personalised training"
          ),

        description:
          days.length > 0
            ? `${days.length}-day plan`
            : "Saved from your Aligna assistant"
      };
    }

    function ensurePersonalisedPage() {
      let overlay =
        document.getElementById(
          "personalised-page-overlay"
        );

      if (overlay) {
        return overlay;
      }

      overlay =
        document.createElement("div");

      overlay.id =
        "personalised-page-overlay";

      overlay.className =
        "personalised-page-overlay hidden";

      overlay.innerHTML = `
        <div class="personalised-page">
          <header class="personalised-header">
            <button
              id="personalised-close"
              class="personalised-back"
              type="button"
              aria-label="Close personalised page"
            >
              ←
            </button>

            <div>
              <p class="personalised-eyebrow">
                Made for you
              </p>

              <h2>Personalised</h2>
            </div>
          </header>

          <main
            id="personalised-page-content"
            class="personalised-content"
          ></main>
        </div>
      `;

      document.body.appendChild(
        overlay
      );

      overlay
        .querySelector(
          "#personalised-close"
        )
        .addEventListener(
          "click",
          closePersonalisedPage
        );

      return overlay;
    }

    function openAssistantWithPrompt(
      prompt
    ) {
      closePersonalisedPage();

      const input =
        document.getElementById(
          "aiQuestion"
        ) ||
        document.querySelector(
          [
            "#aiInput",
            ".ai-input input",
            ".ai-input textarea"
          ].join(",")
        );

      const opener =
        document.querySelector(
          [
            "#openAi",
            "[data-open-ai]",
            ".ai-fab",
            ".ask-ai"
          ].join(",")
        );

      if (opener) {
        opener.click();
      }

      window.setTimeout(
        () => {
          if (input) {
            input.value = prompt;

            input.dispatchEvent(
              new Event(
                "input",
                {
                  bubbles: true
                }
              )
            );

            input.focus();
          }
        },
        180
      );
    }

    function renderPersonalisedPage() {
      const overlay =
        ensurePersonalisedPage();

      const content =
        overlay.querySelector(
          "#personalised-page-content"
        );

      const state = currentState();

      const meal =
        mealSummary(state.meals);

      const workout =
        workoutSummary(
          state.workout
        );
        const kitchenItems =
  window.AlignaAppData &&
  typeof window
    .AlignaAppData
    .getKitchenInventory ===
    "function"
    ? window
        .AlignaAppData
        .getKitchenInventory()
    : [];
        const groceryItems =
        window.AlignaAppData &&
        typeof window
          .AlignaAppData
          .getCombinedGroceryItems ===
          "function"
          ? window
              .AlignaAppData
              .getCombinedGroceryItems()
          : state.groceries || [];

      content.innerHTML = `
        <section class="personalised-hero">
          <div>
            <p class="personalised-eyebrow">
              Your plan
            </p>

            <h3>
              Guidance that adapts to you
            </h3>

            <p>
              Meals, workouts and shopping
              suggestions based on your saved
              preferences.
            </p>
          </div>

          <div class="personalised-spark">
            ✦
          </div>
        </section>

        <section class="personalised-block">
          <div class="personalised-section-head">
            <div>
              <p class="personalised-eyebrow">
                Nutrition
              </p>

              <h3>
                Personalised meals
              </h3>
            </div>

            <button
              id="personalised-generate-meals"
              class="personalised-text-button"
              type="button"
            >
              ${
                state.meals
                  ? "Adjust"
                  : "Create"
              }
            </button>
          </div>

          <article class="personalised-plan-card">
            <div class="personalised-card-icon">
              🍽️
            </div>

            <div class="personalised-card-copy">
              <h4>
                ${escapeHtml(meal.title)}
              </h4>

              <p>
                ${escapeHtml(
                  meal.description
                )}
              </p>
            </div>
          </article>
        </section>

        <section class="personalised-block">
          <div class="personalised-section-head">
            <div>
              <p class="personalised-eyebrow">
                Training
              </p>

              <h3>
                Personalised workout
              </h3>
            </div>

            <button
              id="personalised-generate-workout"
              class="personalised-text-button"
              type="button"
            >
              ${
                state.workout
                  ? "Adjust"
                  : "Create"
              }
            </button>
          </div>

          <article class="personalised-plan-card">
            <div class="personalised-card-icon">
              🏋️
            </div>

            <div class="personalised-card-copy">
              <h4>
                ${escapeHtml(
                  workout.title
                )}
              </h4>

              <p>
                ${escapeHtml(
                  workout.description
                )}
              </p>
            </div>
          </article>
        </section>

        <section class="personalised-block">
          <div class="personalised-section-head">
            <div>
              <p class="personalised-eyebrow">
                Shopping
              </p>

              <h3>
                AI grocery additions
              </h3>
            </div>

            <span class="personalised-count">
              ${groceryItems.length}
            </span>
          </div>

          <div class="personalised-grocery-list">
            ${
              groceryItems.length
                ? groceryItems
                    .map(
                      item => `
                        <div class="personalised-grocery-item">
                          <div>
                            <strong>
                              ${escapeHtml(
                                item.name
                              )}
                            </strong>

                            ${
                              item.quantity
                                ? `
                                  <span>
                                    ${escapeHtml(
                                      item.quantity
                                    )}
                                  </span>
                                `
                                : ""
                            }
                          </div>

                          ${
  item.source === "ai"
    ? `
      <button
        type="button"
        data-remove-grocery="${escapeHtml(
          item.name
        )}"
        aria-label="Remove ${escapeHtml(
          item.name
        )}"
      >
        ×
      </button>
    `
    : `
      <span
        class="personalised-grocery-source"
      >
        Meal plan
      </span>
    `
}
                        </div>
                      `
                    )
                    .join("")
                : `
                  <p class="personalised-empty">
                    Grocery items added by Aligna
                    will appear here.
                  </p>
                `
            }
          </div>
        </section>

        <button
          id="personalised-ask-ai"
          class="personalised-ai-button"
          type="button"
        >
          <span>✦</span>
          Ask Aligna to update my plan
        </button>
      `;

      content
        .querySelector(
          "#personalised-generate-meals"
        )
        .addEventListener(
          "click",
          () => {
            openAssistantWithPrompt(
              state.meals
                ? "Adjust my personalised meal plan based on my current goals and preferences."
                : "Create a personalised meal plan based on my goals, preferences and schedule."
            );
          }
        );

      content
        .querySelector(
          "#personalised-generate-workout"
        )
        .addEventListener(
          "click",
          () => {
            openAssistantWithPrompt(
              state.workout
                ? "Adjust my personalised workout plan based on my current progress and equipment."
                : "Create a personalised workout plan based on my goal, experience and equipment."
            );
          }
        );

      content
        .querySelector(
          "#personalised-ask-ai"
        )
        .addEventListener(
          "click",
          () => {
            openAssistantWithPrompt(
              "Review my meals, training and grocery plan and suggest the most useful next change."
            );
          }
        );

      content
        .querySelectorAll(
          "[data-remove-grocery]"
        )
        .forEach(button => {
          button.addEventListener(
            "click",
            () => {
              removeGrocery({
                name:
                  button.dataset
                    .removeGrocery
              });
            }
          );
        });
    }

    function openPersonalisedPage() {
      const overlay =
        ensurePersonalisedPage();

      renderPersonalisedPage();

      overlay.classList.remove(
        "hidden"
      );

      document.body.classList.add(
        "personalised-open"
      );
    }

    function closePersonalisedPage() {
      const overlay =
        document.getElementById(
          "personalised-page-overlay"
        );

      if (overlay) {
        overlay.classList.add(
          "hidden"
        );
      }

      document.body.classList.remove(
        "personalised-open"
      );
    }

    window.addEventListener(
      "aligna-navigate",
      event => {
        navigateTo(
          event.detail?.page
        );
      }
    );

    window.addEventListener(
      "aligna-add-grocery-item",
      event => {
        addGrocery(
          event.detail || {}
        );
      }
    );

    window.addEventListener(
      "aligna-remove-grocery-item",
      event => {
        removeGrocery(
          event.detail || {}
        );
      }
    );

    window.addEventListener(
      "aligna-save-meal-plan",
      event => {
        saveMealPlan(
          event.detail || {}
        );
      }
    );

    window.addEventListener(
      "aligna-save-workout-plan",
      event => {
        saveWorkoutPlan(
          event.detail || {}
        );
      }
    );

    window.addEventListener(
      "aligna-replace-meal",
      event => {
        replaceMeal(
          event.detail || {}
        );
      }
    );

    window.addEventListener(
      "aligna-update-user-goal",
      event => {
        updateGoal(
          event.detail || {}
        );
      }
    );

    window.addEventListener(
      "aligna-complete-workout",
      event => {
        markWorkoutComplete(
          event.detail || {}
        );
      }
    );

    window.addEventListener(
      "aligna-schedule-reminder",
      event => {
        scheduleReminder(
          event.detail || {}
        );
      }
    );

    window.addEventListener(
      "aligna-personalised-open",
      openPersonalisedPage
    );

    window.addEventListener(
        "aligna-meal-plan-changed",
        () => {
          renderPersonalisedPage();
        }
      );

      window.addEventListener(
        "aligna-meal-plan-applied",
        () => {
          renderPersonalisedPage();
        }
      );

    window.AlignaPersonalised = {
      open: openPersonalisedPage,
      close: closePersonalisedPage,
      render: renderPersonalisedPage,
      getState: currentState
    };

    ensurePersonalisedPage();
  })();
