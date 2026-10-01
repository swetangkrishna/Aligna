(() => {
    const SYNC_EVENT =
      "aligna-state-sync-result";

    const pendingRequests =
      new Map();

    let uploadTimer = null;
    let applyingRemoteState = false;
    let syncStarted = false;

    function createRequestId(prefix) {
      return [
        prefix,
        Date.now(),
        Math.random()
          .toString(16)
          .slice(2)
      ].join("_");
    }

    function nativeBridgeAvailable() {
      return (
        window.AlignaStateSync &&
        typeof window
          .AlignaStateSync
          .downloadState ===
          "function" &&
        typeof window
          .AlignaStateSync
          .uploadState ===
          "function"
      );
    }

    function waitForResult(
      requestId
    ) {
      return new Promise(
        (resolve, reject) => {
          const timeoutId =
            window.setTimeout(
              () => {
                pendingRequests.delete(
                  requestId
                );

                reject(
                  new Error(
                    "State sync timed out."
                  )
                );
              },
              25_000
            );

          pendingRequests.set(
            requestId,
            {
              resolve,
              reject,
              timeoutId
            }
          );
        }
      );
    }

    function exportState() {
      if (
        !window.AlignaAppState ||
        typeof window
          .AlignaAppState
          .export !==
          "function"
      ) {
        throw new Error(
          "Aligna state export is unavailable."
        );
      }

      return window
        .AlignaAppState
        .export();
    }

    async function importState(
      state
    ) {
      if (
        !window.AlignaAppState ||
        typeof window
          .AlignaAppState
          .import !==
          "function"
      ) {
        throw new Error(
          "Aligna state import is unavailable."
        );
      }

      applyingRemoteState = true;

      try {
        await window
          .AlignaAppState
          .import(state);
      } finally {
        applyingRemoteState = false;
      }
    }

    async function download() {
      if (
        !nativeBridgeAvailable()
      ) {
        throw new Error(
          "Native state sync is unavailable."
        );
      }

      const requestId =
        createRequestId(
          "state_download"
        );

      const resultPromise =
        waitForResult(
          requestId
        );

      window
        .AlignaStateSync
        .downloadState(
          requestId
        );

      const result =
        await resultPromise;

      const remoteState =
        result?.data?.state;

      if (
        remoteState &&
        typeof remoteState ===
          "object" &&
        Object.keys(remoteState)
          .length > 0
      ) {
        await importState(
          remoteState
        );

        return {
          status:
            "downloaded",

          state:
            remoteState
        };
      }

      return {
        status:
          "empty"
      };
    }

    async function upload() {
      if (
        applyingRemoteState ||
        !nativeBridgeAvailable()
      ) {
        return;
      }

      const state =
        exportState();

      const requestId =
        createRequestId(
          "state_upload"
        );

      const resultPromise =
        waitForResult(
          requestId
        );

      window
        .AlignaStateSync
        .uploadState(
          requestId,
          JSON.stringify(state),
          new Date()
            .toISOString()
        );

      return resultPromise;
    }

    function scheduleUpload() {
      if (
        applyingRemoteState
      ) {
        return;
      }

      window.clearTimeout(
        uploadTimer
      );

      uploadTimer =
        window.setTimeout(
          () => {
            upload().catch(
              error => {
                console.error(
                  "Cloud state upload failed",
                  error
                );
              }
            );
          },
          1200
        );
    }

    async function start() {
      if (
        syncStarted
      ) {
        return;
      }

      syncStarted = true;

      try {
        const result =
          await download();

        /*
         * A new account has no cloud state.
         * Upload the existing local state.
         */
        if (
          result.status ===
          "empty"
        ) {
          await upload();
        }
      } catch (error) {
        syncStarted = false;

        console.error(
          "Initial state sync failed",
          error
        );
      }
    }

    function stop() {
      syncStarted = false;

      window.clearTimeout(
        uploadTimer
      );

      uploadTimer = null;
    }

    window.addEventListener(
      SYNC_EVENT,
      event => {
        const result =
          event.detail || {};

        const pending =
          pendingRequests.get(
            result.requestId
          );

        if (!pending) {
          return;
        }

        window.clearTimeout(
          pending.timeoutId
        );

        pendingRequests.delete(
          result.requestId
        );

        if (
          result.success
        ) {
          pending.resolve(
            result
          );
        } else {
          pending.reject(
            new Error(
              result.error ||
              "State sync failed."
            )
          );
        }
      }
    );

    window.addEventListener(
      "aligna-auth-login",
      event => {
        if (
          event.detail?.success
        ) {
          start();
        }
      }
    );

    window.addEventListener(
      "aligna-auth-register",
      event => {
        if (
          event.detail?.success
        ) {
          start();
        }
      }
    );

    window.addEventListener(
      "aligna-auth-session",
      event => {
        if (
          event.detail?.success
        ) {
          start();
        }
      }
    );

    window.addEventListener(
      "aligna-auth-logout",
      stop
    );

    window.addEventListener(
      "aligna-auth-expired",
      stop
    );

    window.AlignaCloudSync = {
      start,
      stop,
      download,
      upload,
      scheduleUpload
    };
  })();
