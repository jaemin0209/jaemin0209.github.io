const owner = "jaemin0209";
const repository = "jaemin0209.github.io";
const branch = "main";
const contentPath = "content.json";
const apiBase = `https://api.github.com/repos/${owner}/${repository}`;

let token = sessionStorage.getItem("jaemin-site-token") || "";
let content = null;
let contentSha = "";

const tokenPanel = document.querySelector("#token-panel");
const tokenForm = document.querySelector("#token-form");
const tokenInput = document.querySelector("#token");
const tokenStatus = document.querySelector("#token-status");
const contentForm = document.querySelector("#content-form");
const sectionsRoot = document.querySelector("#editor-sections");
const saveButton = document.querySelector("#save");
const saveStatus = document.querySelector("#save-status");
const disconnectButton = document.querySelector("#disconnect");
const errorPanel = document.querySelector("#editor-error");
const errorMessage = document.querySelector("#error-message");

const scalarSections = [
  {
    title: "기본 정보",
    fields: [
      ["name", "이름"], ["eyebrow", "전문 분야"], ["location", "위치"], ["coordinates", "좌표"],
      ["heroThesis", "첫 문장", true], ["heroAccent", "강조 문장", true], ["heroIntro", "소개", true], ["contactEmail", "이메일"],
    ],
  },
  {
    title: "소개와 현재 소속",
    fields: [
      ["aboutTitle", "About 제목", true], ["aboutLead", "About 첫 문단", true], ["aboutSupport", "About 둘째 문단", true],
      ["currentInstitution", "현재 기관"], ["currentRole", "임상 역할"], ["currentRolePeriod", "임상 기간"],
      ["currentStudy", "학위 과정"], ["currentStudyPeriod", "학위 기간"],
    ],
  },
  {
    title: "향후 방향과 방법론",
    fields: [
      ["futureTitle", "Future direction 제목", true], ["futureCopy", "Future direction 설명", true],
      ["methodsCopy", "Methods 설명", true], ["contactTitle", "Contact 문구", true],
    ],
  },
];

const arraySections = [
  {
    key: "researchAreas",
    title: "연구 분야",
    itemName: "연구 분야",
    fields: [["number", "번호"], ["title", "제목"], ["copy", "설명", true]],
    blank: { number: "04", title: "New research area", copy: "" },
  },
  {
    key: "workingProjects",
    title: "진행 중인 연구",
    itemName: "프로젝트",
    fields: [["status", "상태·소속"], ["title", "제목", true], ["copy", "설명", true]],
    blank: { status: "In progress", title: "New project", copy: "" },
  },
  {
    key: "publications",
    title: "논문",
    itemName: "논문",
    fields: [["year", "연도"], ["note", "표시 메모"], ["title", "제목", true], ["authors", "저자", true], ["venue", "학술지·권·페이지"], ["href", "링크"]],
    blank: { year: String(new Date().getFullYear()), title: "New publication", authors: "", venue: "", note: "", href: "https://scholar.google.com/" },
    prepend: true,
  },
  {
    key: "timeline",
    title: "CV 경력",
    itemName: "경력",
    fields: [["period", "기간"], ["institution", "기관"], ["detail", "내용", true]],
    blank: { period: "", institution: "New institution", detail: "" },
    prepend: true,
  },
  {
    key: "awards",
    title: "수상 경력",
    itemName: "수상",
    fields: [["period", "날짜·연도"], ["title", "수상명", true], ["organization", "기관·학술대회", true]],
    blank: { period: String(new Date().getFullYear()), title: "New award", organization: "" },
    prepend: true,
  },
];

