/* ===== 居家训练计划 交互 ===== */
(function(){
  "use strict";

  /* ---------- 今日推荐条 ---------- */
  var DAY_LABEL = ["周一","周二","周三","周四","周五","周六","周日"];
  var WEEK_MAP  = ["A","B","C","A","B","C","rest"];
  var GROUP_TXT = {
    A:"A 推日 · 练 胸 / 三头(手臂) / 肩前 / 核心",
    B:"B 拉日 · 练 背 / 二头(手臂) / 后肩 / 核心",
    C:"C 下肢日 · 练 腿 / 臀 / 核心",
    rest:"休息日 · 完全恢复，明天再战"
  };
  var now = new Date();
  var idx = (now.getDay()+6)%7;           // 周一=0
  var todayType = WEEK_MAP[idx];
  var banner = document.getElementById("today-banner");
  banner.textContent = "今天（"+DAY_LABEL[idx]+"）：" + GROUP_TXT[todayType];

  /* ---------- 动作打卡（本地保存） ---------- */
  var LS_EX = "hwp_ex_done_v1";
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(LS_EX) || "{}"); } catch(e){ saved = {}; }
  function persistEx(){ try{ localStorage.setItem(LS_EX, JSON.stringify(saved)); }catch(e){} }
  var boxes = document.querySelectorAll('.ex input[type=checkbox]');
  boxes.forEach(function(box){
    var id = box.getAttribute("data-id");
    if(saved[id]){ box.checked = true; markDone(box,true); }
    box.addEventListener("change", function(){
      if(box.checked){ saved[id]=1; markDone(box,true); }
      else { delete saved[id]; markDone(box,false); }
      persistEx();
    });
  });
  function markDone(box,on){
    var ex = box.closest(".ex");
    if(ex) ex.classList.toggle("done", on);
  }

  /* ---------- 本周训练日历 ---------- */
  function mondayKey(){
    var d = new Date();
    d.setDate(d.getDate() - idx);
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  }
  var LS_WEEK = "hwp_week_v1";
  var wkData = {};
  try { wkData = JSON.parse(localStorage.getItem(LS_WEEK) || "{}"); } catch(e){ wkData = {}; }
  var key = mondayKey();
  if(!wkData[key]) wkData[key] = {};
  function persistWeek(){ try{ localStorage.setItem(LS_WEEK, JSON.stringify(wkData)); }catch(e){} }

  var weekBox = document.getElementById("track-week");
  var progressBox = document.getElementById("week-progress");
  DAY_LABEL.forEach(function(lbl, i){
    var t = WEEK_MAP[i];
    var done = !!wkData[key][i];
    var div = document.createElement("div");
    div.className = "tw-day" + (i===idx?" today":"") + (done?" done":"") + (t==="rest"?" rest":"");
    var g = t==="rest" ? "休息" : (t==="A"?"推":t==="B"?"拉":"下肢");
    var total = t==="rest" ? "—" : (done?"✓":"○");
    div.innerHTML = '<div class="d">'+lbl+'</div><div class="g">'+g+'</div><div class="n">'+total+'</div>';
    if(t!=="rest"){
      div.addEventListener("click", function(){
        wkData[key][i] = !wkData[key][i];
        persistWeek();
        div.classList.toggle("done", wkData[key][i]);
        div.querySelector(".n").textContent = wkData[key][i]?"✓":"○";
        renderProgress();
      });
    }
    weekBox.appendChild(div);
  });
  function renderProgress(){
    var done = 0;
    for(var i=0;i<7;i++){ if(WEEK_MAP[i]!=="rest" && wkData[key][i]) done++; }
    progressBox.textContent = "本周训练完成：" + done + " / 6 天（剩余 " + (6-done) + " 天）";
  }
  renderProgress();

  var resetBtn = document.getElementById("resetTrack");
  if(resetBtn){
    resetBtn.addEventListener("click", function(){
      wkData[key] = {};
      persistWeek();
      document.querySelectorAll(".tw-day").forEach(function(d){ d.classList.remove("done"); var n=d.querySelector(".n"); if(n && n.textContent!=="—") n.textContent="○"; });
      renderProgress();
    });
  }

  /* ---------- 营养速算 ---------- */
  var cw=document.getElementById("cw"), cl=document.getElementById("cl"), cact=document.getElementById("cact"), out=document.getElementById("calcOut");
  var BMR = 1534;
  function calc(){
    var w=parseFloat(cw.value)||0, l=parseFloat(cl.value)||0, act=parseFloat(cact.value)||1.55;
    var maint=Math.round(BMR*act);
    var prot=Math.round(l*2.2);
    out.innerHTML = "维持热量 <b>"+maint+" kcal</b> ｜ 蛋白质目标 <b>"+prot+" g</b>（≈"+Math.round(prot*4)+" kcal）";
  }
  [cw,cl,cact].forEach(function(el){ el.addEventListener("input", calc); el.addEventListener("change", calc); });
  calc();

  /* ---------- 导航高亮 ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav a"));
  var sections = navLinks.map(function(a){ return document.querySelector(a.getAttribute("href")); });
  if("IntersectionObserver" in window){
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          var id = "#"+e.target.id;
          navLinks.forEach(function(a){ a.classList.toggle("active", a.getAttribute("href")===id); });
        }
      });
    }, {rootMargin:"-45% 0px -50% 0px"});
    sections.forEach(function(s){ if(s) obs.observe(s); });
  }
})();
