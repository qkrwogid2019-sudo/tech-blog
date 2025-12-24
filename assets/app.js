/* ==========================================================
  app.js – GitHub Pages 안정판
  user : qkrwogid2019-sudo
  repo : tech-blog
========================================================== */

const $ = (s) => document.querySelector(s);
const BASE = "/tech-blog";

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
  return res.json();
}

async function fetchText(url){
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTML 로드 실패: ${url}`);
  return res.text();
}

/* ---------- data ---------- */
async function loadPosts(){
  const data = await fetchJSON(`${BASE}/posts/posts.json`);
  return data.sort((a,b) => (b.date > a.date ? 1 : -1));
}

/* ---------- index ---------- */
function renderPostCard(p){
  const chips = (p.tags || [])
    .map(t => `<span class="chip">#${t}</span>`).join("");

  return `
    <a class="post-card"
       href="${BASE}/post.html?slug=${encodeURIComponent(p.slug)}">
      <p class="kicker">${fmtDate(p.date)} · ${p.readingTime || "—"} min</p>
      <h2>${p.title}</h2>
      <p class="post-summary">${p.summary || ""}</p>
      <div class="chips">${chips}</div>
    </a>
  `;
}

function mountIndex(posts){
  $("#year").textContent = new Date().getFullYear();
  $("#posts").innerHTML = posts.map(renderPostCard).join("");
}

/* ---------- post ---------- */
async function mountPost(posts){
  $("#year").textContent = new Date().getFullYear();

  const slug = new URLSearchParams(location.search).get("slug");
  const post = posts.find(p => p.slug === slug);

  if (!post){
    $("#content").innerHTML = "<p>글을 찾을 수 없음</p>";
    return;
  }

  document.title = `${post.title} • 향의 기술블로그`;
  $("#title").textContent = post.title;
  $("#summary").textContent = post.summary || "";

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
      await navigator.clipboard.writeText(code.innerText);
      btn.textContent = "Copied";
      setTimeout(() => (btn.textContent = "Copy"), 1200);
    };

    pre.appendChild(btn);
  });
}

/* ---------- bootstrap ---------- */
(async function init(){
  try{
    const posts = await loadPosts();
    if (location.pathname.endsWith("post.html")){
      await mountPost(posts);
    } else {
      mountIndex(posts);
    }
  }catch(e){
    document.body.innerHTML =
      `<pre style="color:red">JS ERROR: ${e.message}</pre>`;
  }
})();