function headers() {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function decodeBase64(value) {
  const bytes = Uint8Array.from(atob(value.replaceAll("\n", "")), (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

async function request(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...headers(), ...options.headers } });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.message || `GitHub request failed (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

function field(path, label, value, multiline = false) {
  const wrapper = document.createElement("div");
  wrapper.className = multiline ? "editor-field editor-field-wide" : "editor-field";
  const id = `field-${path.replaceAll(".", "-")}`;
  const labelElement = document.createElement("label");
  labelElement.htmlFor = id;
  labelElement.textContent = label;
  const input = document.createElement(multiline ? "textarea" : "input");
  input.id = id;
  input.value = value || "";
  input.dataset.path = path;
  input.addEventListener("input", updateContent);
  wrapper.append(labelElement, input);
  return wrapper;
}

function updateContent(event) {
  const parts = event.target.dataset.path.split(".");
  if (parts.length === 1) content[parts[0]] = event.target.value;
  if (parts.length === 3) content[parts[0]][Number(parts[1])][parts[2]] = event.target.value;
  saveStatus.textContent = "저장하지 않은 변경사항이 있습니다.";
}

function sectionTitle(index, title) {
  const heading = document.createElement("div");
  heading.className = "editor-section-title";
  heading.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><h2></h2>`;
  heading.querySelector("h2").textContent = title;
  return heading;
}

function renderEditor() {
  sectionsRoot.innerHTML = "";
  let sectionIndex = 0;

  scalarSections.forEach((definition) => {
    const section = document.createElement("section");
    section.className = "editor-section";
    section.append(sectionTitle(sectionIndex++, definition.title));
    const grid = document.createElement("div");
    grid.className = "editor-grid";
    definition.fields.forEach(([key, label, multiline]) => grid.append(field(key, label, content[key], multiline)));
    section.append(grid);
    sectionsRoot.append(section);
  });

  arraySections.forEach((definition) => {
    const section = document.createElement("section");
    section.className = "editor-section";
    section.append(sectionTitle(sectionIndex++, definition.title));
    const list = document.createElement("div");
    list.className = "repeat-list";
    (content[definition.key] || []).forEach((item, itemIndex) => {
      const card = document.createElement("article");
      card.className = "repeat-card";
      const head = document.createElement("div");
      head.className = "repeat-card-head";
      const strong = document.createElement("strong");
      strong.textContent = `${definition.itemName} ${itemIndex + 1}`;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "삭제";
      remove.addEventListener("click", () => {
        content[definition.key].splice(itemIndex, 1);
        renderEditor();
        saveStatus.textContent = "저장하지 않은 변경사항이 있습니다.";
      });
      head.append(strong, remove);
      const grid = document.createElement("div");
      grid.className = "editor-grid";
      definition.fields.forEach(([key, label, multiline]) =>
        grid.append(field(`${definition.key}.${itemIndex}.${key}`, label, item[key], multiline)),
      );
      card.append(head, grid);
      list.append(card);
    });
    const add = document.createElement("button");
    add.type = "button";
    add.className = "editor-add";
    add.textContent = `+ ${definition.itemName} 추가`;
    add.addEventListener("click", () => {
      const item = structuredClone(definition.blank);
      definition.prepend ? content[definition.key].unshift(item) : content[definition.key].push(item);
      renderEditor();
      saveStatus.textContent = "저장하지 않은 변경사항이 있습니다.";
    });
    section.append(list, add);
    sectionsRoot.append(section);
  });

  const skillsSection = document.createElement("section");
  skillsSection.className = "editor-section";
  skillsSection.append(sectionTitle(sectionIndex, "Methods & tools"));
  const skillsField = field("skills", "쉼표로 구분", (content.skills || []).join(", "), true);
  skillsField.querySelector("textarea").removeEventListener("input", updateContent);
  skillsField.querySelector("textarea").addEventListener("input", (event) => {
    content.skills = event.target.value.split(",").map((item) => item.trim()).filter(Boolean);
    saveStatus.textContent = "저장하지 않은 변경사항이 있습니다.";
  });
  skillsSection.append(skillsField);
  sectionsRoot.append(skillsSection);
}

async function connect() {
  tokenStatus.textContent = "GitHub 계정을 확인하는 중…";
  const user = await request("https://api.github.com/user");
  if (user.login.toLowerCase() !== owner) {
    throw new Error(`현재 token은 ${user.login} 계정용입니다. ${owner} 계정 token을 사용해 주세요.`);
  }
  const file = await request(`${apiBase}/contents/${contentPath}?ref=${branch}`);
  content = JSON.parse(decodeBase64(file.content));
  contentSha = file.sha;
  sessionStorage.setItem("jaemin-site-token", token);
  tokenPanel.hidden = true;
  errorPanel.hidden = true;
  contentForm.hidden = false;
  disconnectButton.hidden = false;
  renderEditor();
  saveStatus.textContent = `${user.login} 계정으로 연결되었습니다.`;
}

tokenForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  token = tokenInput.value.trim();
  try {
    await connect();
  } catch (error) {
    sessionStorage.removeItem("jaemin-site-token");
    tokenStatus.textContent = error.message;
  }
});

contentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  saveButton.disabled = true;
  saveStatus.textContent = "GitHub에 저장하는 중…";
  try {
    const result = await request(`${apiBase}/contents/${contentPath}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Update website content",
        content: encodeBase64(`${JSON.stringify(content, null, 2)}\n`),
        sha: contentSha,
        branch,
      }),
    });
    contentSha = result.content.sha;
    saveStatus.textContent = "저장했습니다. 홈페이지 반영까지 보통 1–2분 정도 걸립니다.";
  } catch (error) {
    saveStatus.textContent = `저장 실패: ${error.message}`;
  } finally {
    saveButton.disabled = false;
  }
});

disconnectButton.addEventListener("click", () => {
  sessionStorage.removeItem("jaemin-site-token");
  token = "";
  content = null;
  contentSha = "";
  tokenInput.value = "";
  contentForm.hidden = true;
  disconnectButton.hidden = true;
  tokenPanel.hidden = false;
  tokenStatus.textContent = "연결이 해제되었습니다.";
});

document.querySelector("#retry").addEventListener("click", () => window.location.reload());

if (token) {
  connect().catch((error) => {
    sessionStorage.removeItem("jaemin-site-token");
    token = "";
    errorPanel.hidden = false;
    errorMessage.textContent = error.message;
    tokenPanel.hidden = false;
  });
}
