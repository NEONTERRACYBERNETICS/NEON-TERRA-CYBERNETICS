/* =========================================
   Neon Terra Cybernetics
   script.js — full state-driven frontend
   ========================================= */

(() => {
  const STORAGE_KEY = "ntc_state_v1";

  const defaultState = {
    user: {
      loggedIn: false,
      email: "",
      fullName: "",
      region: "global",
      language: "en",
      rememberMe: true,
    },
    ui: {
      authMode: "signin",
      view: "login", // login | pricing | pending | rejected | dashboard | admin
      disclaimerAccepted: false,
      adminMode: false,
      previewMode: false,
      passwordVisible: false,
    },
    request: {
      id: "",
      planKey: "",
      planName: "",
      price: 0,
      utr: "",
      screenshot: "",
      screenshotName: "",
      screenshotSize: 0,
      status: "", // pending | approved | rejected
      submittedAt: "",
      reviewedAt: "",
      adminNote: "",
      rejectionReason: "",
    },
    requests: [],
    audit: [],
  };

  let state = loadState();

  const refs = {
    logoButton: document.getElementById("logoButton"),
    app: document.getElementById("app"),
    loginView: document.getElementById("loginView"),
    pricingView: document.getElementById("pricingView"),
    pendingView: document.getElementById("pendingView"),
    rejectedView: document.getElementById("rejectedView"),
    dashboardView: document.getElementById("dashboardView"),
    adminView: document.getElementById("adminView"),
    authForm: document.getElementById("authForm"),
    submitAuth: document.getElementById("submitAuth"),
    togglePassword: document.getElementById("togglePassword"),
    password: document.getElementById("password"),
    strengthBar: document.getElementById("strengthBar"),
    strengthLabel: document.getElementById("strengthLabel"),
    email: document.getElementById("email"),
    fullName: document.getElementById("fullName"),
    confirmPassword: document.getElementById("confirmPassword"),
    nameGroup: document.getElementById("nameGroup"),
    confirmPasswordGroup: document.getElementById("confirmPasswordGroup"),
    region: document.getElementById("region"),
    language: document.getElementById("language"),
    rememberMe: document.getElementById("rememberMe"),
    pendingPlanLabel: document.getElementById("pendingPlanLabel"),
    pendingUtrLabel: document.getElementById("pendingUtrLabel"),
    pendingTimeLabel: document.getElementById("pendingTimeLabel"),
    pendingImagePreview: document.getElementById("pendingImagePreview"),
    rejectionReasonText: document.getElementById("rejectionReasonText"),
    goBackToPricing: document.getElementById("goBackToPricing"),
    resubmitBtn: document.getElementById("resubmitBtn"),
    adminSearch: document.getElementById("adminSearch"),
    adminFilter: document.getElementById("adminFilter"),
    previewDashboardBtn: document.getElementById("previewDashboardBtn"),
    adminTableBody: document.getElementById("adminTableBody"),
    metricPending: document.getElementById("metricPending"),
    metricApproved: document.getElementById("metricApproved"),
    metricRejected: document.getElementById("metricRejected"),
    metricValue: document.getElementById("metricValue"),
    modalRoot: document.getElementById("modalRoot"),
    toastRoot: document.getElementById("toastRoot"),
  };

  const stateKey = "ntc_state_v1";

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(defaultState);
      const parsed = JSON.parse(raw);
      return deepMerge(structuredClone(defaultState), parsed);
    } catch {
      return structuredClone(defaultState);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function deepMerge(target, source) {
    if (!source || typeof source !== "object") return target;
    for (const key of Object.keys(source)) {
      const val = source[key];
      if (Array.isArray(val)) {
        target[key] = val;
      } else if (val && typeof val === "object") {
        target[key] = deepMerge(target[key] || {}, val);
      } else {
        target[key] = val;
      }
    }
    return target;
  }

  function uid() {
    return `REQ-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
  }

  function addAudit(action, detail = "") {
    state.audit.unshift({
      id: uid(),
      action,
      detail,
      at: new Date().toISOString(),
    });
    state.audit = state.audit.slice(0, 50);
    saveState();
  }

  function showToast(title, message = "", type = "info") {
    if (!refs.toastRoot) return;

    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <div class="toast__icon">${type === "success" ? "✓" : type === "error" ? "!" : type === "warning" ? "!" : "i"}</div>
      <div class="toast__content">
        <div class="toast__title">${escapeHtml(title)}</div>
        ${message ? `<div class="toast__message">${escapeHtml(message)}</div>` : ""}
      </div>
    `;

    refs.toastRoot.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px) scale(0.98)";
      toast.style.transition = "180ms ease";
    }, 2600);

    setTimeout(() => toast.remove(), 3000);
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setView(view) {
    state.ui.view = view;
    saveState();
    renderApp();
  }

  function openDisclaimerModal() {
    closeAnyModal();
    const modal = document.createElement("div");
    modal.id = "disclaimerModal";
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-card modal-card--narrow">
        <div class="modal-head">
          <div>
            <h3>Security & Compliance Notice</h3>
            <p>Please confirm the terms before continuing.</p>
          </div>
          <button type="button" class="modal-close" id="closeDisclaimer">✕</button>
        </div>

        <div class="modal-copy">
          <p>• Manual review is required for all submissions.</p>
          <p>• Submitted information must be accurate and complete.</p>
          <p>• Suspicious or mismatched entries may be rejected.</p>
          <p>• All purchases are non-refundable.</p>
          <p>• Access is granted only after approval.</p>
        </div>

        <div class="modal-checks">
          <label><input type="checkbox" id="agreeOne" class="checkbox" /> I understand the manual verification process.</label>
          <label><input type="checkbox" id="agreeTwo" class="checkbox" /> I confirm my information is accurate.</label>
          <label><input type="checkbox" id="agreeThree" class="checkbox" /> I accept the no-refund policy.</label>
        </div>

        <div class="modal-footer">
          <button type="button" class="secondary-btn" id="cancelDisclaimer">Cancel</button>
          <button type="button" class="primary-btn" id="agreeDisclaimer" disabled>I Agree & Proceed</button>
        </div>
      </div>
    `;

    refs.modalRoot.appendChild(modal);
    document.body.style.overflow = "hidden";

    const c1 = modal.querySelector("#agreeOne");
    const c2 = modal.querySelector("#agreeTwo");
    const c3 = modal.querySelector("#agreeThree");
    const agreeBtn = modal.querySelector("#agreeDisclaimer");

    const refresh = () => {
      const all = c1.checked && c2.checked && c3.checked;
      agreeBtn.disabled = !all;
      agreeBtn.classList.toggle("opacity-50", !all);
    };

    [c1, c2, c3].forEach((c) => c.addEventListener("change", refresh));

    modal.querySelector("#closeDisclaimer").addEventListener("click", closeAnyModal);
    modal.querySelector("#cancelDisclaimer").addEventListener("click", closeAnyModal);
    agreeBtn.addEventListener("click", () => {
      state.ui.disclaimerAccepted = true;
      state.ui.view = "pricing";
      saveState();
      addAudit("Disclaimer accepted", state.user.email);
      closeAnyModal();
      showToast("Disclaimer accepted", "Proceeding to membership selection.", "success");
      renderApp();
    });

    refresh();
  }

  function openPaymentModal(plan) {
    closeAnyModal();

    const modal = document.createElement("div");
    modal.id = "paymentModal";
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-head">
          <div>
            <h3>Complete Payment Submission</h3>
            <p>Selected plan: <strong>${escapeHtml(plan.name)}</strong> — ₹${plan.price.toLocaleString("en-IN")}</p>
          </div>
          <button type="button" class="modal-close" id="closePayment">✕</button>
        </div>

        <div class="modal-grid">
          <div class="modal-column">
            <h4>Payment Details</h4>
            <div class="qr-box">QR / UPI PAYMENT</div>
            <div class="modal-meta">
              <div class="meta-row"><span>UPI ID</span><b>neonterra@upi</b></div>
              <div class="meta-row"><span>Amount</span><b>₹${plan.price.toLocaleString("en-IN")}</b></div>
              <div class="meta-row"><span>Method</span><b>UPI / QR</b></div>
            </div>
          </div>

          <div class="modal-column">
            <h4>Verification Form</h4>
            <div class="form-group">
              <label class="form-label" for="utrInput">12-Digit UTR / Transaction ID</label>
              <input id="utrInput" class="form-input" inputmode="numeric" maxlength="12" placeholder="123456789012" />
            </div>

            <div class="form-group">
              <label class="form-label" for="screenshotInput">Upload Payment Screenshot</label>
              <div class="upload-box">
                <input id="screenshotInput" type="file" accept="image/png,image/jpeg,image/webp" class="form-input" />
                <div class="file-preview" id="filePreviewBox">
                  <span class="muted">No image selected</span>
                </div>
                <div class="tiny-note">PNG, JPG, WEBP only. Max 5MB.</div>
              </div>
            </div>

            <div class="step-line">
              <div class="step-item"><span class="step-dot"></span><div><strong>Submit details</strong><p>Enter UTR and upload screenshot.</p></div></div>
              <div class="step-item"><span class="step-dot"></span><div><strong>Manual verification</strong><p>The admin reviews the request carefully.</p></div></div>
              <div class="step-item"><span class="step-dot"></span><div><strong>Workspace access</strong><p>Approved requests unlock the dashboard.</p></div></div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="secondary-btn" id="cancelPayment">Cancel</button>
          <button type="button" class="primary-btn primary-btn--gold" id="submitPayment">Submit for Verification</button>
        </div>
      </div>
    `;

    refs.modalRoot.appendChild(modal);
    document.body.style.overflow = "hidden";

    const utrInput = modal.querySelector("#utrInput");
    const screenshotInput = modal.querySelector("#screenshotInput");
    const previewBox = modal.querySelector("#filePreviewBox");
    const submitBtn = modal.querySelector("#submitPayment");

    let fileDataUrl = "";
    let fileName = "";
    let fileSize = 0;

    modal.querySelector("#closePayment").addEventListener("click", closeAnyModal);
    modal.querySelector("#cancelPayment").addEventListener("click", closeAnyModal);

    screenshotInput.addEventListener("change", async () => {
      const file = screenshotInput.files?.[0];
      if (!file) {
        fileDataUrl = "";
        fileName = "";
        fileSize = 0;
        previewBox.innerHTML = `<span class="muted">No image selected</span>`;
        return;
      }

      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
        showToast("Invalid file type", "Please upload PNG, JPG, or WEBP.", "error");
        screenshotInput.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showToast("File too large", "Image size must be 5MB or smaller.", "error");
        screenshotInput.value = "";
        return;
      }

      fileName = file.name;
      fileSize = file.size;
      fileDataUrl = await readFileAsDataURL(file);
      previewBox.innerHTML = `<img src="${fileDataUrl}" alt="Payment screenshot preview" />`;
    });

    submitBtn.addEventListener("click", async () => {
      const utr = utrInput.value.trim();
      if (!/^\d{12}$/.test(utr)) {
        showToast("Invalid UTR", "The transaction ID must be exactly 12 digits.", "error");
        return;
      }

      if (!fileDataUrl) {
        showToast("Screenshot required", "Please upload a payment screenshot.", "error");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";

      const request = {
        id: uid(),
        planKey: plan.key,
        planName: plan.name,
        price: plan.price,
        utr,
        screenshot: fileDataUrl,
        screenshotName: fileName,
        screenshotSize: fileSize,
        status: "pending",
        submittedAt: new Date().toISOString(),
        reviewedAt: "",
        adminNote: "",
        rejectionReason: "",
      };

      await fakeDelay(700);

      state.request = { ...request };
      state.request.status = "pending";
      state.requests.unshift(request);
      state.ui.view = "pending";
      saveState();

      addAudit("Request submitted", `${plan.name} | UTR: ${utr}`);
      closeAnyModal();
      showToast("Verification submitted", "Your request is now in the review queue.", "success");
      renderApp();
    });
  }

  function closeAnyModal() {
    const modals = ["disclaimerModal", "paymentModal", "detailModal", "unlockModal"];
    modals.forEach((id) => document.getElementById(id)?.remove());
    document.body.style.overflow = "";
  }

  function fakeDelay(ms = 600) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function renderApp() {
    const view = resolveView();

    const views = {
      login: refs.loginView,
      pricing: refs.pricingView,
      pending: refs.pendingView,
      rejected: refs.rejectedView,
      dashboard: refs.dashboardView,
      admin: refs.adminView,
    };

    Object.entries(views).forEach(([name, node]) => {
      if (!node) return;
      node.classList.toggle("hidden-view", name !== view);
      node.setAttribute("aria-hidden", String(name !== view));
    });

    hydrateLogin();
    hydratePending();
    hydrateRejected();
    hydrateDashboard();
    renderAdminTable();
    renderAdminMetrics();
  }

  function resolveView() {
    if (state.ui.adminMode && state.ui.view === "admin") return "admin";
    if (state.ui.previewMode) return "dashboard";
    if (state.request.status === "approved") return "dashboard";
    if (state.request.status === "pending") return "pending";
    if (state.request.status === "rejected") return "rejected";
    if (state.user.loggedIn && state.ui.disclaimerAccepted) return "pricing";
    return "login";
  }

  function hydrateLogin() {
    if (!refs.email) return;
    refs.email.value = state.user.email || "";
    refs.fullName.value = state.user.fullName || "";
    refs.region.value = state.user.region || "global";
    refs.language.value = state.user.language || "en";
    refs.rememberMe.checked = Boolean(state.user.rememberMe);
    updatePasswordStrength();
    updateAuthModeUI();
  }

  function hydratePending() {
    if (!refs.pendingPlanLabel) return;
    refs.pendingPlanLabel.textContent = state.request.planName || "—";
    refs.pendingUtrLabel.textContent = state.request.utr || "—";
    refs.pendingTimeLabel.textContent = state.request.submittedAt
      ? new Date(state.request.submittedAt).toLocaleString()
      : "—";
    if (refs.pendingImagePreview) {
      refs.pendingImagePreview.src = state.request.screenshot || "";
      refs.pendingImagePreview.style.display = state.request.screenshot ? "block" : "none";
    }
  }

  function hydrateRejected() {
    if (refs.rejectionReasonText) {
      refs.rejectionReasonText.textContent =
        state.request.rejectionReason || "Please review the details and resubmit when ready.";
    }
  }

  function hydrateDashboard() {
    if (!refs.dashboardView) return;
    const values = document.querySelectorAll(".dashboard-card__value");
    const metas = document.querySelectorAll(".dashboard-card__meta");

    if (values[0]) values[0].textContent = "92%";
    if (values[1]) values[1].textContent = state.request.planName || "Elite";
    if (values[2]) values[2].textContent = state.request.reviewedAt ? new Date(state.request.reviewedAt).toLocaleDateString() : "Today";
    if (values[3]) values[3].textContent = String(state.requests.filter((r) => r.status === "pending").length || 0);

    if (metas[0]) metas[0].textContent = "Healthy access posture";
    if (metas[1]) metas[1].textContent = "Priority review queue";
    if (metas[2]) metas[2].textContent = "Manual approval complete";
    if (metas[3]) metas[3].textContent = `${state.requests.length} total requests tracked`;

    const profilePill = document.querySelector(".profile-pill");
    if (profilePill) profilePill.textContent = state.user.email ? state.user.email.split("@")[0].toUpperCase() : "NTC-USER";
  }

  function renderAdminMetrics() {
    if (!refs.metricPending) return;

    const pending = state.requests.filter((r) => r.status === "pending").length;
    const approved = state.requests.filter((r) => r.status === "approved").length;
    const rejected = state.requests.filter((r) => r.status === "rejected").length;
    const totalValue = state.requests.reduce((sum, r) => sum + (Number(r.price) || 0), 0);

    refs.metricPending.textContent = String(pending);
    refs.metricApproved.textContent = String(approved);
    refs.metricRejected.textContent = String(rejected);
    refs.metricValue.textContent = `₹${totalValue.toLocaleString("en-IN")}`;
  }

  function renderAdminTable() {
    if (!refs.adminTableBody) return;

    const search = refs.adminSearch?.value.trim().toLowerCase() || "";
    const filter = refs.adminFilter?.value || "all";

    const rows = state.requests.filter((req) => {
      const haystack = `${req.planName} ${req.utr} ${req.status} ${req.submittedAt}`.toLowerCase();
      const matchesSearch = !search || haystack.includes(search);
      const matchesFilter = filter === "all" || req.status === filter;
      return matchesSearch && matchesFilter;
    });

    if (!rows.length) {
      refs.adminTableBody.innerHTML = `<tr><td colspan="5" class="admin-empty">No matching requests yet.</td></tr>`;
      return;
    }

    refs.adminTableBody.innerHTML = rows
      .map(
        (req) => `
      <tr>
        <td>${escapeHtml(state.user.email || "guest@example.com")}</td>
        <td>${escapeHtml(req.planName)}</td>
        <td style="font-family:'JetBrains Mono', monospace;">${escapeHtml(req.utr)}</td>
        <td><span class="status-chip ${req.status === "approved" ? "status-chip--approved" : ""}">${escapeHtml(req.status)}</span></td>
        <td class="admin-actions">
          <button class="secondary-btn" type="button" data-admin-action="inspect" data-id="${req.id}">Inspect</button>
          <button class="secondary-btn" type="button" data-admin-action="approve" data-id="${req.id}">Approve</button>
          <button class="secondary-btn" type="button" data-admin-action="reject" data-id="${req.id}">Reject</button>
     
