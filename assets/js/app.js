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
    });
  }

  /* ---------- 营养：身体数据 → 全天营养 → 四餐 → 食材换算 → 周备餐 ---------- */
  var FOODS = [
    // 蛋白来源
    {n:"鸡胸肉(生,去皮)",cat:"protein",p:22.5,f:2.6,c:0,fi:0,k:120,unit:"g",note:"USDA：最便宜纯蛋白"},
    {n:"鸡腿肉(去皮生)",cat:"protein",p:18.6,f:7.9,c:0,fi:0,k:144,unit:"g",note:"比鸡胸香，脂肪略高"},
    {n:"瘦牛肉(生)",cat:"protein",p:21,f:4.5,c:0,fi:0,k:125,unit:"g",note:"红肉，含铁高"},
    {n:"牛里脊(生)",cat:"protein",p:22,f:3,c:0,fi:0,k:125,unit:"g",note:"嫩，脂肪低"},
    {n:"猪里脊(生)",cat:"protein",p:20,f:6,c:0,fi:0,k:134,unit:"g",note:"家常白肉"},
    {n:"三文鱼(生)",cat:"protein",p:20.3,f:13.1,c:0,fi:0,k:208,unit:"g",note:"USDA：优质脂肪Omega-3"},
    {n:"鳕鱼(生)",cat:"protein",p:18,f:1,c:0,fi:0,k:85,unit:"g",note:"极低脂白肉"},
    {n:"虾仁(生)",cat:"protein",p:20,f:0.5,c:0,fi:0,k:85,unit:"g",note:"低脂高蛋白"},
    {n:"鸡蛋(全蛋)",cat:"protein",p:12.6,f:9.5,c:0.7,fi:0,k:143,unit:"g",note:"约50g/个=蛋白6.3g"},
    {n:"蛋清",cat:"protein",p:10.9,f:0.2,c:0.7,fi:0,k:52,unit:"g",note:"纯蛋白几乎无脂，约33g/个"},
    {n:"牛奶(全脂)",cat:"protein",p:3.2,f:3.6,c:4.8,fi:0,k:61,unit:"ml",note:"每100ml"},
    {n:"无糖希腊酸奶",cat:"protein",p:10,f:0.4,c:3.6,fi:0,k:59,unit:"g",note:"选无糖"},
    {n:"北豆腐(硬)",cat:"protein",p:17.3,f:8.7,c:2.8,fi:0.4,k:144,unit:"g",note:"植物蛋白"},
    {n:"毛豆(熟)",cat:"protein",p:13,f:6,c:11,fi:4,k:140,unit:"g",note:"植物蛋白+碳水"},
    {n:"乳清蛋白粉",cat:"protein",p:80,f:6,c:8,fi:0,k:400,unit:"g",note:"一勺约30g=24g蛋白"},
    // 碳水来源
    {n:"燕麦(干)",cat:"carb",p:17,f:7,c:66,fi:10,k:379,unit:"g",note:"慢碳，煮前称重"},
    {n:"糙米(熟)",cat:"carb",p:2.6,f:0.9,c:23,fi:1.8,k:112,unit:"g",note:"主食换精白米"},
    {n:"白米饭(熟)",cat:"carb",p:2.7,f:0.3,c:28,fi:0.4,k:130,unit:"g",note:"常吃的主食"},
    {n:"红薯(蒸)",cat:"carb",p:1.6,f:0.1,c:20,fi:3,k:90,unit:"g",note:"优质慢碳"},
    {n:"土豆(蒸)",cat:"carb",p:2,f:0.1,c:20,fi:1.8,k:87,unit:"g",note:"低脂慢碳"},
    {n:"香蕉",cat:"carb",p:1.1,f:0.3,c:23,fi:2.6,k:89,unit:"g",note:"练后快碳方便"},
    {n:"全麦面包",cat:"carb",p:13,f:3.4,c:41,fi:7,k:247,unit:"g",note:"看配料表，真全麦"},
    {n:"意大利面(熟)",cat:"carb",p:5,f:1,c:25,fi:1.8,k:130,unit:"g",note:"慢碳主食"},
    // 蔬菜（看纤维）
    {n:"西兰花(生)",cat:"veg",p:2.8,f:0.4,c:6.6,fi:2.6,k:34,unit:"g",note:"十字花科，纤维高"},
    {n:"菠菜(生)",cat:"veg",p:2.9,f:0.4,c:3.6,fi:2.2,k:23,unit:"g",note:"补铁补纤维"},
    {n:"生菜",cat:"veg",p:1.4,f:0.2,c:2.9,fi:1.3,k:15,unit:"g",note:"低卡 filler"},
    {n:"番茄",cat:"veg",p:0.9,f:0.2,c:3.9,fi:1.2,k:18,unit:"g",note:"维生素C"},
    {n:"黄瓜",cat:"veg",p:0.7,f:0.1,c:3.6,fi:0.5,k:15,unit:"g",note:"低卡补水"},
    {n:"胡萝卜(生)",cat:"veg",p:0.9,f:0.2,c:9.6,fi:2.8,k:41,unit:"g",note:"β-胡萝卜素"},
    {n:"西葫芦",cat:"veg",p:1.2,f:0.3,c:3.1,fi:1.0,k:17,unit:"g",note:"低卡蔬菜"},
    // 脂肪来源
    {n:"花生酱",cat:"fat",p:25,f:50,c:20,fi:6,k:588,unit:"g",note:"脂肪主要来源"},
    {n:"杏仁",cat:"fat",p:21,f:49,c:22,fi:12.5,k:579,unit:"g",note:"健康脂肪+蛋白"},
    {n:"橄榄油",cat:"fat",p:0,f:100,c:0,fi:0,k:900,unit:"g",note:"纯脂肪，拌菜用"}
  ];

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
  [nSex,nAge,nH,nAct,nBmr,nLbm].forEach(function(el){ el.addEventListener("input", calc); el.addEventListener("change", calc); });

  var lastResult = null;
  function calc(){
    var w=parseFloat(nW.value)||0, lbm=parseFloat(nLbm.value)||0, act=parseFloat(nAct.value)||1.375, bmr=parseFloat(nBmr.value)||0;
    if(!w||!lbm||!bmr){ return; }
    var maint = Math.round(bmr*act);
    var prot = Math.round(lbm*2.2);
    prot = Math.max(Math.round(w*1.6), Math.min(prot, Math.round(lbm*2.6)));
    var fat = Math.round(w*0.8);
    var carbCal = maint - prot*4 - fat*9;
    var carb = carbCal>0 ? Math.round(carbCal/4) : 0;
    var fiber = Math.max(25, Math.round(maint/1000*14));
    var water = Math.round(w*35)/1000;

    $("macroCards").innerHTML =
      card("热量(维持量)", maint, "kcal", "不制造大缺口，身体重组") +
      card("蛋白质", prot, "g", "瘦体重×2.2，约"+Math.round(prot*4)+"kcal") +
      card("脂肪", fat, "g", "体重×0.8，约"+Math.round(fat*9)+"kcal") +
      card("碳水", carb, "g", "剩余热量，约"+Math.round(carb*4)+"kcal") +
      card("膳食纤维", fiber, "g", "热量÷1000×14") +
      card("饮水", water, "L", "训练日 +0.5L");

    $("macroFormula").textContent = "计算链：维持热量 = BMR("+bmr+") × 活动系数("+act+") = "+maint+" kcal ｜ 蛋白 = 瘦体重("+lbm+"kg)×2.2 = "+prot+"g ｜ 脂肪 = 体重("+w+"kg)×0.8 = "+fat+"g ｜ 碳水 = (维持−蛋白×4−脂肪×9)÷4 = "+carb+"g。";

    var tb = $("mealTbl").querySelector("tbody");
    tb.innerHTML = MEALS.map(function(m){
      var cal=Math.round(maint*m.pct), p=Math.round(prot*m.pct), f=Math.round(fat*m.pct), c=Math.round(carb*m.pct);
      return "<tr><td><b>"+m.name+"</b></td><td>"+Math.round(m.pct*100)+"%</td><td>"+cal+"</td><td>"+p+"</td><td>"+f+"</td><td>"+c+"</td></tr>";
    }).join("");

    lastResult = {maint:maint,prot:prot,fat:fat,carb:carb,fiber:fiber,water:water};
    // 若备餐板块已建好，刷新默认目标提示
  }
  function card(t,v,u,sub){
    return '<div class="mcard"><div class="m-t">'+t+'</div><div class="m-v">'+v+'<span class="m-u">'+u+'</span></div><div class="m-s">'+sub+'</div></div>';
  }

  // --- 食材库渲染 + 搜索 ---
  function renderFoods(filter){
    var tb = $("foodTbl").querySelector("tbody");
    var list = FOODS.filter(function(f){ return !filter || f.n.indexOf(filter)>=0; });
    tb.innerHTML = list.map(function(f){
      return "<tr><td><b>"+f.n+"</b></td><td>"+f.p+"</td><td>"+f.f+"</td><td>"+f.c+"</td><td>"+f.fi+"</td><td>"+f.k+"</td><td class='muted'>"+f.note+"</td></tr>";
    }).join("") || "<tr><td colspan='7' class='muted'>没找到，换个词试试</td></tr>";
  }
  renderFoods("");
  $("foodSearch").addEventListener("input", function(){ renderFoods(this.value.trim()); });

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
    var html = '<div class="table-wrap"><table class="plan-tbl"><thead><tr><th>餐次</th><th>类别</th><th>食材</th><th>每餐(g)</th><th>每周(g)</th><th>状态</th></tr></thead><tbody>';
    var shop = {};
    function acc(name, weeklyG){ if(!shop[name]) shop[name]={need:0}; shop[name].need += weeklyG; }
    MEALS.forEach(function(m){
      var tp=R.prot*m.pct, tc=R.carb*m.pct, tf=R.fiber*m.pct;
      var prots=checkedFor(m.name,"protein"), carbs=checkedFor(m.name,"carb"), vegs=checkedFor(m.name,"veg");
      if(prots.length===0){ html+="<tr><td rowspan='1'><b>"+m.name+"</b></td><td>蛋白</td><td>—</td><td>—</td><td>—</td><td class='warn'>⚠️ 未选蛋白来源</td></tr>"; }
      else { prots.forEach(function(nm){ var g=(tp/prots.length)/(findFood(nm).p/100); html+=planRow(m.name,"蛋白",nm,g); acc(nm,g*7); }); }
      if(carbs.length===0){ html+="<tr><td>碳水</td><td>—</td><td>—</td><td>—</td><td class='warn'>⚠️ 未选碳水来源</td></tr>"; }
      else { carbs.forEach(function(nm){ var g=(tc/carbs.length)/(findFood(nm).c/100); html+=planRow(m.name,"碳水",nm,g); acc(nm,g*7); }); }
      if(vegs.length===0){ html+="<tr><td>蔬菜</td><td>—</td><td>—</td><td>—</td><td class='warn'>⚠️ 未选蔬菜（纤维可能不足）</td></tr>"; }
      else { vegs.forEach(function(nm){ var g=(tf/vegs.length)/(findFood(nm).fi/100); html+=planRow(m.name,"蔬菜",nm,g); }); }
    });
    html+="</tbody></table></div>";

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
    html += "<p class='note'>说明：分配按「目标平分给所选食材」的简便法，实际做饭可微调。蔬菜以满足纤维为目标；若某餐没勾蔬菜，系统已⚠️提示。所有克数按生重计，烹饪会失水约 25–40%，按生重买即可。</p>";
    $("planOut").innerHTML = html;
  });
  function planRow(meal,cat,nm,g){
    var r = g*7;
    return "<tr><td><b>"+meal+"</b></td><td>"+cat+"</td><td>"+nm+"</td><td>"+Math.round(g)+"</td><td>"+Math.round(r)+"</td><td class='ok'>✅ 达标</td></tr>";
  }

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
})();
