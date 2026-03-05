document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const activitiesList = document.getElementById("activities-list");
  const messageDiv = document.getElementById("message");
  const registrationModal = document.getElementById("registration-modal");
  const modalActivityName = document.getElementById("modal-activity-name");
  const signupForm = document.getElementById("signup-form");
  const activityInput = document.getElementById("activity");
  const closeRegistrationModal = document.querySelector(".close-modal");

  // Announcement display elements
  const announcementList = document.getElementById("announcement-list");
  const announcementCount = document.getElementById("announcement-count");

  // Search and filter elements
  const searchInput = document.getElementById("activity-search");
  const searchButton = document.getElementById("search-button");
  const categoryFilters = document.querySelectorAll(".category-filter");
  const dayFilters = document.querySelectorAll(".day-filter");
  const timeFilters = document.querySelectorAll(".time-filter");

  // Authentication elements
  const loginButton = document.getElementById("login-button");
  const userInfo = document.getElementById("user-info");
  const displayName = document.getElementById("display-name");
  const logoutButton = document.getElementById("logout-button");
  const loginModal = document.getElementById("login-modal");
  const loginForm = document.getElementById("login-form");
  const closeLoginModal = document.querySelector(".close-login-modal");
  const loginMessage = document.getElementById("login-message");

  // Announcement management modal elements
  const manageAnnouncementsButton = document.getElementById(
    "manage-announcements-button"
  );
  const announcementModal = document.getElementById("announcement-modal");
  const closeAnnouncementModal = document.getElementById(
    "close-announcement-modal"
  );
  const announcementForm = document.getElementById("announcement-form");
  const announcementIdInput = document.getElementById("announcement-id");
  const announcementMessageInput = document.getElementById(
    "announcement-message"
  );
  const announcementStartsOnInput = document.getElementById(
    "announcement-starts-on"
  );
  const announcementExpiresOnInput = document.getElementById(
    "announcement-expires-on"
  );
  const announcementManageList = document.getElementById(
    "announcement-manage-list"
  );
  const announcementMessageBox = document.getElementById(
    "announcement-message-box"
  );
  const cancelAnnouncementEdit = document.getElementById(
    "cancel-announcement-edit"
  );
  const saveAnnouncementButton = document.getElementById(
    "save-announcement-button"
  );

  // Activity categories with corresponding colors
  const activityTypes = {
    sports: { label: "Sports", color: "#e8f5e9", textColor: "#2e7d32" },
    arts: { label: "Arts", color: "#fff4df", textColor: "#b85e00" },
    academic: { label: "Academic", color: "#e3f2fd", textColor: "#1565c0" },
    community: { label: "Community", color: "#ffece5", textColor: "#8e3c12" },
    technology: {
      label: "Technology",
      color: "#e8eaf6",
      textColor: "#3949ab",
    },
  };

  // State for activities and filters
  let allActivities = {};
  let currentFilter = "all";
  let searchQuery = "";
  let currentDay = "";
  let currentTimeRange = "";

  // State for announcements
  let manageAnnouncements = [];

  // Authentication state
  let currentUser = null;

  // Time range mappings for the dropdown
  const timeRanges = {
    morning: { start: "06:00", end: "08:00" },
    afternoon: { start: "15:00", end: "18:00" },
    weekend: { days: ["Saturday", "Sunday"] },
  };

  function formatDateForDisplay(value) {
    if (!value) {
      return "Starts immediately";
    }
    const parsed = new Date(`${value}T00:00:00`);
    return parsed.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function initializeFilters() {
    const activeDayFilter = document.querySelector(".day-filter.active");
    if (activeDayFilter) {
      currentDay = activeDayFilter.dataset.day;
    }

    const activeTimeFilter = document.querySelector(".time-filter.active");
    if (activeTimeFilter) {
      currentTimeRange = activeTimeFilter.dataset.time;
    }
  }

  function setDayFilter(day) {
    currentDay = day;
    dayFilters.forEach((btn) =>
      btn.classList.toggle("active", btn.dataset.day === day)
    );
    fetchActivities();
  }

  function setTimeRangeFilter(timeRange) {
    currentTimeRange = timeRange;
    timeFilters.forEach((btn) =>
      btn.classList.toggle("active", btn.dataset.time === timeRange)
    );
    fetchActivities();
  }

  function checkAuthentication() {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
        validateUserSession(currentUser.username);
      } catch (error) {
        console.error("Error parsing saved user", error);
        logout();
      }
    }

    updateAuthBodyClass();
  }

  async function validateUserSession(username) {
    try {
      const response = await fetch(
        `/auth/check-session?username=${encodeURIComponent(username)}`
      );
      if (!response.ok) {
        logout();
        return;
      }

      const userData = await response.json();
      currentUser = userData;
      localStorage.setItem("currentUser", JSON.stringify(userData));
      updateAuthUI();
    } catch (error) {
      console.error("Error validating session:", error);
    }
  }

  function updateAuthUI() {
    if (currentUser) {
      loginButton.classList.add("hidden");
      userInfo.classList.remove("hidden");
      displayName.textContent = currentUser.display_name;
      manageAnnouncementsButton.classList.remove("hidden");
    } else {
      loginButton.classList.remove("hidden");
      userInfo.classList.add("hidden");
      displayName.textContent = "";
      manageAnnouncementsButton.classList.add("hidden");
    }

    updateAuthBodyClass();
    fetchActivities();
  }

  function updateAuthBodyClass() {
    document.body.classList.toggle("not-authenticated", !currentUser);
  }

  async function login(username, password) {
    try {
      const response = await fetch(
        `/auth/login?username=${encodeURIComponent(
          username
        )}&password=${encodeURIComponent(password)}`,
        { method: "POST" }
      );

      const data = await response.json();
      if (!response.ok) {
        showLoginMessage(data.detail || "Invalid username or password", "error");
        return false;
      }

      currentUser = data;
      localStorage.setItem("currentUser", JSON.stringify(data));
      updateAuthUI();
      closeLoginModalHandler();
      showMessage(`Welcome, ${currentUser.display_name}!`, "success");
      return true;
    } catch (error) {
      console.error("Error during login:", error);
      showLoginMessage("Login failed. Please try again.", "error");
      return false;
    }
  }

  function logout() {
    currentUser = null;
    localStorage.removeItem("currentUser");
    closeAnnouncementModalHandler();
    updateAuthUI();
    showMessage("You have been logged out.", "info");
  }

  function showLoginMessage(text, type) {
    loginMessage.textContent = text;
    loginMessage.className = `message ${type}`;
    loginMessage.classList.remove("hidden");
  }

  function openLoginModal() {
    loginModal.classList.remove("hidden");
    loginModal.classList.add("show");
    loginMessage.classList.add("hidden");
    loginForm.reset();
  }

  function closeLoginModalHandler() {
    loginModal.classList.remove("show");
    setTimeout(() => {
      loginModal.classList.add("hidden");
      loginForm.reset();
    }, 250);
  }

  async function fetchAnnouncements() {
    try {
      const response = await fetch("/announcements");
      const announcements = await response.json();
      if (!response.ok) {
        throw new Error("Failed to fetch announcements");
      }
      renderAnnouncementStrip(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      announcementCount.textContent = "0";
      announcementList.innerHTML =
        '<p class="announcement-empty">Unable to load announcements.</p>';
    }
  }

  function renderAnnouncementStrip(announcements) {
    announcementCount.textContent = String(announcements.length);

    if (!announcements.length) {
      announcementList.innerHTML =
        '<p class="announcement-empty">No active announcements right now.</p>';
      return;
    }

    announcementList.innerHTML = announcements
      .map((announcement) => {
        const startsOnLabel = formatDateForDisplay(announcement.starts_on);
        const expiresOnLabel = formatDateForDisplay(announcement.expires_on);

        return `
          <article class="announcement-card" aria-label="Announcement">
            <p>${announcement.message}</p>
            <div class="announcement-meta">
              <span>Starts: ${startsOnLabel}</span>
              <span>Expires: ${expiresOnLabel}</span>
            </div>
          </article>
        `;
      })
      .join("");
  }

  async function fetchManageAnnouncements() {
    if (!currentUser) {
      return;
    }

    try {
      const response = await fetch(
        `/announcements/manage?teacher_username=${encodeURIComponent(
          currentUser.username
        )}`
      );
      const data = await response.json();
      if (!response.ok) {
        showAnnouncementMessage(data.detail || "Unable to load announcements", "error");
        return;
      }

      manageAnnouncements = data;
      renderManageAnnouncements();
    } catch (error) {
      console.error("Error loading manage announcements:", error);
      showAnnouncementMessage("Unable to load announcements", "error");
    }
  }

  function renderManageAnnouncements() {
    if (!manageAnnouncements.length) {
      announcementManageList.innerHTML =
        '<p class="announcement-empty">No announcements found. Create your first one above.</p>';
      return;
    }

    announcementManageList.innerHTML = manageAnnouncements
      .map(
        (announcement) => `
          <article class="manage-announcement-item">
            <div>
              <p class="manage-announcement-message">${announcement.message}</p>
              <p class="manage-announcement-dates">
                <span>Starts: ${formatDateForDisplay(announcement.starts_on)}</span>
                <span>Expires: ${formatDateForDisplay(announcement.expires_on)}</span>
              </p>
            </div>
            <div class="manage-announcement-actions">
              <button class="secondary edit-announcement" data-id="${announcement.id}">Edit</button>
              <button class="danger delete-announcement" data-id="${announcement.id}">Delete</button>
            </div>
          </article>
        `
      )
      .join("");

    const editButtons = announcementManageList.querySelectorAll(
      ".edit-announcement"
    );
    editButtons.forEach((button) => {
      button.addEventListener("click", () =>
        loadAnnouncementIntoForm(button.dataset.id)
      );
    });

    const deleteButtons = announcementManageList.querySelectorAll(
      ".delete-announcement"
    );
    deleteButtons.forEach((button) => {
      button.addEventListener("click", () =>
        handleDeleteAnnouncement(button.dataset.id)
      );
    });
  }

  function clearAnnouncementForm() {
    announcementIdInput.value = "";
    announcementMessageInput.value = "";
    announcementStartsOnInput.value = "";
    announcementExpiresOnInput.value = "";
    saveAnnouncementButton.textContent = "Save Announcement";
  }

  function loadAnnouncementIntoForm(announcementId) {
    const target = manageAnnouncements.find((item) => item.id === announcementId);
    if (!target) {
      return;
    }

    announcementIdInput.value = target.id;
    announcementMessageInput.value = target.message;
    announcementStartsOnInput.value = target.starts_on || "";
    announcementExpiresOnInput.value = target.expires_on;
    saveAnnouncementButton.textContent = "Update Announcement";
    announcementMessageInput.focus();
  }

  function showAnnouncementMessage(text, type) {
    announcementMessageBox.textContent = text;
    announcementMessageBox.className = `message ${type}`;
    announcementMessageBox.classList.remove("hidden");

    setTimeout(() => {
      announcementMessageBox.classList.add("hidden");
    }, 4000);
  }

  async function saveAnnouncement(event) {
    event.preventDefault();

    if (!currentUser) {
      showAnnouncementMessage(
        "You must be signed in to manage announcements.",
        "error"
      );
      return;
    }

    const payload = {
      message: announcementMessageInput.value.trim(),
      starts_on: announcementStartsOnInput.value || null,
      expires_on: announcementExpiresOnInput.value,
    };

    if (!payload.expires_on) {
      showAnnouncementMessage("Expiration date is required.", "error");
      return;
    }

    const editingId = announcementIdInput.value;
    const endpoint = editingId
      ? `/announcements/manage/${encodeURIComponent(
          editingId
        )}?teacher_username=${encodeURIComponent(currentUser.username)}`
      : `/announcements/manage?teacher_username=${encodeURIComponent(
          currentUser.username
        )}`;
    const method = editingId ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        showAnnouncementMessage(data.detail || "Unable to save announcement", "error");
        return;
      }

      showAnnouncementMessage(
        editingId ? "Announcement updated" : "Announcement created",
        "success"
      );
      clearAnnouncementForm();
      await fetchManageAnnouncements();
      await fetchAnnouncements();
    } catch (error) {
      console.error("Error saving announcement:", error);
      showAnnouncementMessage("Unable to save announcement", "error");
    }
  }

  async function handleDeleteAnnouncement(announcementId) {
    if (!currentUser) {
      return;
    }

    showConfirmationDialog("Delete this announcement?", async () => {
      try {
        const response = await fetch(
          `/announcements/manage/${encodeURIComponent(
            announcementId
          )}?teacher_username=${encodeURIComponent(currentUser.username)}`,
          { method: "DELETE" }
        );
        const data = await response.json();

        if (!response.ok) {
          showAnnouncementMessage(data.detail || "Unable to delete announcement", "error");
          return;
        }

        showAnnouncementMessage("Announcement deleted", "success");
        clearAnnouncementForm();
        await fetchManageAnnouncements();
        await fetchAnnouncements();
      } catch (error) {
        console.error("Error deleting announcement:", error);
        showAnnouncementMessage("Unable to delete announcement", "error");
      }
    });
  }

  function openAnnouncementModal() {
    if (!currentUser) {
      showMessage("Sign in to manage announcements.", "error");
      return;
    }

    announcementModal.classList.remove("hidden");
    announcementModal.classList.add("show");
    announcementModal.setAttribute("aria-hidden", "false");
    clearAnnouncementForm();
    fetchManageAnnouncements();
  }

  function closeAnnouncementModalHandler() {
    announcementModal.classList.remove("show");
    announcementModal.setAttribute("aria-hidden", "true");
    setTimeout(() => {
      announcementModal.classList.add("hidden");
      clearAnnouncementForm();
    }, 250);
  }

  function showLoadingSkeletons() {
    activitiesList.innerHTML = "";

    for (let index = 0; index < 9; index += 1) {
      const skeletonCard = document.createElement("div");
      skeletonCard.className = "skeleton-card";
      skeletonCard.innerHTML = `
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line skeleton-text short"></div>
        <div style="margin-top: 8px;">
          <div class="skeleton-line" style="height: 6px;"></div>
          <div class="skeleton-line skeleton-text short" style="height: 8px; margin-top: 3px;"></div>
        </div>
        <div style="margin-top: auto;">
          <div class="skeleton-line" style="height: 24px; margin-top: 8px;"></div>
        </div>
      `;
      activitiesList.appendChild(skeletonCard);
    }
  }

  function formatSchedule(details) {
    if (details.schedule_details) {
      const days = details.schedule_details.days.join(", ");

      const formatTime = (time24) => {
        const [hours, minutes] = time24
          .split(":")
          .map((timePart) => parseInt(timePart, 10));
        const period = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
      };

      const startTime = formatTime(details.schedule_details.start_time);
      const endTime = formatTime(details.schedule_details.end_time);

      return `${days}, ${startTime} - ${endTime}`;
    }

    return details.schedule;
  }

  function getActivityType(activityName, description) {
    const name = activityName.toLowerCase();
    const desc = description.toLowerCase();

    if (
      name.includes("soccer") ||
      name.includes("basketball") ||
      name.includes("sport") ||
      name.includes("fitness") ||
      desc.includes("team") ||
      desc.includes("game") ||
      desc.includes("athletic")
    ) {
      return "sports";
    }

    if (
      name.includes("art") ||
      name.includes("music") ||
      name.includes("theater") ||
      name.includes("drama") ||
      desc.includes("creative") ||
      desc.includes("paint")
    ) {
      return "arts";
    }

    if (
      name.includes("science") ||
      name.includes("math") ||
      name.includes("academic") ||
      name.includes("study") ||
      name.includes("olympiad") ||
      desc.includes("learning") ||
      desc.includes("education") ||
      desc.includes("competition")
    ) {
      return "academic";
    }

    if (
      name.includes("volunteer") ||
      name.includes("community") ||
      desc.includes("service") ||
      desc.includes("volunteer")
    ) {
      return "community";
    }

    if (
      name.includes("computer") ||
      name.includes("coding") ||
      name.includes("tech") ||
      name.includes("robotics") ||
      desc.includes("programming") ||
      desc.includes("technology") ||
      desc.includes("digital") ||
      desc.includes("robot")
    ) {
      return "technology";
    }

    return "academic";
  }

  async function fetchActivities() {
    showLoadingSkeletons();

    try {
      const queryParams = [];

      if (currentDay) {
        queryParams.push(`day=${encodeURIComponent(currentDay)}`);
      }

      if (currentTimeRange) {
        const range = timeRanges[currentTimeRange];
        if (currentTimeRange !== "weekend" && range) {
          queryParams.push(`start_time=${encodeURIComponent(range.start)}`);
          queryParams.push(`end_time=${encodeURIComponent(range.end)}`);
        }
      }

      const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
      const response = await fetch(`/activities${queryString}`);
      const activities = await response.json();

      allActivities = activities;
      displayFilteredActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function displayFilteredActivities() {
    activitiesList.innerHTML = "";

    const filteredActivities = {};
    Object.entries(allActivities).forEach(([name, details]) => {
      const activityType = getActivityType(name, details.description);

      if (currentFilter !== "all" && activityType !== currentFilter) {
        return;
      }

      if (currentTimeRange === "weekend" && details.schedule_details) {
        const activityDays = details.schedule_details.days;
        const isWeekendActivity = activityDays.some((day) =>
          timeRanges.weekend.days.includes(day)
        );

        if (!isWeekendActivity) {
          return;
        }
      }

      const searchableContent = [
        name.toLowerCase(),
        details.description.toLowerCase(),
        formatSchedule(details).toLowerCase(),
      ].join(" ");

      if (searchQuery && !searchableContent.includes(searchQuery.toLowerCase())) {
        return;
      }

      filteredActivities[name] = details;
    });

    if (!Object.keys(filteredActivities).length) {
      activitiesList.innerHTML = `
        <div class="no-results">
          <h4>No activities found</h4>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      `;
      return;
    }

    Object.entries(filteredActivities).forEach(([name, details]) => {
      renderActivityCard(name, details);
    });
  }

  function renderActivityCard(name, details) {
    const activityCard = document.createElement("div");
    activityCard.className = "activity-card";

    const totalSpots = details.max_participants;
    const takenSpots = details.participants.length;
    const spotsLeft = totalSpots - takenSpots;
    const capacityPercentage = (takenSpots / totalSpots) * 100;
    const isFull = spotsLeft <= 0;

    let capacityStatusClass = "capacity-available";
    if (isFull) {
      capacityStatusClass = "capacity-full";
    } else if (capacityPercentage >= 75) {
      capacityStatusClass = "capacity-near-full";
    }

    const activityType = getActivityType(name, details.description);
    const typeInfo = activityTypes[activityType];
    const formattedSchedule = formatSchedule(details);

    const tagHtml = `
      <span class="activity-tag" style="background-color: ${typeInfo.color}; color: ${typeInfo.textColor}">
        ${typeInfo.label}
      </span>
    `;

    const capacityIndicator = `
      <div class="capacity-container ${capacityStatusClass}">
        <div class="capacity-bar-bg">
          <div class="capacity-bar-fill" style="width: ${capacityPercentage}%"></div>
        </div>
        <div class="capacity-text">
          <span>${takenSpots} enrolled</span>
          <span>${spotsLeft} spots left</span>
        </div>
      </div>
    `;

    activityCard.innerHTML = `
      ${tagHtml}
      <h4>${name}</h4>
      <p>${details.description}</p>
      <p class="tooltip">
        <strong>Schedule:</strong> ${formattedSchedule}
        <span class="tooltip-text">Regular meetings at this time throughout the semester</span>
      </p>
      ${capacityIndicator}
      <div class="participants-list">
        <h5>Current Participants:</h5>
        <ul>
          ${details.participants
            .map(
              (email) => `
            <li>
              ${email}
              ${
                currentUser
                  ? `
                <span class="delete-participant tooltip" data-activity="${name}" data-email="${email}" role="button" aria-label="Unregister ${email}">
                  ✖
                  <span class="tooltip-text">Unregister this student</span>
                </span>
              `
                  : ""
              }
            </li>
          `
            )
            .join("")}
        </ul>
      </div>
      <div class="activity-card-actions">
        ${
          currentUser
            ? `
          <button class="register-button" data-activity="${name}" ${
                isFull ? "disabled" : ""
              }>
            ${isFull ? "Activity Full" : "Register Student"}
          </button>
        `
            : `
          <div class="auth-notice">
            Teachers can register students.
          </div>
        `
        }
      </div>
    `;

    const deleteButtons = activityCard.querySelectorAll(".delete-participant");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });

    if (currentUser && !isFull) {
      const registerButton = activityCard.querySelector(".register-button");
      registerButton.addEventListener("click", () => {
        openRegistrationModal(name);
      });
    }

    activitiesList.appendChild(activityCard);
  }

  function openRegistrationModal(activityName) {
    modalActivityName.textContent = activityName;
    activityInput.value = activityName;
    registrationModal.classList.remove("hidden");
    setTimeout(() => {
      registrationModal.classList.add("show");
    }, 10);
  }

  function closeRegistrationModalHandler() {
    registrationModal.classList.remove("show");
    setTimeout(() => {
      registrationModal.classList.add("hidden");
      signupForm.reset();
    }, 250);
  }

  function showConfirmationDialog(message, confirmCallback) {
    let confirmDialog = document.getElementById("confirm-dialog");
    if (!confirmDialog) {
      confirmDialog = document.createElement("div");
      confirmDialog.id = "confirm-dialog";
      confirmDialog.className = "modal hidden";
      confirmDialog.innerHTML = `
        <div class="modal-content">
          <h3>Confirm Action</h3>
          <p id="confirm-message"></p>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button id="cancel-button" class="secondary">Cancel</button>
            <button id="confirm-button" class="danger">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmDialog);
    }

    const confirmMessage = document.getElementById("confirm-message");
    confirmMessage.textContent = message;

    confirmDialog.classList.remove("hidden");
    setTimeout(() => {
      confirmDialog.classList.add("show");
    }, 10);

    const cancelButton = document.getElementById("cancel-button");
    const confirmButton = document.getElementById("confirm-button");

    const newCancelButton = cancelButton.cloneNode(true);
    const newConfirmButton = confirmButton.cloneNode(true);
    cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);

    newCancelButton.addEventListener("click", () => {
      confirmDialog.classList.remove("show");
      setTimeout(() => {
        confirmDialog.classList.add("hidden");
      }, 250);
    });

    newConfirmButton.addEventListener("click", () => {
      confirmCallback();
      confirmDialog.classList.remove("show");
      setTimeout(() => {
        confirmDialog.classList.add("hidden");
      }, 250);
    });

    confirmDialog.addEventListener("click", (event) => {
      if (event.target === confirmDialog) {
        confirmDialog.classList.remove("show");
        setTimeout(() => {
          confirmDialog.classList.add("hidden");
        }, 250);
      }
    });
  }

  async function handleUnregister(event) {
    if (!currentUser) {
      showMessage(
        "You must be logged in as a teacher to unregister students.",
        "error"
      );
      return;
    }

    const control = event.currentTarget;
    const activity = control.dataset.activity;
    const email = control.dataset.email;

    showConfirmationDialog(
      `Are you sure you want to unregister ${email} from ${activity}?`,
      async () => {
        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(
              activity
            )}/unregister?email=${encodeURIComponent(
              email
            )}&teacher_username=${encodeURIComponent(currentUser.username)}`,
            {
              method: "POST",
            }
          );

          const result = await response.json();

          if (response.ok) {
            showMessage(result.message, "success");
            fetchActivities();
          } else {
            showMessage(result.detail || "An error occurred", "error");
          }
        } catch (error) {
          showMessage("Failed to unregister. Please try again.", "error");
          console.error("Error unregistering:", error);
        }
      }
    );
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Event listeners for authentication
  loginButton.addEventListener("click", openLoginModal);
  logoutButton.addEventListener("click", logout);
  closeLoginModal.addEventListener("click", closeLoginModalHandler);
  manageAnnouncementsButton.addEventListener("click", openAnnouncementModal);
  closeAnnouncementModal.addEventListener("click", closeAnnouncementModalHandler);
  cancelAnnouncementEdit.addEventListener("click", clearAnnouncementForm);

  // Modal close behavior when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      closeLoginModalHandler();
    }
    if (event.target === registrationModal) {
      closeRegistrationModalHandler();
    }
    if (event.target === announcementModal) {
      closeAnnouncementModalHandler();
    }
  });

  // Handle login form submission
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    await login(username, password);
  });

  announcementForm.addEventListener("submit", saveAnnouncement);

  // Event listeners for search and filter
  searchInput.addEventListener("input", (event) => {
    searchQuery = event.target.value;
    displayFilteredActivities();
  });

  searchButton.addEventListener("click", (event) => {
    event.preventDefault();
    searchQuery = searchInput.value;
    displayFilteredActivities();
  });

  // Add event listeners to category filter buttons
  categoryFilters.forEach((button) => {
    button.addEventListener("click", () => {
      categoryFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      currentFilter = button.dataset.category;
      displayFilteredActivities();
    });
  });

  // Add event listeners to day filter buttons
  dayFilters.forEach((button) => {
    button.addEventListener("click", () => {
      dayFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      currentDay = button.dataset.day;
      fetchActivities();
    });
  });

  // Add event listeners for time filter buttons
  timeFilters.forEach((button) => {
    button.addEventListener("click", () => {
      timeFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      currentTimeRange = button.dataset.time;
      fetchActivities();
    });
  });

  closeRegistrationModal.addEventListener(
    "click",
    closeRegistrationModalHandler
  );

  // Handle signup form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentUser) {
      showMessage(
        "You must be logged in as a teacher to register students.",
        "error"
      );
      return;
    }

    const email = document.getElementById("email").value;
    const activity = activityInput.value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(
          email
        )}&teacher_username=${encodeURIComponent(currentUser.username)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        closeRegistrationModalHandler();
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  window.activityFilters = {
    setDayFilter,
    setTimeRangeFilter,
  };

  // Initialize app
  checkAuthentication();
  initializeFilters();
  fetchAnnouncements();
  fetchActivities();
});
