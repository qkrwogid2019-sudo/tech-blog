/* ==========================================================
  app.js (GitHub Pages 안정판)
  user/repo: qkrwogid2019-sudo
========================================================== */

const $ = (sel) => document.querySelector(sel);
const BASE = "/qkrwogid2019-sudo";

/* ---------- utils ---------- */

function fmtDate(iso){
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("ko-KR", {
    year:"numeric", month:"short", day:"numeric"
  });
}

async function fetchJSON(url){
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`JSON 로드 실패: ${url}`);
  return await res.json();
}

async function fetchText(url){
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTML 로드 실패: ${url}`);
  return await res.text();
}

/* ---------- data ---------- */

async function loadPosts(){
  const data = await fetchJSON(`${BASE}/posts/posts.json`);
  return data.sort((a,b) => (b.date > a.date ? 1 : -1));
}

function uniqueTags(posts){
  const set = new Set();
  posts.forEach(p => (p.tags || []).forEach(t => set.add(t)));
  return Array.from(set).sort();
}

/* ---------- index ---------- */

function renderPostCard(p){
  const chips = (p.tags || []).slice(0,3)
    .map(t => `<span class="chip">#${t}</span>`).join("");

  return `
    <a class="post-card" data-type="${p.type || "tech"}"
       href="${BASE}/post.html?slug=${encodeURIComponent(p.slug)}">
      <p class="kicker">${fmtDate(p.date)} · ${p.readingTime || "—"} min</p>
      <h2 class="post-title">${p.title}</h2>
      <p class="post-summary">${p.summary || ""}</p>
      <div class="meta-row">
        <div class="chips">${chips}</div>
        <span>Read →</span>
      </div>
    </a>
  `;
}

function mountIndex(posts){
  $("#year").textContent = new Date().getFullYear();

  const pinned = posts.filter(p => p.pinned);
  const normal = posts.filter(p => !p.pinned);

  const pinnedEl = $("#pinnedPosts");
  if (pinnedEl){
    pinnedEl.innerHTML = pinned.map(renderPostCard).join("");
  }

  const postsEl = $("#posts");
  const emptyEl = $("#empty");
  const searchEl = $("#search");
  const tagEl = $("#tagFilter");
  const chipsEl = $("#tagChips");

  const tags = uniqueTags(posts);
  tags.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = `#${t}`;
    tagEl.appendChild(opt);
  });

  chipsEl.innerHTML = tags.map(t => `<span class="chip">#${t}</span>`).join(" ");

  function apply(){
    const q = (searchEl.value || "").toLowerCase();
    const tag = tagEl.value;

    const filtered = normal.filter(p => {
      const hay = `${p.title} ${p.summary || ""} ${(p.tags || []).join(" ")}`.toLowerCase();
      return (!q || hay.includes(q)) &&
             (!tag || (p.tags || []).includes(tag));
    });

    postsEl.innerHTML = filtered.map(renderPostCard).join("");
    emptyEl.classList.toggle("hidden", filtered.length !== 0);
  }

  searchEl.addEventListener("input", apply);
  tagEl.addEventListener("change", apply);
  apply();
}

/* ---------- post ---------- */

async function mountPost(posts){
  $("#year").textContent = new Date().getFullYear();

  const slug = new URLSearchParams(location.search).get("slug");
  if (!slug){
    $("#content").innerHTML = "<p>slug 없음</p>";
    return;
  }

  const post = posts.find(p => p.slug === slug);
  if (!post){
    $("#content").innerHTML = `<p>posts.json에 없음: ${slug}</p>`;
    return;
  }

  document.title = `${post.title} • 향의 기술블로그`;
  $("#meta").textContent = `${fmtDate(post.date)} · ${post.readingTime || "—"} min`;
  $("#title").textContent = post.title;
  $("#summary").textContent = post.summary || "";
  $("#chips").innerHTML = (post.tags || []).map(t => `<span class="chip">#${t}</span>`).join("");

  const html = await fetchText(`${BASE}/posts/${post.file}`);
  $("#content").innerHTML = html;
  enhanceCodeBlocks();
}

/* ---------- code blocks ---------- */

function enhanceCodeBlocks(){
  if (window.hljs) hljs.highlightAll();

  document.querySelectorAll("pre code").forEach(code => {
    const pre = code.parentElement;
    if (pre.querySelector(".copy-btn")) return;

    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.textContent = "Copy";

    btn.onclick = async () => {
      try{
        await navigator.clipboard.writeText(code.innerText);
        btn.textContent = "Copied";
        btn.classList.add("copied");
        setTimeout(() => {
          btn.textContent = "Copy";
          btn.classList.remove("copied");
        }, 1200);
      }catch{
        btn.textContent = "Failed";
      }
    };

    pre.appendChild(btn);
  });
}

/* ---------- bootstrap ---------- */

(async function init(){
  try{
    const posts = await loadPosts();
    const isPost = location.pathname.endsWith("/post.html");
    isPost ? await mountPost(posts) : mountIndex(posts);
  }catch(e){
    console.error(e);
    document.body.insertAdjacentHTML(
      "beforeend",
      `<pre style="color:red">JS ERROR: ${e.message}</pre>`
    );
  }
})();

