const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
const header = document.querySelector(".site-header");
const iosNotifyForm = document.querySelector("#ios-notify-form");
const iosNotifyStatus = document.querySelector("#ios-notify-status");
const iosNotifySubmit = document.querySelector("#ios-notify-submit");

window.lucide?.createIcons({
  attrs: {
    "aria-hidden": "true",
  },
});

const closeMenu = () => {
  if (!mainNav || !menuToggle) return;
  mainNav.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
};

const toggleMenu = () => {
  if (!mainNav || !menuToggle) return;
  const isOpen = mainNav.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
};

menuToggle?.addEventListener("click", toggleMenu);

mainNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

window.addEventListener("scroll", () => {
  if (!header) return;
  header.classList.toggle("scrolled", window.scrollY > 12);
});

const getIosNotifyEndpoint = () => {
  const configuredEndpoint = window.FREELA_NORTE_NOTIFY_IOS_ENDPOINT || iosNotifyForm?.dataset.endpoint || "";

  if (configuredEndpoint.includes("PROJECT_REF")) {
    console.error("Endpoint do aviso iOS não configurado: substitua PROJECT_REF pela referência do projeto Supabase.");
    return "";
  }

  return configuredEndpoint.trim();
};

const setIosNotifyLoading = (isLoading) => {
  if (!iosNotifyForm || !iosNotifySubmit) return;
  const submitLabel = iosNotifySubmit.querySelector(".btn-label");
  iosNotifyForm.classList.toggle("is-loading", isLoading);
  iosNotifySubmit.disabled = isLoading;

  if (submitLabel) {
    submitLabel.textContent = isLoading ? "Enviando..." : "Quero ser avisado";
  }
};

const setIosNotifyStatus = (message, type) => {
  if (!iosNotifyStatus) return;
  iosNotifyStatus.textContent = message;
  iosNotifyStatus.hidden = !message;
  iosNotifyStatus.className = "form-status";

  if (!message) {
    return;
  }

  requestAnimationFrame(() => {
    iosNotifyStatus.classList.add(type, "is-visible");
  });
};

iosNotifyForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const emailInput = iosNotifyForm.querySelector('input[name="email"]');

  if (!emailInput?.checkValidity()) {
    emailInput?.reportValidity();
    return;
  }

  const endpoint = getIosNotifyEndpoint();

  if (!endpoint) {
    setIosNotifyStatus("Não foi possível enviar. Tente novamente.", "error");
    return;
  }

  setIosNotifyStatus("", "");
  setIosNotifyLoading(true);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: emailInput.value.trim(),
      }),
    });

    if (!response.ok) {
      let errorBody = {};

      try {
        errorBody = await response.json();
      } catch {
        errorBody = { error: "Resposta inválida do servidor." };
      }

      console.error("Falha ao enviar aviso iOS", {
        status: response.status,
        body: errorBody,
      });

      throw new Error("Notify request failed");
    }

    iosNotifyForm.reset();
    iosNotifyForm.classList.add("is-confirmed");
    setIosNotifyStatus("Perfeito. Você será avisado assim que a versão para iPhone estiver disponível.", "success");

    window.setTimeout(() => {
      iosNotifyForm.classList.remove("is-confirmed");
    }, 900);
  } catch (error) {
    console.error("Erro no formulário de aviso iOS", error);
    setIosNotifyStatus("Não foi possível enviar. Tente novamente.", "error");
  } finally {
    setIosNotifyLoading(false);
  }
});
