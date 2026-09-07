(function(){
  "use strict";

  var app = document.getElementById("app");
  var toastEl = document.getElementById("toast");

  var route = "home";
  var editMode = false;
  var authenticated = false;
  var showLogin = false;
  var loginError = "";
  var state = null;

  var listMeta = {
    genai: { title: "GenAI Prototypes", intro: "Working prototypes exploring what generative AI can do inside real workflows." },
    rad:   { title: "R&D", intro: "Ongoing experiments, internal tools, and technical explorations." },
    research: { title: "Research", intro: "Written research, studies, and findings." }
  };

  function esc(s){
    return (s === undefined || s === null ? "" : String(s))
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }

  function setPath(obj, path, value){
    var parts = path.split(".");
    var cur = obj;
    for(var i=0;i<parts.length-1;i++){
      var k = /^\d+$/.test(parts[i]) ? Number(parts[i]) : parts[i];
      cur = cur[k];
    }
    var lastKey = /^\d+$/.test(parts[parts.length-1]) ? Number(parts[parts.length-1]) : parts[parts.length-1];
    cur[lastKey] = value;
  }

  function showToast(msg){
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function(){ toastEl.classList.remove("show"); }, 1800);
  }

  // ---------- backend calls ----------
  async function loadState(){
    var res = await fetch("/api/profile");
    state = await res.json();
  }

  async function checkAuth(){
    try{
      var res = await fetch("/api/me");
      var d = await res.json();
      authenticated = !!d.authenticated;
    }catch(e){ authenticated = false; }
  }

  async function saveState(){
    try{
      var res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(state)
      });
      if(res.status === 401){
        authenticated = false; editMode = false;
        showToast("Session expired — please sign in again");
        render();
        return;
      }
      showToast(res.ok ? "Saved" : "Couldn't save");
    }catch(e){
      showToast("Couldn't save — check your connection");
    }
  }

  async function doLogin(password){
    loginError = "";
    try{
      var res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: password })
      });
      var d = await res.json();
      if(!res.ok){ loginError = d.error || "Wrong password"; render(); return; }
      authenticated = true; showLogin = false;
      showToast("Signed in");
      render();
    }catch(e){
      loginError = "Couldn't reach the server"; render();
    }
  }

  async function doLogout(){
    try{ await fetch("/api/logout", { method: "POST", credentials: "include" }); }catch(e){}
    authenticated = false; editMode = false;
    showToast("Signed out");
    render();
  }

  // ---------- rendering helpers ----------
  function getInitials(name){
    return (name || "?").trim().split(/\s+/).map(function(w){return w[0]||"";}).slice(0,2).join("").toUpperCase();
  }
  function initialsFallbackHtml(name, size, hidden){
    return "<span class=\"avatar avatar-fallback\" style=\"width:"+size+"px;height:"+size+"px;font-size:"+Math.round(size*0.34)+"px;"+(hidden?"display:none;position:absolute;top:0;left:0;":"")+"\">"+esc(getInitials(name))+"</span>";
  }
  function avatarHtml(name, image, size){
    if(image){
      return "<span class=\"avatar-wrap\" style=\"width:"+size+"px;height:"+size+"px;display:inline-block;position:relative;\">"+
        "<img class=\"avatar\" src=\""+esc(image)+"\" alt=\""+esc(name)+"\" style=\"width:"+size+"px;height:"+size+"px;position:absolute;top:0;left:0;\" onerror=\"this.style.display='none';this.nextElementSibling.style.display='flex';\">"+
        initialsFallbackHtml(name, size, true)+
      "</span>";
    }
    return initialsFallbackHtml(name, size, false);
  }

  function navLink(key, label){
    return '<a href="#" data-nav="'+key+'" class="'+(route===key?'active':'')+'">'+esc(label)+'</a>';
  }

  function renderHeader(){
    var editBtn = authenticated
      ? '<button class="edit-toggle '+(editMode?'active':'')+'" data-action="toggle-edit">'+(editMode ? "\u2713 Done editing" : "\u270E Edit profile")+'</button>'
      : '';
    return ''+
    '<div class="topbar"><div class="topbar-inner">'+
      '<a href="#" data-nav="home" class="brandmark">Divya Chadha\u2019s Lab</a>'+
      '<div class="nav">'+
        navLink("home","Home")+navLink("genai","GenAI Prototypes")+navLink("rad","R&D")+navLink("research","Research")+
      '</div>'+
      editBtn+
    '</div></div>'+
    '<div class="identity">'+
      avatarHtml(state.name, state.image, 46)+
      '<div class="identity-text">'+
        '<a href="#" data-nav="home" class="identity-name serif">'+esc(state.name)+'</a>'+
        '<div class="identity-desc">'+esc(state.tagline)+'</div>'+
      '</div>'+
      '<button class="identity-link" data-action="copy-link">Copy profile link</button>'+
    '</div>';
  }

  function renderFooter(){
    var ownerBit = authenticated
      ? '<button class="owner-link" data-action="logout">Sign out</button>'
      : '<button class="owner-link" data-action="open-login">Owner sign in</button>';
    return '<footer><div class="mark">Divya Chadha\u2019s Lab</div>'+
      '<div class="sub">A running record of prototypes, research, and work in progress.</div>'+
      ownerBit+
    '</footer>';
  }

  function editToolbar(){
    if(!editMode) return "";
    return '<div class="edit-toolbar"><button class="reset-link" data-action="reset-all">Restore example content</button></div>';
  }

  function renderHome(){
    var q = state.quotes;
    var quals = state.qualifications.map(function(text, i){
      return '<li class="qual-row"><span class="qual-dash">—</span>'+
        '<div class="qual-text" '+(editMode?'contenteditable="true" data-path="qualifications.'+i+'"':'')+'>'+esc(text)+'</div>'+
        (editMode ? '<button class="row-remove" data-action="delete-qual" data-index="'+i+'" title="Remove">\u2715</button>' : '')+
      '</li>';
    }).join("");
    var imageField = editMode ? '<div class="entry-edit-row" style="margin:12px 0 0"><input type="text" placeholder="Image URL" value="'+esc(state.image)+'" data-path="image"><input type="file" accept="image/*" class="image-upload" title="Upload an image instead"></div>' : "";

    return ''+
      editToolbar()+
      '<p class="eyebrow">Profile</p>'+
      '<h1 class="hero-name serif" '+(editMode?'contenteditable="true" data-path="name"':'')+'>'+esc(state.name)+'</h1>'+
      '<p class="hero-role" '+(editMode?'contenteditable="true" data-path="title"':'')+'>'+esc(state.title)+'</p>'+
      imageField+
      '<div class="quotes-grid">'+
        '<div class="quote-card"><p class="quote-label">On dedication</p><p class="quote-text serif" '+(editMode?'contenteditable="true" data-path="quotes.dedication"':'')+'>\u201C'+esc(q.dedication)+'\u201D</p></div>'+
        '<div class="quote-card"><p class="quote-label">On enthusiasm</p><p class="quote-text serif" '+(editMode?'contenteditable="true" data-path="quotes.enthusiasm"':'')+'>\u201C'+esc(q.enthusiasm)+'\u201D</p></div>'+
      '</div>'+
      '<div class="section"><h2 class="serif">Role</h2><p class="body" '+(editMode?'contenteditable="true" data-path="jobProfile"':'')+'>'+esc(state.jobProfile)+'</p></div>'+
      '<div class="section"><h2 class="serif">Qualifications</h2><ul class="qual-list">'+quals+'</ul>'+
        (editMode ? '<form class="qual-add" data-addqual="1"><input type="text" name="qualtext" placeholder="e.g. B.Sc, Physics — XYZ University, 2016" required><button class="btn-brass" type="submit">Add</button></form>' : '')+
      '</div>';
  }

  function renderList(key){
    var meta = listMeta[key];
    var items = state[key];
    var entries = items.map(function(item, i){
      var editRow = editMode ? (
        '<div class="entry-edit-row">'+
          '<input type="text" placeholder="Link URL" value="'+esc(item.link)+'" data-path="'+key+'.'+i+'.link">'+
        '</div>'+
        '<div class="entry-actions"><button class="icon-btn danger" data-action="delete-entry" data-list="'+key+'" data-index="'+i+'">Remove entry</button></div>'
      ) : '';
      var linkHtml = editMode ? '' : '<a class="entry-link" href="'+esc(item.link || '#')+'" target="_blank" rel="noopener">View project</a>';
      return ''+
      '<div class="entry">'+
        '<div style="flex:1">'+
          '<p class="entry-index mono">'+String(i+1).padStart(2,"0")+'</p>'+
          '<h3 class="entry-name serif" '+(editMode?'contenteditable="true" data-path="'+key+'.'+i+'.name"':'')+'>'+esc(item.name)+'</h3>'+
          '<p class="entry-desc" '+(editMode?'contenteditable="true" data-path="'+key+'.'+i+'.description"':'')+'>'+esc(item.description)+'</p>'+
          linkHtml+editRow+
        '</div>'+
      '</div>';
    }).join("");

    var addForm = editMode ? (
      '<div class="add-form"><h3>Add a new entry</h3><form data-addlist="'+key+'">'+
        '<div class="fields"><input type="text" name="name" placeholder="Name" required>'+
        '<input type="text" name="link" placeholder="Link URL"></div>'+
        '<textarea name="description" placeholder="Short description"></textarea>'+
        '<div style="margin-top:10px"><button class="btn-brass" type="submit">Add entry</button></div>'+
      '</form></div>'
    ) : '';

    return ''+editToolbar()+
      '<div class="page-head"><p class="eyebrow">'+esc(meta.title)+'</p><h1 class="serif">'+esc(meta.title)+'</h1><p>'+esc(meta.intro)+'</p></div>'+
      entries+addForm;
  }

  function renderLoginModal(){
    if(!showLogin) return "";
    return '<div class="modal-overlay" data-action="modal-backdrop">'+
      '<div class="modal-card" data-stop="1">'+
        '<h3 class="serif">Owner sign in</h3>'+
        '<p class="hint">Enter the site password to edit this profile.</p>'+
        '<form data-login="1">'+
          '<input type="password" name="password" placeholder="Password" autofocus required>'+
          '<div class="modal-error">'+esc(loginError)+'</div>'+
          '<div class="modal-actions">'+
            '<button type="button" class="modal-cancel" data-action="close-login">Cancel</button>'+
            '<button type="submit" class="btn-brass">Sign in</button>'+
          '</div>'+
        '</form>'+
      '</div>'+
    '</div>';
  }

  function render(){
    var body = route === "home" ? renderHome() : renderList(route);
    app.innerHTML = '<div class="'+(editMode?'editing':'')+'">'+
      renderHeader()+
      '<div class="page">'+body+'</div>'+
      renderFooter()+
    '</div>'+renderLoginModal();
  }

  // ---------- image upload ----------
  function readFileAsDataUrl(file){
    return new Promise(function(resolve, reject){
      var reader = new FileReader();
      reader.onload = function(){ resolve(reader.result); };
      reader.onerror = function(){ reject(new Error("Couldn't read file")); };
      reader.readAsDataURL(file);
    });
  }

  async function uploadImageFile(file){
    var dataUrl = await readFileAsDataUrl(file);
    var res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ filename: file.name, dataUrl: dataUrl })
    });
    var data = await res.json().catch(function(){ return {}; });
    if(!res.ok){ throw new Error(data.error || "Upload failed"); }
    return data.url;
  }

  // ---------- events ----------
  app.addEventListener("click", function(e){
    var navEl = e.target.closest("[data-nav]");
    if(navEl){ e.preventDefault(); route = navEl.getAttribute("data-nav"); render(); return; }

    var toggleEl = e.target.closest('[data-action="toggle-edit"]');
    if(toggleEl){ editMode = !editMode; render(); return; }

    var copyEl = e.target.closest('[data-action="copy-link"]');
    if(copyEl){
      var url = window.location.href;
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(url).then(function(){ showToast("Link copied"); }).catch(function(){ showToast(url); });
      }else{ showToast(url); }
      return;
    }

    var delQual = e.target.closest('[data-action="delete-qual"]');
    if(delQual){ state.qualifications.splice(Number(delQual.getAttribute("data-index")),1); saveState(); render(); return; }

    var delEntry = e.target.closest('[data-action="delete-entry"]');
    if(delEntry){
      var list = delEntry.getAttribute("data-list");
      state[list].splice(Number(delEntry.getAttribute("data-index")),1);
      saveState(); render(); return;
    }

    var resetEl = e.target.closest('[data-action="reset-all"]');
    if(resetEl){
      if(window.confirm("Restore example content? This replaces everything currently saved.")){
        fetch("/api/profile/reset", { method: "POST", credentials: "include" })
          .then(function(res){ return res.json(); })
          .then(function(data){ state = data; showToast("Restored"); render(); })
          .catch(function(){ showToast("Couldn't reset"); });
      }
      return;
    }

    var openLogin = e.target.closest('[data-action="open-login"]');
    if(openLogin){ showLogin = true; loginError = ""; render(); return; }

    var closeLogin = e.target.closest('[data-action="close-login"]');
    if(closeLogin){ showLogin = false; render(); return; }

    var backdrop = e.target.closest('[data-action="modal-backdrop"]');
    if(backdrop && !e.target.closest('[data-stop]')){ showLogin = false; render(); return; }

    var logoutEl = e.target.closest('[data-action="logout"]');
    if(logoutEl){ doLogout(); return; }
  });

  app.addEventListener("change", function(e){
    var fileInput = e.target.closest(".image-upload");
    if(!fileInput) return;
    var file = fileInput.files && fileInput.files[0];
    if(!file) return;
    var textInput = fileInput.previousElementSibling;
    if(!textInput || textInput.tagName !== "INPUT"){ showToast("Couldn't find the image field to fill in"); return; }

    fileInput.disabled = true;
    showToast("Uploading image…");
    uploadImageFile(file).then(function(url){
      textInput.value = url;
      var path = textInput.getAttribute("data-path");
      if(path){
        setPath(state, path, url);
        saveState();
        render();
      } else {
        showToast("Image uploaded");
        fileInput.disabled = false;
      }
    }).catch(function(err){
      showToast(err.message || "Upload failed");
      fileInput.disabled = false;
    });
  });

  app.addEventListener("focusout", function(e){
    var t = e.target;
    if(!t || !t.getAttribute) return;
    var path = t.getAttribute("data-path");
    if(!path) return;
    var value = t.isContentEditable ? t.innerText.trim() : t.value;
    setPath(state, path, value);
    saveState();
  });

  app.addEventListener("submit", function(e){
    var loginForm = e.target.closest('[data-login]');
    if(loginForm){
      e.preventDefault();
      var pw = new FormData(loginForm).get("password");
      doLogin(pw);
      return;
    }
    var addQualForm = e.target.closest('[data-addqual]');
    if(addQualForm){
      e.preventDefault();
      var val = addQualForm.querySelector('input[name="qualtext"]').value.trim();
      if(val){ state.qualifications.push(val); saveState(); render(); }
      return;
    }
    var addListForm = e.target.closest('[data-addlist]');
    if(addListForm){
      e.preventDefault();
      var key = addListForm.getAttribute("data-addlist");
      var fd = new FormData(addListForm);
      var name = (fd.get("name")||"").toString().trim();
      if(!name) return;
      var maxId = state[key].reduce(function(m,it){return Math.max(m,it.id||0);},0);
      state[key].push({
        id: maxId+1, name: name,
        link: (fd.get("link")||"").toString().trim() || "#",
        description: (fd.get("description")||"").toString().trim()
      });
      saveState(); render();
      return;
    }
  });

  (async function init(){
    await Promise.all([loadState(), checkAuth()]);
    render();
  })();
})();
