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
  var idx = (now.getDay()+6)%7;
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
      pelvisData[key] = {};
      persistPelvis();
      warmData[key] = {};
      persistWarm();
      document.querySelectorAll(".pel-cell").forEach(function(c){ c.classList.remove("done"); var n=c.querySelector(".n"); if(n) n.textContent="○"; });
      renderPelvis();
      renderWarm();
    });
  }

  /* ---------- 骨盆纠正：每天 5 分钟打卡 ---------- */
  var LS_PELVIS = "hwp_pelvis_v1";
  var pelvisData = {};
  try { pelvisData = JSON.parse(localStorage.getItem(LS_PELVIS) || "{}"); } catch(e){ pelvisData = {}; }
  if(!pelvisData[key]) pelvisData[key] = {};
  function persistPelvis(){ try{ localStorage.setItem(LS_PELVIS, JSON.stringify(pelvisData)); }catch(e){} }
  var pelvisBox = document.getElementById("pelvisWeek");
  var pelvisProg = document.getElementById("pelvisProgress");
  function renderPelvis(){
    if(!pelvisProg) return;
    var n=0; for(var i=0;i<7;i++){ if(pelvisData[key][i]) n++; }
    pelvisProg.textContent = "本周骨盆纠正：" + n + " / 7 天";
  }
  if(pelvisBox){
    DAY_LABEL.forEach(function(lbl,i){
      var cell = document.createElement("div");
      cell.className = "pel-cell" + (i===idx?" today":"") + (pelvisData[key][i]?" done":"");
      cell.innerHTML = '<div class="d">'+lbl+'</div><div class="n">'+(pelvisData[key][i]?"✓":"○")+'</div>';
      cell.addEventListener("click", function(){
        pelvisData[key][i] = !pelvisData[key][i];
        persistPelvis();
        cell.classList.toggle("done", pelvisData[key][i]);
        cell.querySelector(".n").textContent = pelvisData[key][i]?"✓":"○";
        renderPelvis();
      });
      pelvisBox.appendChild(cell);
    });
  }
  renderPelvis();

  /* ---------- 热身 + 拉伸：每天打卡 ---------- */
  var LS_WARM = "hwp_warm_v1";
  var warmData = {};
  try { warmData = JSON.parse(localStorage.getItem(LS_WARM) || "{}"); } catch(e){ warmData = {}; }
  if(!warmData[key]) warmData[key] = {};
  function persistWarm(){ try{ localStorage.setItem(LS_WARM, JSON.stringify(warmData)); }catch(e){} }
  var warmBox = document.getElementById("warmWeek");
  var warmProg = document.getElementById("warmProgress");
  function renderWarm(){
    if(!warmProg) return;
    var n=0; for(var i=0;i<7;i++){ if(warmData[key][i]) n++; }
    warmProg.textContent = "本周热身＋拉伸：" + n + " / 7 天";
  }
  if(warmBox){
    DAY_LABEL.forEach(function(lbl,i){
      var cell = document.createElement("div");
      cell.className = "pel-cell warm-cell" + (i===idx?" today":"") + (warmData[key][i]?" done":"");
      cell.innerHTML = '<div class="d">'+lbl+'</div><div class="n">'+(warmData[key][i]?"✓":"○")+'</div>';
      cell.addEventListener("click", function(){
        warmData[key][i] = !warmData[key][i];
        persistWarm();
        cell.classList.toggle("done", warmData[key][i]);
        cell.querySelector(".n").textContent = warmData[key][i]?"✓":"○";
        renderWarm();
      });
      warmBox.appendChild(cell);
    });
  }
  renderWarm();

  /* ---------- 营养：身体数据 → 全天营养 → 四餐 → 食材换算 → 周备餐 ---------- */
  /* 微量营养素字段顺序(每100g/100ml)：
     [0]维A μgRAE [1]维D μg [2]维E mg [3]维K μg [4]B1 mg [5]B2 mg [6]B3 mgNE
     [7]B6 mg [8]B12 μg [9]叶酸 μgDFE [10]维C mg [11]钙 mg [12]铁 mg [13]锌 mg
     [14]镁 mg [15]硒 μg [16]钾 mg
     数据来源：USDA FoodData Central 标准参考值（生重/干重；液体按100ml） */
  var FOODS = [
    // 蛋白来源
    {n:"鸡胸肉(生,去皮)",cat:"protein",p:22.5,f:2.6,c:0,fi:0,k:120,unit:"g",note:"USDA：最便宜纯蛋白",mi:[3,0.1,0.21,0.3,0.07,0.11,10.6,0.6,0.21,4,0,5,0.4,0.7,28,22.8,334]},
    {n:"鸡腿肉(去皮生)",cat:"protein",p:18.6,f:7.9,c:0,fi:0,k:144,unit:"g",note:"比鸡胸香，脂肪略高",mi:[11,0.1,0.3,0.5,0.08,0.16,5.5,0.4,0.5,6,0,8,0.8,1.6,22,17,240]},
    {n:"瘦牛肉(生)",cat:"protein",p:21,f:4.5,c:0,fi:0,k:125,unit:"g",note:"红肉，含铁高",mi:[0,0.1,0.4,1.5,0.06,0.16,5.5,0.5,1.5,7,0,12,2.6,4.8,20,20,320]},
    {n:"牛里脊(生)",cat:"protein",p:22,f:3,c:0,fi:0,k:125,unit:"g",note:"嫩，脂肪低",mi:[0,0.1,0.3,1.4,0.07,0.12,5.0,0.5,1.2,6,0,18,1.9,4.0,22,26,330]},
    {n:"猪里脊(生)",cat:"protein",p:20,f:6,c:0,fi:0,k:134,unit:"g",note:"家常白肉，B1高",mi:[2,0.6,0.3,0.5,0.7,0.2,5.0,0.5,0.5,5,0,5,0.8,2.0,25,30,350]},
    {n:"三文鱼(生)",cat:"protein",p:20.3,f:13.1,c:0,fi:0,k:208,unit:"g",note:"USDA：优质脂肪Omega-3",mi:[12,11,3.5,0.5,0.2,0.2,8.5,0.6,3.2,26,0,9,0.3,0.4,27,25,363]},
    {n:"鳕鱼(生)",cat:"protein",p:18,f:1,c:0,fi:0,k:85,unit:"g",note:"极低脂白肉",mi:[12,0.9,0.8,0.1,0.08,0.07,2.1,0.2,0.9,7,0,16,0.4,0.5,32,33,413]},
    {n:"虾仁(生)",cat:"protein",p:20,f:0.5,c:0,fi:0,k:85,unit:"g",note:"低脂高蛋白，硒高",mi:[54,0.1,1.3,0.3,0.02,0.03,2.6,0.1,1.1,9,0,54,0.5,1.3,39,35,259]},
    {n:"鸡蛋(全蛋)",cat:"protein",p:12.6,f:9.5,c:0.7,fi:0,k:143,unit:"g",note:"约50g/个=蛋白6.3g",mi:[160,2.0,1.05,0.3,0.04,0.46,0.07,0.17,0.89,47,0,56,1.75,1.29,12,30.7,138]},
    {n:"蛋清",cat:"protein",p:10.9,f:0.2,c:0.7,fi:0,k:52,unit:"g",note:"纯蛋白几乎无脂，约33g/个",mi:[0,0,0,0,0.004,0.44,0.1,0.005,0.09,4,0,7,0.08,0.03,11,20,163]},
    {n:"牛奶(全脂)",cat:"protein",p:3.2,f:3.6,c:4.8,fi:0,k:61,unit:"ml",note:"每100ml，补钙主力",mi:[46,1.3,0.07,0.3,0.02,0.17,0.09,0.04,0.45,5,0.9,113,0.03,0.4,10,3.7,132]},
    {n:"无糖希腊酸奶",cat:"protein",p:10,f:0.4,c:3.6,fi:0,k:59,unit:"g",note:"选无糖，钙高",mi:[1,0.1,0.01,0.2,0.02,0.28,0.2,0.06,0.75,7,0,110,0.04,0.5,11,9.7,141]},
    {n:"北豆腐(硬)",cat:"protein",p:17.3,f:8.7,c:2.8,fi:0.4,k:144,unit:"g",note:"植物蛋白+钙",mi:[0,0,0.4,2.0,0.08,0.05,0.1,0.05,0,15,0,138,5.4,0.8,30,8.9,121]},
    {n:"毛豆(熟)",cat:"protein",p:13,f:6,c:11,fi:4,k:140,unit:"g",note:"植物蛋白+叶酸",mi:[9,0,0.68,26.8,0.2,0.15,1.6,0.1,0,165,6,63,2.3,1.4,64,1.5,436]},
    {n:"乳清蛋白粉",cat:"protein",p:80,f:6,c:8,fi:0,k:400,unit:"g",note:"一勺约30g=24g蛋白",mi:[0,0,0,0,0.1,1.5,1.0,1.0,1.5,10,0,500,1.5,3.0,50,20,500]},
    // 碳水来源
    {n:"燕麦(干)",cat:"carb",p:17,f:7,c:66,fi:10,k:379,unit:"g",note:"慢碳，煮前称重",mi:[0,0,0.4,2.0,0.76,0.14,0.96,0.12,0,56,0,54,4.7,4.0,177,34,429]},
    {n:"糙米(熟)",cat:"carb",p:2.6,f:0.9,c:23,fi:1.8,k:112,unit:"g",note:"主食换精白米，镁高",mi:[0,0,0.02,0.2,0.1,0.01,1.5,0.1,0,4,0,10,0.4,0.6,43,7.5,79]},
    {n:"白米饭(熟)",cat:"carb",p:2.7,f:0.3,c:28,fi:0.4,k:130,unit:"g",note:"常吃的主食",mi:[0,0,0.01,0.1,0.02,0.01,0.4,0.03,0,3,0,10,0.2,0.4,12,7.5,35]},
    {n:"红薯(蒸)",cat:"carb",p:1.6,f:0.1,c:20,fi:3,k:90,unit:"g",note:"优质慢碳，维A极高",mi:[709,0,0.6,1.8,0.08,0.05,0.6,0.2,0,6,2.4,27,0.6,0.3,18,0.6,230]},
    {n:"土豆(蒸)",cat:"carb",p:2,f:0.1,c:20,fi:1.8,k:87,unit:"g",note:"低脂慢碳，钾高",mi:[0,0,0.03,1.5,0.08,0.02,1.1,0.3,0,10,13,8,0.3,0.3,20,0.3,328]},
    {n:"香蕉",cat:"carb",p:1.1,f:0.3,c:23,fi:2.6,k:89,unit:"g",note:"练后快碳，钾高",mi:[3,0,0.1,0.5,0.03,0.07,0.7,0.37,0,20,8.7,5,0.26,0.15,27,1.0,358]},
    {n:"全麦面包",cat:"carb",p:13,f:3.4,c:41,fi:7,k:247,unit:"g",note:"看配料表，真全麦",mi:[0,0,0.9,1.4,0.4,0.2,4.0,0.2,0,42,0,107,2.5,1.8,82,25,254]},
    {n:"意大利面(熟)",cat:"carb",p:5,f:1,c:25,fi:1.8,k:130,unit:"g",note:"慢碳主食",mi:[0,0,0.06,0.1,0.1,0.03,1.0,0.05,0,62,0,7,0.5,0.5,18,26,44]},
    // 蔬菜（看纤维 + 维生素矿物质）
    {n:"西兰花(生)",cat:"veg",p:2.8,f:0.4,c:6.6,fi:2.6,k:34,unit:"g",note:"维C+维K双高",mi:[31,0,0.78,101.6,0.07,0.12,0.64,0.18,0,63,89,47,0.73,0.41,21,2.5,316]},
    {n:"菠菜(生)",cat:"veg",p:2.9,f:0.4,c:3.6,fi:2.2,k:23,unit:"g",note:"叶酸+维K极高（草酸影响铁吸收）",mi:[469,0,2.0,483,0.08,0.19,0.72,0.2,0,194,28,99,2.7,0.53,79,1.0,558]},
    {n:"生菜",cat:"veg",p:1.4,f:0.2,c:2.9,fi:1.3,k:15,unit:"g",note:"低卡 filler，维K高",mi:[370,0,0.22,102,0.07,0.08,0.38,0.09,0,38,9.2,36,0.86,0.18,13,0.6,194]},
    {n:"番茄",cat:"veg",p:0.9,f:0.2,c:3.9,fi:1.2,k:18,unit:"g",note:"维生素C",mi:[42,0,0.54,7.9,0.04,0.02,0.59,0.08,0,15,13.7,10,0.27,0.17,11,0,237]},
    {n:"黄瓜",cat:"veg",p:0.7,f:0.1,c:3.6,fi:0.5,k:15,unit:"g",note:"低卡补水",mi:[5,0,0.03,16.4,0.03,0.03,0.1,0.04,0,7,2.8,16,0.28,0.2,13,0.3,147]},
    {n:"胡萝卜(生)",cat:"veg",p:0.9,f:0.2,c:9.6,fi:2.8,k:41,unit:"g",note:"β-胡萝卜素(维A)之王",mi:[835,0,0.66,13.2,0.07,0.06,0.98,0.14,0,19,5.9,33,0.3,0.24,12,0.1,320]},
    {n:"西葫芦",cat:"veg",p:1.2,f:0.3,c:3.1,fi:1.0,k:17,unit:"g",note:"低卡蔬菜",mi:[10,0,0.12,4.3,0.05,0.09,0.45,0.16,0,24,17.9,16,0.37,0.32,18,0.2,261]},
    // 脂肪来源
    {n:"花生酱",cat:"fat",p:25,f:50,c:20,fi:6,k:588,unit:"g",note:"脂肪+维E+镁",mi:[0,0,9.1,0.3,0.15,0.19,13.7,0.6,0,87,0,43,1.9,2.9,168,4.5,649]},
    {n:"杏仁",cat:"fat",p:21,f:49,c:22,fi:12.5,k:579,unit:"g",note:"维E之冠，钙镁高",mi:[0,0,25.6,0,0.21,1.14,3.6,0.14,0,44,0,269,3.7,3.1,270,4.1,733]},
    {n:"橄榄油",cat:"fat",p:0,f:100,c:0,fi:0,k:900,unit:"g",note:"纯脂肪，维E+维K",mi:[0,0,14.4,60.2,0,0,0,0,0,0,0,1,0.56,0,0,0,1]}
  ];

  /* 17 项微量营养素元数据：每日目标(中国居民膳食营养素参考摄入量 DRIs 2023，成年男 18-49 岁)、
     主要食物来源、缺乏表现、以及"补缺推荐食材"(从上面库里挑最富集的) */
  var MI = [
    {n:"维生素A", u:"μg", t:800,  grp:"v", fix:"胡萝卜(生)", src:"胡萝卜、红薯、菠菜、蛋黄"},
    {n:"维生素D", u:"μg", t:10,   grp:"v", fix:"三文鱼(生)", src:"三文鱼、蛋黄、日晒"},
    {n:"维生素E", u:"mg", t:14,   grp:"v", fix:"杏仁",       src:"杏仁、花生酱、橄榄油"},
    {n:"维生素K", u:"μg", t:80,   grp:"v", fix:"菠菜(生)",   src:"菠菜、西兰花、生菜"},
    {n:"维生素B1", u:"mg", t:1.4, grp:"v", fix:"猪里脊(生)", src:"猪里脊、燕麦、全麦"},
    {n:"维生素B2", u:"mg", t:1.4, grp:"v", fix:"牛奶(全脂)", src:"牛奶、鸡蛋、杏仁"},
    {n:"维生素B3", u:"mg", t:15,  grp:"v", fix:"鸡胸肉(生,去皮)", src:"鸡胸、牛肉、花生酱"},
    {n:"维生素B6", u:"mg", t:1.4, grp:"v", fix:"鸡胸肉(生,去皮)", src:"鸡胸、三文鱼、土豆"},
    {n:"维生素B12", u:"μg", t:2.4, grp:"v", fix:"三文鱼(生)", src:"牛肉、三文鱼、牛奶"},
    {n:"叶酸", u:"μg", t:400,     grp:"v", fix:"菠菜(生)",   src:"菠菜、毛豆、西兰花"},
    {n:"维生素C", u:"mg", t:100,  grp:"v", fix:"西兰花(生)", src:"西兰花、番茄、香蕉"},
    {n:"钙", u:"mg", t:800,       grp:"m", fix:"牛奶(全脂)", src:"牛奶、北豆腐、杏仁"},
    {n:"铁", u:"mg", t:12,        grp:"m", fix:"瘦牛肉(生)", src:"瘦牛肉、猪里脊、菠菜"},
    {n:"锌", u:"mg", t:12.5,      grp:"m", fix:"瘦牛肉(生)", src:"瘦牛肉、鸡肉、燕麦"},
    {n:"镁", u:"mg", t:330,       grp:"m", fix:"燕麦(干)",   src:"燕麦、杏仁、菠菜"},
    {n:"硒", u:"μg", t:60,        grp:"m", fix:"虾仁(生)",   src:"虾、鱼、牛肉"},
    {n:"钾", u:"mg", t:2000,      grp:"m", fix:"香蕉",       src:"香蕉、土豆、菠菜"}
  ];
  var MI_MAX = 17;

  var MEALS = [
    {name:"早餐",pct:0.25},
    {name:"午餐",pct:0.35},
    {name:"晚餐",pct:0.25},
    {name:"练后餐",pct:0.15}
  ];

  var CAT_TXT = {protein:"蛋白",carb:"碳水",veg:"蔬菜",fat:"脂肪"};

  function $(id){ return document.getElementById(id); }
  function allFoods(){ return FOODS.concat(customFoods); }
  function findFood(name){ var a=allFoods(); for(var i=0;i<a.length;i++){ if(a[i].n===name) return a[i]; } return null; }

  var customFoods = [];

  // --- 身体数据输入 ---
  var nSex=$("nSex"),nAge=$("nAge"),nH=$("nH"),nW=$("nW"),nBf=$("nBf"),nLbm=$("nLbm"),nAct=$("nAct"),nBmr=$("nBmr");
  function mifflin(){
    var w=parseFloat(nW.value)||0, h=parseFloat(nH.value)||0, a=parseFloat(nAge.value)||0;
    if(!w||!h||!a) return 0;
    return Math.round(10*w + 6.25*h - 5*a + (nSex.value==="male"?5:-161));
  }
  function autoLbm(){
    var w=parseFloat(nW.value)||0, bf=parseFloat(nBf.value)||0;
    if(w>0 && bf>=0 && bf<60){ nLbm.value=(w*(1-bf/100)).toFixed(1); }
  }
  nBf.addEventListener("input", function(){ autoLbm(); calc(); });
  nW.addEventListener("input", function(){ autoLbm(); calc(); });
  $("btnBmr").addEventListener("click", function(){ var b=mifflin(); if(b){ nBmr.value=b; } calc(); });
  [nSex,nAge,nH,nAct,nBmr,nLbm,$("nMode"),$("nDeficit")].forEach(function(el){ if(!el) return; el.addEventListener("input", calc); el.addEventListener("change", calc); });

  var lastResult = null;
  var nMode = $("nMode"), nDeficit = $("nDeficit");
  function calc(){
    var w=parseFloat(nW.value)||0, lbm=parseFloat(nLbm.value)||0, act=parseFloat(nAct.value)||1.375, bmr=parseFloat(nBmr.value)||0;
    if(!w||!lbm||!bmr){ return; }
    var maint = Math.round(bmr*act);
    var mode = nMode ? nMode.value : "cut";
    var dv = nDeficit ? parseFloat(nDeficit.value) : NaN;
    var deficit = mode==="cut" ? Math.max(0, Math.min(600, isNaN(dv)?250:dv)) : 0;
    var target = Math.round(maint - deficit);
    var prot = Math.round(lbm*(mode==="cut"?2.4:2.2));
    prot = Math.max(Math.round(w*1.6), Math.min(prot, Math.round(lbm*2.6)));
    var fat = Math.round(w*0.8);
    var carbCal = target - prot*4 - fat*9;
    var carb = carbCal>0 ? Math.round(carbCal/4) : 0;
    var fiber = Math.max(25, Math.round(target/1000*14));
    var water = Math.round(w*35)/1000;
    var modeTxt = mode==="cut" ? ("小缺口 −"+deficit+" kcal/天") : "维持量 · 无缺口";

    $("macroCards").innerHTML =
      card("目标热量", target, "kcal", modeTxt) +
      card("蛋白质", prot, "g", (mode==="cut"?"瘦体重×2.4":"瘦体重×2.2")+"，约"+Math.round(prot*4)+"kcal") +
      card("脂肪", fat, "g", "体重×0.8，约"+Math.round(fat*9)+"kcal") +
      card("碳水", carb, "g", "剩余热量，约"+Math.round(carb*4)+"kcal") +
      card("膳食纤维", fiber, "g", "热量÷1000×14") +
      card("饮水", water, "L", "训练日 +0.5L");

    var mh = $("modeHint");
    if(mh){
      mh.textContent = mode==="cut"
        ? "维持 "+maint+" kcal → 目标 "+target+" kcal（缺口 "+deficit+"）。每周体重降幅控制在 0.25–0.5% 以内；蛋白按 1.8–2.2 g/kg 给足。"
        : "维持 "+maint+" kcal，不制造缺口；适合状态不稳或想先适应训练的阶段。";
    }
    $("macroFormula").textContent = "计算链：维持热量 = BMR("+bmr+") × 活动系数("+act+") = "+maint+" kcal ｜ "+modeTxt+" → 目标 "+target+" kcal ｜ 蛋白 = 瘦体重("+lbm+"kg)×"+(mode==="cut"?"2.4":"2.2")+" = "+prot+"g ｜ 脂肪 = 体重("+w+"kg)×0.8 = "+fat+"g ｜ 碳水 = (目标−蛋白×4−脂肪×9)÷4 = "+carb+"g。";

    var tb = $("mealTbl").querySelector("tbody");
    tb.innerHTML = MEALS.map(function(m){
      var cal=Math.round(target*m.pct), p=Math.round(prot*m.pct), f=Math.round(fat*m.pct), c=Math.round(carb*m.pct);
      return "<tr><td><b>"+m.name+"</b></td><td>"+Math.round(m.pct*100)+"%</td><td>"+cal+"</td><td>"+p+"</td><td>"+f+"</td><td>"+c+"</td></tr>";
    }).join("");

    lastResult = {maint:maint,target:target,mode:mode,deficit:deficit,prot:prot,fat:fat,carb:carb,fiber:fiber,water:water};
  }
  function card(t,v,u,sub){
    return '<div class="mcard"><div class="m-t">'+t+'</div><div class="m-v">'+v+'<span class="m-u">'+u+'</span></div><div class="m-s">'+sub+'</div></div>';
  }

  // --- 食材库渲染 + 搜索 + 宏量/维生素/矿物质切换 ---
  var foodTab = "macro";
  function miVal(f, i){ return (f.mi && f.mi.length>i) ? f.mi[i] : 0; }
  function fmtV(v){
    if(v>=100) return String(Math.round(v));
    if(v>=10) return String(Math.round(v*10)/10);
    return String(Math.round(v*100)/100);
  }
  function renderFoods(filter){
    var tbl = $("foodTbl"), tb = tbl.querySelector("tbody"), th = tbl.querySelector("thead");
    var list = FOODS.filter(function(f){ return !filter || f.n.indexOf(filter)>=0; });
    if(foodTab==="macro"){
      th.innerHTML = "<tr><th>食材</th><th>蛋白(g)</th><th>脂肪(g)</th><th>碳水(g)</th><th>纤维(g)</th><th>热量(kcal)</th><th>说明</th></tr>";
      tb.innerHTML = list.map(function(f){
        return "<tr><td><b>"+f.n+"</b></td><td>"+f.p+"</td><td>"+f.f+"</td><td>"+f.c+"</td><td>"+f.fi+"</td><td>"+f.k+"</td><td class='muted'>"+f.note+"</td></tr>";
      }).join("") || "<tr><td colspan='7' class='muted'>没找到，换个词试试</td></tr>";
    } else {
      var idxs = [];
      MI.forEach(function(m,i){ if(m.grp===foodTab) idxs.push(i); });
      th.innerHTML = "<tr><th>食材</th>"+idxs.map(function(i){
        return "<th>"+MI[i].n+"<br><span class='th-u'>"+MI[i].u+"/100</span></th>";
      }).join("")+"</tr>";
      tb.innerHTML = list.map(function(f){
        return "<tr><td><b>"+f.n+"</b></td>"+idxs.map(function(i){
          var v = miVal(f,i);
          var rich = v >= MI[i].t/10;   // 100g 能补到目标 10% 以上 = 富集食物
          return "<td class='"+(rich?"hi":"")+"'>"+(v?fmtV(v):"—")+"</td>";
        }).join("")+"</tr>";
      }).join("") || "<tr><td colspan='8' class='muted'>没找到，换个词试试</td></tr>";
    }
  }
  renderFoods("");
  $("foodSearch").addEventListener("input", function(){ renderFoods(this.value.trim()); });
  var ftabs = $("foodTabs");
  if(ftabs){
    ftabs.querySelectorAll(".ftab").forEach(function(b){
      b.addEventListener("click", function(){
        ftabs.querySelectorAll(".ftab").forEach(function(x){ x.classList.remove("active"); });
        b.classList.add("active");
        foodTab = b.getAttribute("data-tab");
        renderFoods($("foodSearch").value.trim());
      });
    });
  }

  // --- 食材下拉（换算器 + 备餐库共用）---
  function fillFoodSelect(sel){
    sel.innerHTML = allFoods().map(function(f,i){ return "<option value='"+f.n+"'>"+f.n+"（蛋"+f.p+"/脂"+f.f+"/碳"+f.c+"/100"+f.unit+"）</option>"; }).join("");
  }
  fillFoodSelect($("convFood"));

  // --- 一键换算 ---
  function convert(){
    var type=$("convType").value, amt=parseFloat($("convAmt").value)||0, name=$("convFood").value;
    var f=findFood(name);
    if(!amt||!f) return;
    var per = type==="p"?f.p : type==="c"?f.c : type==="f"?f.f : f.fi;
    if(per<=0){ $("convOut").innerHTML = "该食材几乎不含此项，换个食材。"; return; }
    var grams = amt / (per/100);
    var ap = grams*f.p/100, af = grams*f.f/100, ac = grams*f.c/100, ak = Math.round(grams*f.k/100);
    var tn = type==="p"?"蛋白":type==="c"?"碳水":type==="f"?"脂肪":"纤维";
    $("convOut").innerHTML = "要吃 <b class='big'>"+Math.round(grams)+" g</b> "+f.n+" 才能凑够 <b>"+amt+"g "+tn+"</b>。<br>这份食材同时含：蛋白 "+Math.round(ap)+"g ｜ 脂肪 "+Math.round(af)+"g ｜ 碳水 "+Math.round(ac)+"g ｜ 热量约 "+ak+" kcal。";
  }
  ["convType","convAmt","convFood"].forEach(function(id){ $(id).addEventListener("input", convert); $(id).addEventListener("change", convert); });

  /* ---------- 微量营养素：达标计算 ---------- */
  var MC = [];        // 手动加入的今日食材 {name, grams, src}
  var PLAN_MC = [];   // 由备餐分配自动带出的日均食材

  function renderMicroTarget(){
    var tb = $("microTargetBody");
    if(!tb) return;
    tb.innerHTML = MI.map(function(m){
      return "<tr><td><b>"+m.n+"</b></td><td>"+m.t+" "+m.u+"</td><td class='muted'>"+m.src+"</td></tr>";
    }).join("");
  }

  function intakeArr(){
    var arr = [], i;
    for(i=0;i<MI.length;i++) arr.push(0);
    PLAN_MC.concat(MC).forEach(function(it){
      var f = findFood(it.name); if(!f) return;
      for(i=0;i<MI.length;i++){ arr[i] += miVal(f,i)/100*it.grams; }
    });
    return arr;
  }

  function microReport(){
    var arr = intakeArr();
    var has = false;
    for(var j=0;j<arr.length;j++){ if(arr[j]>0){ has=true; break; } }
    if(!has) return "<p class='hint'>还没有摄入数据。先去「⑥ 备餐」点「计算分配」，或在下方手动加几样今天吃的东西。</p>";
    function block(grp, title){
      var rows = "";
      MI.forEach(function(m,i){
        if(m.grp!==grp) return;
        var v=arr[i], pct=m.t>0?v/m.t*100:0;
        var st = pct>=100?"ok":(pct>=70?"mid":"warn");
        var w = Math.min(100,pct);
        rows += "<tr><td><b>"+m.n+"</b></td><td>"+fmtV(v)+" "+m.u+"</td><td class='muted'>"+m.t+" "+m.u+"</td>"+
          "<td><div class='pbar'><i class='pb-"+st+"' style='width:"+w.toFixed(0)+"%'></i></div></td>"+
          "<td class='"+st+"'>"+(pct>=100?("✅ "+Math.round(pct)+"%"):("⚠️ "+Math.round(pct)+"%"))+"</td></tr>";
      });
      return "<h4 class='micro-h'>"+title+"</h4><div class='table-wrap'><table class='micro-tbl'><thead><tr><th>营养素</th><th>实际摄入</th><th>每日目标</th><th>达标度</th><th>状态</th></tr></thead><tbody>"+rows+"</tbody></table></div>";
    }
    var html = block("v", "🧪 维生素（11 项）") + block("m", "⚙️ 矿物质（6 项）");
    var lacks = [], goods = 0;
    MI.forEach(function(m,i){
      var v=arr[i]; if(v>=m.t*0.7){ goods++; return; }
      var f = findFood(m.fix);
      var fv = f ? miVal(f,i) : 0;
      var needG = fv>0 ? (m.t-v)/(fv/100) : 0;
      lacks.push("缺 <b>"+m.n+"</b>（"+fmtV(v)+" / "+m.t+m.u+"，达标 "+Math.round(v/m.t*100)+"%）"+
        (needG>0?(" → 补 <b>"+m.fix+" "+Math.round(needG)+"g</b>"):"")+"　日常来源："+m.src);
    });
    if(lacks.length){
      html += "<div class='rec-box'><h4>⚠️ 这些没吃够（低于目标 70%，按一周日均算）</h4>"+
        lacks.map(function(t){ return "<p class='rec-item'>"+t+"</p>"; }).join("")+"</div>";
    }
    if(!lacks.length){
      html += "<div class='ok-box'>✅ 17 项微量营养素全部达标（≥70%），食材够多样，继续保持。</div>";
    }
    return html;
  }

  function renderMcList(){
    var box = $("mcList"); if(!box) return;
    var all = PLAN_MC.map(function(it){ return {it:it,i:-1}; }).concat(MC.map(function(it,i){ return {it:it,i:i}; }));
    if(all.length===0){ box.innerHTML=""; return; }
    box.innerHTML = all.map(function(o){
      var it=o.it;
      return "<span class='mc-chip"+(it.src==="plan"?" plan":"")+"'>"+it.name+" "+Math.round(it.grams)+"g"+
        (o.i>=0?"<b class='mc-x' data-i='"+o.i+"'>×</b>":"")+"</span>";
    }).join("");
    box.querySelectorAll(".mc-x").forEach(function(b){
      b.addEventListener("click", function(){
        MC.splice(parseInt(b.getAttribute("data-i"),10),1);
        renderMcList(); refreshMicro();
      });
    });
  }
  function refreshMicro(){ var o=$("microOut"); if(o) o.innerHTML = microReport(); }

  function initMicro(){
    renderMicroTarget();
    var sel = $("mcFood");
    if(sel){
      sel.innerHTML = FOODS.map(function(f){ return "<option value='"+f.n+"'>"+f.n+"</option>"; }).join("");
      $("mcAdd").addEventListener("click", function(){
        var nm = sel.value, g = parseFloat($("mcGram").value)||0;
        if(!nm || g<=0){ return; }
        var ex = MC.filter(function(x){return x.name===nm;})[0];
        if(ex){ ex.grams += g; } else { MC.push({name:nm, grams:g, src:"manual"}); }
        renderMcList(); refreshMicro();
      });
      $("mcClear").addEventListener("click", function(){
        MC = []; PLAN_MC = []; renderMcList(); refreshMicro();
      });
      $("mcGram").addEventListener("keydown", function(e){ if(e.key==="Enter") $("mcAdd").click(); });
    }
    renderMcList();
    refreshMicro();
  }

  /* ---------- 周备餐 ---------- */
  var pantry = []; // {name, grams, p,f,c,fi,unit,cat,src}

  function renderPantrySel(){
    var sel = $("pantrySel");
    sel.innerHTML = allFoods().map(function(f){ return "<option value='"+f.n+"'>"+f.n+"（"+CAT_TXT[f.cat]+"）</option>"; }).join("");
  }
  function renderPantry(){
    var tb = $("pantryTbl").querySelector("tbody");
    if(pantry.length===0){
      tb.innerHTML = "<tr><td colspan='5' class='muted'>还没加食材。从上面选 + 加入，或联网查 / 手动加。</td></tr>";
    } else {
      tb.innerHTML = pantry.map(function(it, i){
        return "<tr><td><b>"+it.name+"</b></td><td>"+CAT_TXT[it.cat]+"</td><td>"+it.grams+"</td><td>蛋"+it.p+"/脂"+it.f+"/碳"+it.c+"/纤"+it.fi+"</td><td><button class='btn-x' data-i='"+i+"'>删</button></td></tr>";
      }).join("");
      tb.querySelectorAll(".btn-x").forEach(function(b){
        b.addEventListener("click", function(){ pantry.splice(parseInt(b.getAttribute("data-i"),10),1); renderPantry(); buildPlanners(); });
      });
    }
    renderPantrySel();
    buildPlanners();
  }

  $("pantryAdd").addEventListener("click", function(){
    var name=$("pantrySel").value, f=findFood(name);
    var g=parseFloat($("pantryG").value)||0;
    if(!f) return;
    var exist = pantry.filter(function(p){return p.name===name;})[0];
    if(exist){ exist.grams += g; } else {
      pantry.push({name:f.n, grams:g, p:f.p, f:f.f, c:f.c, fi:f.fi, unit:f.unit, cat:f.cat, src:"db"});
    }
    renderPantry();
  });

  // 联网查 / 手动加 切换
  $("offSearch").addEventListener("click", function(){ $("offBox").style.display = $("offBox").style.display==="none"?"block":"none"; });
  $("manualAdd").addEventListener("click", function(){ $("manualBox").style.display = $("manualBox").style.display==="none"?"block":"none"; });

  $("offGo").addEventListener("click", function(){
    var q = $("offName").value.trim();
    var msg = $("offMsg");
    if(!q){ msg.textContent="请输入食材名"; return; }
    msg.textContent = "查询中…";
    var url = "https://world.openfoodfacts.org/api/v2/search?search_terms="+encodeURIComponent(q)+"&page_size=5&json=true";
    fetch(url).then(function(r){ return r.json(); }).then(function(d){
      var ps = (d.products||[]).filter(function(x){ return x.nutriments; });
      if(ps.length===0){ msg.textContent="公益库未收录，请用「手动加」按包装标签填。"; return; }
      var p = ps[0]; var nu = p.nutriments||{};
      var prot = parseFloat(nu.proteins_100g)||0, fat=parseFloat(nu.fat_100g)||0,
          carb=parseFloat(nu.carbohydrates_100g)||0, fib=parseFloat(nu.fiber_100g)||0,
          k=parseFloat(nu["energy-kcal_100g"])||parseFloat(nu.energy_100g)||0;
      var name = p.product_name || q;
      customFoods.push({n:name,cat:"protein",p:Math.round(prot*10)/10,f:Math.round(fat*10)/10,c:Math.round(carb*10)/10,fi:Math.round(fib*10)/10,k:Math.round(k),unit:"g",note:"Open Food Facts"});
      fillFoodSelect($("convFood"));
      msg.textContent = "已加入：「"+name+"」蛋"+prot+"/脂"+fat+"/碳"+carb+"。再在上方选它＋加入库存。";
    }).catch(function(){ msg.textContent="查询失败（可能网络受限），请用「手动加」。"; });
  });

  $("mGo").addEventListener("click", function(){
    var name=$("mName").value.trim();
    var p=parseFloat($("mP").value), f=parseFloat($("mF").value), c=parseFloat($("mC").value), fi=parseFloat($("mFi").value)||0;
    if(!name||isNaN(p)){ alert("请至少填名称和每100g蛋白"); return; }
    customFoods.push({n:name,cat:"protein",p:p,f:(isNaN(f)?0:f),c:(isNaN(c)?0:c),fi:(isNaN(fi)?0:fi),k:Math.round(p*4+(isNaN(f)?0:f)*9+(isNaN(c)?0:c)*4),unit:"g",note:"手动录入"});
    fillFoodSelect($("convFood"));
    alert("已加入自定义食材：「"+name+"」");
    $("mName").value="";$("mP").value="";$("mF").value="";$("mC").value="";$("mFi").value="";
  });

  // 每餐规划器（勾选该餐用哪些食材）
  function buildPlanners(){
    var box = $("mealPlanners");
    if(pantry.length===0){ box.innerHTML = "<p class='hint'>先在 ⑥-1 加入食材，这里会自动列出可勾选项。</p>"; return; }
    box.innerHTML = MEALS.map(function(m){
      var rows = ["protein","carb","veg"].map(function(cat){
        var items = pantry.filter(function(it){ return it.cat===cat; });
        if(items.length===0) return "";
        var ch = items.map(function(it){
          return "<label class='chk-inline'><input type='checkbox' data-meal='"+m.name+"' data-cat='"+cat+"' value='"+it.name+"'> "+it.name+"</label>";
        }).join("");
        return "<div class='plan-cat'><span class='plan-cat-t'>"+CAT_TXT[cat]+"</span>"+ch+"</div>";
      }).join("");
      return "<div class='plan-meal'><h4>"+m.name+"（目标："+Math.round((lastResult?lastResult.prot*m.pct:0))+"g蛋白 / "+Math.round((lastResult?lastResult.carb*m.pct:0))+"g碳水 / "+Math.round((lastResult?lastResult.fiber*m.pct:0))+"g纤维）</h4>"+rows+"</div>";
    }).join("");
  }

  function checkedFor(meal,cat){
    return Array.prototype.slice.call(document.querySelectorAll("input[data-meal='"+meal+"'][data-cat='"+cat+"']:checked")).map(function(c){ return c.value; });
  }

  $("planCalc").addEventListener("click", function(){
    if(!lastResult) calc();
    if(!lastResult){ alert("请先填写上方身体数据并算好营养目标"); return; }
    if(pantry.length===0){ $("planOut").innerHTML="<p class='hint'>请先在 ⑥-1 加入本周食材。</p>"; return; }
    var R = lastResult;
    var RED = { "瘦牛肉(生)":1, "牛里脊(生)":1, "猪里脊(生)":1 };
    var html = '<div class="table-wrap"><table class="plan-tbl"><thead><tr><th>餐次</th><th>类别</th><th>食材</th><th>每餐(g)</th><th>每周(g)</th><th>状态</th></tr></thead><tbody>';
    var shop = {}; var act = {p:0,f:0,c:0,fi:0}; var redMeals = 0;
    function acc(name, weeklyG){ if(!shop[name]) shop[name]={need:0}; shop[name].need += weeklyG; }
    function tally(fo, weeklyG){ act.p += fo.p/100*weeklyG; act.f += fo.f/100*weeklyG; act.c += fo.c/100*weeklyG; act.fi += fo.fi/100*weeklyG; }
    MEALS.forEach(function(m){
      var tp=R.prot*m.pct, tc=R.carb*m.pct, tf=R.fiber*m.pct;
      var prots=checkedFor(m.name,"protein"), carbs=checkedFor(m.name,"carb"), vegs=checkedFor(m.name,"veg");
      if(prots.length===0){ html+="<tr><td rowspan='1'><b>"+m.name+"</b></td><td>蛋白</td><td>—</td><td>—</td><td>—</td><td class='warn'>⚠️ 未选蛋白来源</td></tr>"; }
      else { prots.forEach(function(nm){ var fo=findFood(nm); var g=(tp/prots.length)/(fo.p/100); html+=planRow(m.name,"蛋白",nm,g); acc(nm,g*7); tally(fo,g*7); if(RED[nm]) redMeals++; }); }
      if(carbs.length===0){ html+="<tr><td>碳水</td><td>—</td><td>—</td><td>—</td><td class='warn'>⚠️ 未选碳水来源</td></tr>"; }
      else { carbs.forEach(function(nm){ var fo=findFood(nm); var g=(tc/carbs.length)/(fo.c/100); html+=planRow(m.name,"碳水",nm,g); acc(nm,g*7); tally(fo,g*7); }); }
      if(vegs.length===0){ html+="<tr><td>蔬菜</td><td>—</td><td>—</td><td>—</td><td class='warn'>⚠️ 未选蔬菜（纤维+维生素可能不足）</td></tr>"; }
      else { vegs.forEach(function(nm){ var fo=findFood(nm); var g=(tf/vegs.length)/(fo.fi/100); html+=planRow(m.name,"蔬菜",nm,g); acc(nm,g*7); tally(fo,g*7); }); }
    });
    html+="</tbody></table></div>";

    // 本周实际 vs 目标
    var twP=R.prot*7, twC=R.carb*7, twF=R.fat*7, twFi=R.fiber*7;
    html += "<h4 style='margin:16px 0 8px'>📊 本周实际 vs 目标（按你勾选的分配）</h4>";
    html += "<div class='table-wrap'><table class='shop-tbl'><thead><tr><th>营养素</th><th>实际(周)</th><th>目标(周)</th><th>状态</th></tr></thead><tbody>";
    html += diffRow("蛋白质(g)", act.p, twP) + diffRow("脂肪(g)", act.f, twF) + diffRow("碳水(g)", act.c, twC) + diffRow("膳食纤维(g)", act.fi, twFi);
    html += "</tbody></table></div>";

    // 短缺预警 + 推荐补救
    var recs = [];
    if(act.p < twP*0.95){
      var deficit = twP-act.p;
      var recFood = (redMeals<2) ? "瘦牛肉(生)" : "鸡胸肉(生,去皮)";
      var fo = findFood(recFood); var needG = deficit/(fo.p/100);
      recs.push("蛋白质还差 <b>"+Math.round(deficit)+"g</b>。"+(redMeals<2?"你这周红肉偏少（白肉为主），":"")+"建议补 <b>"+recFood+" 约 "+Math.round(needG)+"g</b>（红肉为辅，一周 2–3 餐补铁补锌）。");
    }
    if(act.f < twF*0.95){ var dF=twF-act.f; var ng=dF/(findFood("花生酱").f/100); recs.push("脂肪还差 <b>"+Math.round(dF)+"g</b>。建议补 <b>花生酱 约 "+Math.round(ng)+"g</b> 或 橄榄油。"); }
    if(act.c < twC*0.95){ var dC=twC-act.c; var ng2=dC/(findFood("燕麦(干)").c/100); recs.push("碳水还差 <b>"+Math.round(dC)+"g</b>。建议补 <b>燕麦(干) 约 "+Math.round(ng2)+"g</b> 或 米饭/红薯。"); }
    if(act.fi < twFi*0.95){ var dFi=twFi-act.fi; var ng3=dFi/(findFood("西兰花(生)").fi/100); recs.push("膳食纤维还差 <b>"+Math.round(dFi)+"g</b>。建议多加 <b>西兰花 约 "+Math.round(ng3)+"g</b>（或菠菜/胡萝卜），蔬菜要多样化。"); }
    if(redMeals<2){ recs.push("⚠️ 本周红肉餐数仅 <b>"+redMeals+"</b> 餐。科学搭配：白肉(鸡/鱼)为主、红肉为辅，建议一周安排 <b>2–3 餐红肉</b>（牛肉/猪里脊）补铁补锌，蛋白补足里已给克数。"); }
    if(recs.length){ html += "<div class='rec-box'><h4>💡 短缺预警 & 推荐补救</h4>"+recs.map(function(r){return "<p class='rec-item'>⚠️ "+r+"</p>";}).join("")+"</div>"; }

    // 一周采购清单
    html += "<h4 style='margin:16px 0 8px'>🛒 一周采购清单（按此买够 7 天）</h4>";
    html += "<div class='table-wrap'><table class='shop-tbl'><thead><tr><th>食材</th><th>需采购(每周g)</th><th>你填的库存(g)</th><th>状态</th></tr></thead><tbody>";
    var names = Object.keys(shop);
    if(names.length===0){
      html += "<tr><td colspan='4' class='muted'>没勾选任何食材，无法生成清单。回到 ⑥-2 勾选后重试。</td></tr>";
    } else {
      names.forEach(function(nm){
        var need=shop[nm].need, have=(pantry.filter(function(p){return p.name===nm;})[0]||{}).grams||0;
        var ok = have>=need;
        html += "<tr><td><b>"+nm+"</b></td><td>"+Math.round(need)+"</td><td>"+have+"</td><td class='"+(ok?"ok":"warn")+"'>"+(ok?"✅ 够":("⚠️ 还差 "+Math.round(need-have)+"g，需补买"))+"</td></tr>";
      });
    }
    html += "</tbody></table></div>";

    // 微量营养素：把本周食材折成日均，交给统一报告
    PLAN_MC = Object.keys(shop).map(function(nm){ return {name:nm, grams: shop[nm].need/7, src:"plan"}; });
    renderMcList();
    html += "<h4 style='margin:18px 0 8px'>🧬 微量营养素（维生素 &amp; 矿物质，按日均）</h4>";
    html += microReport();

    html += "<p class='note'>说明：分配按「目标平分给所选食材」的简便法，实际做饭可微调。蔬菜以满足纤维为目标；若某餐只勾 1 种蔬菜，为了凑够纤维会算出很大克数（比如一天 1kg 西兰花），<b>建议每餐勾 2–3 种蔬菜轮换</b>，既好入口又能覆盖不同维生素。所有克数按生重计，烹饪会失水约 25–40%，按生重买即可。</p>";
    $("planOut").innerHTML = html;
    refreshMicro();
  });
  function planRow(meal,cat,nm,g){
    var r = g*7;
    return "<tr><td><b>"+meal+"</b></td><td>"+cat+"</td><td>"+nm+"</td><td>"+Math.round(g)+"</td><td>"+Math.round(r)+"</td><td class='ok'>✅ 达标</td></tr>";
  }
  function diffRow(name, act, target){
    var ok = act>=target*0.95; var pct = target>0?Math.round(act/target*100):0;
    return "<tr><td><b>"+name+"</b></td><td>"+Math.round(act)+"</td><td>"+Math.round(target)+"</td><td class='"+(ok?"ok":"warn")+"'>"+(ok?("✅ "+pct+"%"):("⚠️ 缺 "+Math.round(target-act)+"g"))+"</td></tr>";
  }

  /* ---------- 智能推荐：一周采购 ---------- */
  function buildSuggestion(R){
    var protW=R.prot*7, carbW=R.carb*7, fatW=R.fat*7, fiberW=R.fiber*7;
    var out = [];
    var protSplit = [
      {n:"鸡胸肉(生,去皮)", s:0.42, note:"白肉主力，低脂高蛋白"},
      {n:"三文鱼(生)", s:0.18, note:"鱼肉，补 Omega-3"},
      {n:"瘦牛肉(生)", s:0.15, note:"红肉为辅，补铁锌，一周约2–3餐"},
      {n:"鸡蛋(全蛋)", s:0.13, note:"早餐优质蛋白"},
      {n:"无糖希腊酸奶", s:0.12, note:"奶制品，补钙"}
    ];
    var fatFromP=0;
    protSplit.forEach(function(x){
      var fo=findFood(x.n); var g=(protW*x.s)/(fo.p/100);
      out.push({name:x.n, grams:Math.round(g), cat:fo.cat, note:x.note});
      fatFromP += fo.f/100*g;
    });
    var carbSplit=[{n:"燕麦(干)", s:0.28, note:"早餐慢碳"},{n:"白米饭(熟)", s:0.57, note:"午晚餐主食"},{n:"红薯(蒸)", s:0.15, note:"优质碳水+纤维"}];
    carbSplit.forEach(function(x){ var fo=findFood(x.n); var g=(carbW*x.s)/(fo.c/100); out.push({name:x.n, grams:Math.round(g), cat:fo.cat, note:x.note}); });
    var fatNeed = Math.max(0, fatW - fatFromP);
    if(fatNeed>10){ var pb=findFood("花生酱"); out.push({name:"花生酱", grams:Math.round(fatNeed/(pb.f/100)), cat:"fat", note:"补健康脂肪"}); }
    var vegSplit=[{n:"西兰花(生)",s:0.4},{n:"菠菜(生)",s:0.35},{n:"番茄",s:0.25}];
    vegSplit.forEach(function(x){ var fo=findFood(x.n); var g=(fiberW*x.s)/(fo.fi/100); out.push({name:x.n, grams:Math.round(g), cat:"veg", note:"蔬菜多样，补纤维维生素"}); });
    out.push({name:"牛奶(全脂)", grams:1750, cat:"protein", note:"每天约250ml，补钙"});
    return out;
  }
  $("suggestBtn").addEventListener("click", function(){
    if(!lastResult) calc();
    if(!lastResult){ alert("请先填写上方身体数据"); return; }
    var list = buildSuggestion(lastResult);
    var html = "<p class='note'>按你的目标自动生成，原则：<b>白肉(鸡/鱼)为主、红肉(牛/猪)为辅(一周2–3餐)、蛋奶搭配、蔬菜3样轮换、碳水以燕麦+米饭+红薯</b>。可直接「采用」填入下方食材库再算分配。</p>";
    html += "<div class='table-wrap'><table class='shop-tbl'><thead><tr><th>推荐食材</th><th>本周买(g)</th><th>类别</th><th>说明</th></tr></thead><tbody>";
    list.forEach(function(it){ html+="<tr><td><b>"+it.name+"</b></td><td>"+it.grams+"</td><td>"+CAT_TXT[it.cat]+"</td><td class='muted'>"+it.note+"</td></tr>"; });
    html += "</tbody></table></div>";
    html += "<button id='adoptSuggest' class='btn-mini' style='margin-top:8px'>✅ 采用并填入我的食材库</button>";
    $("suggestOut").innerHTML = html;
    var adopt = $("adoptSuggest");
    if(adopt){ adopt.addEventListener("click", function(){
      list.forEach(function(it){ var exist=pantry.filter(function(p){return p.name===it.name;})[0]; var fo=findFood(it.name); if(exist){ exist.grams+=it.grams; } else { pantry.push({name:it.name,grams:it.grams,p:fo.p,f:fo.f,c:fo.c,fi:fo.fi,unit:fo.unit,cat:fo.cat,src:"suggest"}); } });
      renderPantry();
      document.getElementById("prep").scrollIntoView({behavior:"smooth"});
    }); }
  });

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

  /* ---------- 初始化 ---------- */
  calc();
  convert();
  renderPantry();
  initMicro();
  /* ---------- 阶段进阶：标记当前阶段（本地保存） ---------- */
  var LS_STAGE = "hwp_stage_v1";
  var stageSel = document.getElementById("stageNow");
  var stageHint = document.getElementById("stageHint");
  function applyStage(v){
    var all = document.querySelectorAll(".stage");
    all.forEach(function(d){ d.classList.remove("current"); });
    var cur = document.getElementById("stage"+v);
    if(cur){ cur.classList.add("current"); cur.open = true; }
    if(stageHint) stageHint.textContent = "已标记 S"+v+"，高亮展开的卡片就是你现在该练的这一级。";
  }
  if(stageSel){
    var sv = "1";
    try{ sv = localStorage.getItem(LS_STAGE) || "1"; }catch(e){}
    stageSel.value = sv;
    applyStage(sv);
    stageSel.addEventListener("change", function(){
      try{ localStorage.setItem(LS_STAGE, stageSel.value); }catch(e){}
      applyStage(stageSel.value);
    });
  }

})();
