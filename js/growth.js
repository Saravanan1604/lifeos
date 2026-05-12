// ===== EMOTION JOURNAL =====
let journalShowAll = false;
let journalSelectedDate = null; // null = today

function renderJournal() {
  const entries = [...(STATE.emotionEntries||[])].sort((a,b)=>b.date.localeCompare(a.date));
  const targetDate = journalSelectedDate || today();
  const editEntry = entries.find(e=>e.date===targetDate);
  const moodEmojis=['','😞','😟','😐','🙂','😊','😄','😁','🤩','😍','🥰'];
  const moodColors=['','#ef4444','#f97316','#f59e0b','#84cc16','#22c55e','#10b981','#06b6d4','#3b82f6','#8b5cf6','#ec4899'];
  const tags=['Anxious','Happy','Stressed','Calm','Excited','Tired','Grateful','Motivated','Sad','Focused'];
  const isToday = targetDate === today();

  document.getElementById('page-container').innerHTML=`
    <div class="fade-in">
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px">
        <div><h1 class="page-title">😊 Emotion Journal</h1><p class="page-subtitle">Track your emotional wellbeing daily</p></div>
        <div style="display:flex;align-items:center;gap:10px">
          <label style="font-size:12px;color:var(--text3)">Write for date:</label>
          <input type="date" id="j-date-pick" class="form-input" style="width:auto;padding:7px 12px"
            value="${targetDate}" max="${today()}"
            onchange="journalSelectedDate=this.value;selectedJournalMood=5;selectedJournalTags=[];renderJournal()"/>
        </div>
      </div>

      <!-- Write Entry Card -->
      <div class="glass-card" style="padding:22px;margin-bottom:20px">
        <div class="section-header">
          <p class="section-title">${isToday ? "Today's Check-In" : "Writing for " + fmtDate(targetDate)}</p>
          ${editEntry?'<span class="tag tag-green">✓ Saved</span>':''}
        </div>
        <p style="font-size:13px;color:var(--text3);margin-bottom:12px">How are you feeling? (1 = worst · 10 = best)</p>
        <div class="mood-grid" id="journal-mood-grid">
          ${[1,2,3,4,5,6,7,8,9,10].map(n=>`<button class="mood-btn${editEntry?.moodScore===n?' selected':''}" onclick="selectJournalMood(${n})" id="jmood-${n}">${moodEmojis[n]}<span style="font-size:10px;display:block">${n}</span></button>`).join('')}
        </div>
        <div class="form-group" style="margin-top:14px"><label class="form-label">Tags (tap to select)</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px">
            ${tags.map(t=>`<button class="tag tag-blue" id="jtag-${t}" onclick="toggleJournalTag('${t}')" style="cursor:pointer;padding:6px 12px">${t}</button>`).join('')}
          </div>
        </div>
        <div class="form-group" style="margin-top:14px"><label class="form-label">Journal Entry</label>
          <textarea id="j-note" class="form-input" placeholder="Write your thoughts, wins, or what's on your mind..." style="min-height:110px">${editEntry?.note||''}</textarea>
        </div>
        <div style="display:flex;gap:10px;margin-top:14px">
          <button class="btn-primary" onclick="saveJournalEntry()">💾 Save Entry</button>
          ${!isToday?`<button class="btn-secondary" onclick="journalSelectedDate=null;renderJournal()">↩ Back to Today</button>`:''}
        </div>
      </div>

      <!-- Past Entries -->
      ${entries.length>0?`
      <div class="glass-card" style="overflow:hidden">
        <div style="padding:14px 20px;border-bottom:1px solid var(--glass-border);display:flex;justify-content:space-between;align-items:center">
          <p class="section-title">📅 Past Entries <span style="font-size:12px;font-weight:400;color:var(--text3)">${entries.length} total</span></p>
          ${entries.length>5?`<button class="btn-secondary btn-sm" onclick="journalShowAll=!journalShowAll;renderJournal()">${journalShowAll?'Show Less ▲':'View All ▼'}</button>`:''}
        </div>
        ${(journalShowAll?entries:entries.slice(0,5)).map(e=>`
          <div style="padding:14px 20px;border-bottom:1px solid var(--glass-border);cursor:pointer;transition:.15s" 
               onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background=''">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
              <div style="display:flex;align-items:center;gap:10px">
                <div style="width:40px;height:40px;border-radius:12px;background:${moodColors[e.moodScore||5]}22;display:flex;align-items:center;justify-content:center;font-size:22px">${moodEmojis[e.moodScore||5]}</div>
                <div>
                  <p style="font-size:13px;font-weight:600">${fmtDate(e.date)}</p>
                  <p style="font-size:11px;color:var(--text3)">Mood: ${e.moodScore||'?'}/10</p>
                </div>
              </div>
              <div style="display:flex;gap:8px;align-items:center">
                <button onclick="journalSelectedDate='${e.date}';selectedJournalMood=${e.moodScore||5};selectedJournalTags=[];renderJournal();window.scrollTo(0,0)" 
                  style="background:rgba(0,201,167,0.12);border:1px solid rgba(0,201,167,0.25);color:var(--teal);border-radius:8px;padding:4px 10px;cursor:pointer;font-size:12px">✏️ Edit</button>
                <button onclick="deleteJournalEntry('${e.id}')" 
                  style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);color:#ef4444;border-radius:8px;padding:4px 8px;cursor:pointer;font-size:12px">✕</button>
              </div>
            </div>
            ${e.tags?.length?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">${e.tags.map(t=>`<span class="tag tag-purple" style="font-size:11px">${t}</span>`).join('')}</div>`:''}
            ${e.note?`<p style="font-size:13px;color:var(--text2);line-height:1.6">${e.note}</p>`:''}
          </div>`).join('')}
      </div>`:''}
    </div>`;

  // Restore saved state
  if(editEntry?.tags){
    editEntry.tags.forEach(t=>{
      const el=document.getElementById('jtag-'+t);
      if(el){el.classList.remove('tag-blue');el.classList.add('tag-purple');}
    });
    selectedJournalMood=editEntry.moodScore||5;
    selectedJournalTags=[...(editEntry.tags||[])];
  } else {
    selectedJournalMood=5;
    selectedJournalTags=[];
  }
}

let selectedJournalMood=5;
let selectedJournalTags=[];
function selectJournalMood(n){
  selectedJournalMood=n;
  document.querySelectorAll('.mood-btn').forEach(b=>b.classList.remove('selected'));
  document.getElementById('jmood-'+n)?.classList.add('selected');
}
function toggleJournalTag(t){
  const el=document.getElementById('jtag-'+t);
  if(!el)return;
  const idx=selectedJournalTags.indexOf(t);
  if(idx>=0){selectedJournalTags.splice(idx,1);el.classList.remove('tag-purple');el.classList.add('tag-blue');}
  else{selectedJournalTags.push(t);el.classList.remove('tag-blue');el.classList.add('tag-purple');}
}
function saveJournalEntry(){
  const note=document.getElementById('j-note').value.trim();
  const date=journalSelectedDate||today();
  const entry={id:genId(),date,moodScore:selectedJournalMood,tags:[...selectedJournalTags],note,createdAt:new Date().toISOString()};
  STATE.emotionEntries=STATE.emotionEntries||[];
  const idx=STATE.emotionEntries.findIndex(e=>e.date===date);
  if(idx>=0)STATE.emotionEntries[idx]={...STATE.emotionEntries[idx],...entry};
  else STATE.emotionEntries.push(entry);
  saveState();addXP(10,'Journal entry saved');selectedJournalTags=[];
  toast('Journal saved! +10 XP 😊','success');renderJournal();
}
function deleteJournalEntry(id){
  STATE.emotionEntries=(STATE.emotionEntries||[]).filter(e=>e.id!==id);
  saveState();toast('Entry deleted','info');renderJournal();
}

// ===== CAREER HUB =====
function renderCareer(){
  const skills=STATE.skills||[];
  const jobs=STATE.jobApplications||[];

  document.getElementById('page-container').innerHTML=`
    <div class="fade-in">
      <div class="page-header"><h1 class="page-title">💼 Career Hub</h1><p class="page-subtitle">Grow your skills and track opportunities</p></div>
      <div class="stat-grid">
        <div class="stat-card bg-blue"><span class="stat-card-icon">🎓</span><div class="stat-card-value">${skills.length}</div><div class="stat-card-label">Skills Tracked</div></div>
        <div class="stat-card bg-indigo"><span class="stat-card-icon">📋</span><div class="stat-card-value">${jobs.length}</div><div class="stat-card-label">Applications</div></div>
        <div class="stat-card bg-emerald"><span class="stat-card-icon">✅</span><div class="stat-card-value">${jobs.filter(j=>j.status==='Offer').length}</div><div class="stat-card-label">Offers Received</div></div>
        <div class="stat-card bg-amber"><span class="stat-card-icon">⭐</span><div class="stat-card-value">${skills.length>0?(skills.reduce((s,sk)=>s+sk.proficiency,0)/skills.length).toFixed(1):0}/5</div><div class="stat-card-label">Avg Skill Level</div></div>
      </div>

      <!-- Skills -->
      <div class="glass-card" style="padding:20px;margin-bottom:20px">
        <div class="section-header">
          <p class="section-title">🎓 Skills</p>
          <button class="btn-primary btn-sm" onclick="openAddSkillModal()">+ Add Skill</button>
        </div>
        ${skills.length===0
          ?`<p style="color:rgba(241,245,249,0.4);font-size:13px;padding:16px 0">No skills yet. Add your technical and soft skills.</p>`
          :`<div style="display:flex;flex-wrap:wrap;gap:10px">
            ${skills.map(sk=>`
              <div class="skill-badge" style="position:relative">
                <span>${sk.category==='Tech'?'💻':sk.category==='Business'?'📊':sk.category==='Creative'?'🎨':'🧠'}</span>
                <span>${sk.name}</span>
                <span class="skill-stars">${'★'.repeat(sk.proficiency)}${'☆'.repeat(5-sk.proficiency)}</span>
                <button onclick="deleteSkill('${sk.id}')" style="background:none;border:none;color:rgba(239,68,68,0.6);cursor:pointer;font-size:12px;margin-left:4px">✕</button>
              </div>`).join('')}
          </div>`}
      </div>

      <!-- Job Applications -->
      <div class="glass-card" style="overflow:hidden">
        <div style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center">
          <p class="section-title">📋 Job Applications</p>
          <button class="btn-primary btn-sm" onclick="openAddJobModal()">+ Add Application</button>
        </div>
        ${jobs.length===0
          ?`<div class="empty-state"><span class="empty-state-icon">📋</span><p>No applications tracked yet.</p></div>`
          :jobs.map(j=>{
            const stColors={Applied:'tag-blue',Interview:'tag-gold',Offer:'tag-green',Rejected:'tag-red'};
            return `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 20px;border-bottom:1px solid rgba(255,255,255,0.04)">
              <div><p style="font-weight:600;font-size:14px">${j.role}</p><p style="font-size:12px;color:rgba(241,245,249,0.5)">${j.company} · ${fmtDate(j.date)}</p></div>
              <div style="display:flex;align-items:center;gap:8px">
                <span class="tag ${stColors[j.status]||'tag-blue'}">${j.status}</span>
                <button class="btn-icon btn-sm" onclick="deleteJob('${j.id}')" style="color:#ef4444;border-color:rgba(239,68,68,0.3)">✕</button>
              </div>
            </div>`;
          }).join('')}
      </div>
    </div>`;
}

function openAddSkillModal(){
  openModal('Add Skill',`
    <div class="form-group"><label class="form-label">Skill Name</label><input type="text" id="sk-name" class="form-input" placeholder="e.g. React, Python, Leadership"/></div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Category</label><select id="sk-cat" class="form-input"><option value="Tech">💻 Tech</option><option value="Business">📊 Business</option><option value="Creative">🎨 Creative</option><option value="Soft">🧠 Soft Skill</option></select></div>
      <div class="form-group"><label class="form-label">Proficiency (1-5)</label><input type="number" id="sk-prof" class="form-input" min="1" max="5" placeholder="3"/></div>
    </div>
    <div class="modal-actions"><button class="btn-secondary" onclick="closeModal()">Cancel</button><button class="btn-primary" onclick="saveSkill()">Add Skill</button></div>`);
}
function saveSkill(){
  const name=document.getElementById('sk-name').value.trim();
  const category=document.getElementById('sk-cat').value;
  const proficiency=parseInt(document.getElementById('sk-prof').value)||3;
  if(!name){toast('Enter skill name','error');return;}
  STATE.skills=STATE.skills||[];
  STATE.skills.push({id:genId(),name,category,proficiency});
  saveState();addXP(15,'Skill added');closeModal();toast('Skill added! +15 XP','success');renderCareer();
}
function deleteSkill(id){STATE.skills=(STATE.skills||[]).filter(s=>s.id!==id);saveState();renderCareer();}

function openAddJobModal(){
  openModal('Add Application',`
    <div class="form-group"><label class="form-label">Company</label><input type="text" id="j-company" class="form-input" placeholder="Company name"/></div>
    <div class="form-group"><label class="form-label">Role / Position</label><input type="text" id="j-role" class="form-input" placeholder="e.g. Senior Developer"/></div>
    <div class="input-row">
      <div class="form-group"><label class="form-label">Status</label><select id="j-status" class="form-input"><option>Applied</option><option>Interview</option><option>Offer</option><option>Rejected</option></select></div>
      <div class="form-group"><label class="form-label">Date Applied</label><input type="date" id="j-date" class="form-input" value="${today()}"/></div>
    </div>
    <div class="modal-actions"><button class="btn-secondary" onclick="closeModal()">Cancel</button><button class="btn-primary" onclick="saveJob()">Save</button></div>`);
}
function saveJob(){
  const company=document.getElementById('j-company').value.trim();
  const role=document.getElementById('j-role').value.trim();
  const status=document.getElementById('j-status').value;
  const date=document.getElementById('j-date').value;
  if(!company||!role){toast('Fill required fields','error');return;}
  STATE.jobApplications=STATE.jobApplications||[];
  STATE.jobApplications.push({id:genId(),company,role,status,date:date||today()});
  saveState();addXP(10,'Application tracked');closeModal();toast('Application saved!','success');renderCareer();
}
function deleteJob(id){STATE.jobApplications=(STATE.jobApplications||[]).filter(j=>j.id!==id);saveState();renderCareer();}
