const KEY="familienkonto-v01";
const makeId=()=>crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2);
const defaults={
  accounts:[{id:"you",name:"Mein Girokonto",balance:2450},{id:"partner",name:"Girokonto meiner Frau",balance:1000}],
  reserve:300,
  costs:[
    {id:makeId(),name:"Miete",amount:1100,day:1,owner:"you",category:"Wohnen",paid:false},
    {id:makeId(),name:"Strom",amount:120,day:5,owner:"you",category:"Wohnen",paid:false},
    {id:makeId(),name:"Internet & Mobilfunk",amount:65,day:8,owner:"you",category:"Verträge",paid:false},
    {id:makeId(),name:"Autoversicherung",amount:85,day:12,owner:"you",category:"Mobilität",paid:false},
    {id:makeId(),name:"Versicherungen",amount:95,day:15,owner:"partner",category:"Versicherung",paid:false},
    {id:makeId(),name:"Streaming & Abos",amount:32,day:20,owner:"partner",category:"Abos",paid:false}
  ],
  incomes:[]
};
let state=load();
function load(){
 try{
  const saved=JSON.parse(localStorage.getItem(KEY));
  if(!saved)return defaults;
  return {...defaults,...saved,incomes:Array.isArray(saved.incomes)?saved.incomes:[]};
 }catch{return defaults}
}
function save(){localStorage.setItem(KEY,JSON.stringify(state));render()}
const euro=n=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(Number(n)||0);
const total=()=>state.accounts.reduce((s,a)=>s+Number(a.balance||0),0);
const monthly=()=>state.costs.reduce((s,c)=>s+Number(c.amount||0),0);
const monthlyIncome=()=>state.incomes.reduce((s,i)=>s+Number(i.amount||0),0);
const outstanding=()=>state.costs.filter(c=>!c.paid).reduce((s,c)=>s+Number(c.amount||0),0);
const expectedIncome=()=>state.incomes.filter(i=>!i.received).reduce((s,i)=>s+Number(i.amount||0),0);
const available=()=>total()-outstanding()-Number(state.reserve||0);
const forecast=()=>available()+expectedIncome();
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function ownerName(owner){return owner==="you"?"Dein Konto":"Konto deiner Frau"}
function todayISO(){
 const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function formatDate(iso){
 const [y,m,d]=iso.split("-").map(Number);return new Intl.DateTimeFormat("de-DE").format(new Date(y,m-1,d));
}
function forecastAccount(account){
 const today=todayISO();
 state.balanceDates=state.balanceDates||{};
 const referenceDate=state.balanceDates[account.id]||today;
 const saved=state.forecastDates?.[account.id];
 const date=saved&&saved>=referenceDate?saved:referenceDate;
 const [ry,rm,rd]=referenceDate.split("-").map(Number);
 const [ty,tm,td]=date.split("-").map(Number);
 const baseline=new Date(ry,rm-1,rd);baseline.setHours(0,0,0,0);
 const end=new Date(ty,tm-1,td);end.setHours(0,0,0,0);
 let income=0,expense=0;
 const firstMonth=new Date(ry,rm-1,1);
 for(let month=new Date(firstMonth);month<=new Date(ty,tm-1,1);month.setMonth(month.getMonth()+1)){
  const isReferenceMonth=month.getFullYear()===ry&&month.getMonth()===rm-1;
  const monthEnd=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
  for(const item of state.incomes.filter(x=>x.owner===account.id)){
   const day=Math.min(Number(item.day)||1,monthEnd),occurrence=new Date(month.getFullYear(),month.getMonth(),day);
   if(occurrence>baseline&&occurrence<=end&&(!isReferenceMonth||!item.received))income+=Number(item.amount||0);
  }
  for(const item of state.costs.filter(x=>x.owner===account.id)){
   const day=Math.min(Number(item.day)||1,monthEnd),occurrence=new Date(month.getFullYear(),month.getMonth(),day);
   if(occurrence>baseline&&occurrence<=end&&(!isReferenceMonth||!item.paid))expense+=Number(item.amount||0);
  }
 }
 return {account,date,referenceDate,income,expense,change:income-expense,balance:Number(account.balance||0)+income-expense};
}
function render(){
 document.querySelector("#available").textContent=euro(available());
 document.querySelector("#totalBalance").textContent=euro(total());
 document.querySelector("#remainingCosts").textContent=euro(outstanding());
 document.querySelector("#monthlyCosts").textContent=euro(monthly());
 document.querySelector("#monthlyIncomeHome").textContent=euro(monthlyIncome());
 document.querySelector("#monthlyIncomeTotal").textContent=euro(monthlyIncome());
 document.querySelector("#expectedIncome").textContent=euro(expectedIncome());
 document.querySelector("#forecast").textContent=euro(forecast());
 document.querySelector("#reserve").value=state.reserve;
 const sorted=[...state.costs].sort((a,b)=>a.day-b.day);
 document.querySelector("#upcoming").innerHTML=sorted.filter(c=>!c.paid).slice(0,4).map(costRow).join("")||'<div class="empty">Keine offenen Fixkosten eingetragen.</div>';
 document.querySelector("#costList").innerHTML=sorted.map(c=>`<div class="list-card"><div class="ico">${categoryIcon(c.category)}</div><div class="row-main"><strong>${esc(c.name)}</strong><small>Tag ${c.day} · ${esc(c.category)} · ${ownerName(c.owner)}</small><div class="amount">${euro(c.amount)}</div></div><button class="paid ${c.paid?"done":""}" data-paid="${c.id}">${c.paid?"Bezahlt":"Offen"}</button><button class="delete" data-delete="${c.id}" aria-label="Löschen">×</button></div>`).join("")||'<div class="empty">Noch keine Fixkosten. Füge eure regelmäßigen Abbuchungen hinzu.</div>';
 document.querySelector("#incomeList").innerHTML=state.incomes.map(i=>`<div class="list-card"><div class="ico">＋</div><div class="row-main"><strong>${esc(i.name)}</strong><small>Tag ${i.day} · ${ownerName(i.owner)}</small><div class="amount">${euro(i.amount)}</div></div><button class="paid ${i.received?"done":""}" data-received="${i.id}">${i.received?"Erhalten":"Offen"}</button><button class="delete" data-income-delete="${i.id}" aria-label="Löschen">×</button></div>`).join("")||'<div class="empty">Noch keine Einnahmen eingetragen. Füge zum Beispiel Gehalt oder Kindergeld hinzu.</div>';
 document.querySelector("#accountList").innerHTML=state.accounts.map(a=>`<div class="list-card"><div class="ico">€</div><div class="row-main"><strong>${esc(a.name)}</strong><small>Sparkasse Rhein-Haardt · manuell gepflegt</small><div class="amount">${euro(a.balance)}</div></div><button class="account-edit" data-account="${a.id}">Ändern</button></div>`).join("");
 const projections=state.accounts.map(a=>forecastAccount(a));
 const sumIncome=projections.reduce((n,p)=>n+p.income,0);
 const sumExpense=projections.reduce((n,p)=>n+p.expense,0);
 const sumChange=sumIncome-sumExpense;
 document.querySelector("#forecastIncome").textContent=euro(sumIncome);
 document.querySelector("#forecastExpense").textContent=euro(sumExpense);
 document.querySelector("#forecastChange").textContent=(sumChange>=0?"+":"")+euro(sumChange);
 document.querySelector("#accountForecast").innerHTML=projections.map(p=>`
  <article class="account-forecast ${p.account.id==="partner"?"partner":""}">
   <div class="account-forecast-head"><div class="account-mark">${p.account.id==="partner"?"◉":"▣"}</div><div class="account-title"><strong>${esc(p.account.name)}</strong><small>Prognose bis ${formatDate(p.date)}</small></div><label class="date-field"><span>Datum</span><input type="date" class="forecast-date" data-forecast-date="${p.account.id}" min="${p.referenceDate}" value="${p.date}"></label></div>
   <div class="baseline-fields">
    <label><span>Aktueller Kontostand (€)</span><input type="number" step="0.01" inputmode="decimal" class="balance-input" data-balance="${p.account.id}" value="${Number(p.account.balance||0)}"></label>
    <label><span>Kontostand vom</span><input type="date" class="balance-date" data-balance-date="${p.account.id}" value="${p.referenceDate}" max="${todayISO()}"></label>
   </div>
   <div class="forecast-lines">
    <div><span class="line-icon income-icon">↑</span><span>Einnahmen</span><strong>${euro(p.income)}</strong></div>
    <div><span class="line-icon expense-icon">↓</span><span>Ausgaben</span><strong>${euro(p.expense)}</strong></div>
    <div><span class="line-icon change-icon">↗</span><span>Veränderung</span><strong class="${p.change<0?"negative":"positive"}">${p.change>=0?"+":""}${euro(p.change)}</strong></div>
    <div class="balance-line"><span class="line-icon balance-icon">€</span><span>Prognostizierter Kontostand</span><strong class="${p.balance<0?"negative":""}">${euro(p.balance)}</strong></div>
   </div>
  </article>`).join("");
 const low=projections.filter(p=>p.balance<0);
 document.querySelector("#forecastAlert").innerHTML=low.length?`<div class="alert">Achtung: ${low.map(p=>esc(p.account.name)).join(" und ")} könnte(n) zum gewählten Datum ins Minus rutschen.</div>`:'<div class="good">Zum jeweils gewählten Datum ist kein Konto rechnerisch im Minus.</div>';
}
function categoryIcon(cat){return ({Wohnen:"⌂",Mobilität:"↗",Versicherung:"◇",Verträge:"▤",Abos:"▷"})[cat]||"€"}
function costRow(c){return `<div class="row"><div class="ico">${categoryIcon(c.category)}</div><div class="row-main"><strong>${esc(c.name)}</strong><small>Tag ${c.day} · ${ownerName(c.owner)}</small></div><div class="amount">−${euro(c.amount)}</div></div>`}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.tab)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.go)));
function showTab(id){document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===id));document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id))}
document.querySelector("#reserve").addEventListener("change",e=>{state.reserve=Math.max(0,Number(e.target.value)||0);save()});
document.querySelector("#addCost").addEventListener("click",()=>document.querySelector("#costDialog").showModal());
document.querySelector("#costForm").addEventListener("submit",e=>{
 if(e.submitter?.value==="cancel")return;e.preventDefault();
 const name=document.querySelector("#costName").value.trim(),amount=Number(document.querySelector("#costAmount").value),day=Number(document.querySelector("#costDay").value);
 if(!name||amount<=0||day<1||day>31)return;
 state.costs.push({id:makeId(),name,amount,day,owner:document.querySelector("#costOwner").value,category:document.querySelector("#costCategory").value,paid:false});
 e.target.reset();document.querySelector("#costDialog").close();save();
});
document.querySelector("#addIncome").addEventListener("click",()=>document.querySelector("#incomeDialog").showModal());
document.querySelector("#incomeForm").addEventListener("submit",e=>{
 if(e.submitter?.value==="cancel")return;e.preventDefault();
 const name=document.querySelector("#incomeName").value.trim(),amount=Number(document.querySelector("#incomeAmount").value),day=Number(document.querySelector("#incomeDay").value);
 if(!name||amount<=0||day<1||day>31)return;
 state.incomes.push({id:makeId(),name,amount,day,owner:document.querySelector("#incomeOwner").value,received:false});
 e.target.reset();document.querySelector("#incomeDialog").close();save();
});
document.addEventListener("click",e=>{
 const paid=e.target.closest("[data-paid]");if(paid){const c=state.costs.find(x=>x.id===paid.dataset.paid);if(c)c.paid=!c.paid;save()}
 const del=e.target.closest("[data-delete]");if(del){if(confirm("Diese Fixkosten wirklich löschen?")){state.costs=state.costs.filter(x=>x.id!==del.dataset.delete);save()}}
 const received=e.target.closest("[data-received]");if(received){const i=state.incomes.find(x=>x.id===received.dataset.received);if(i)i.received=!i.received;save()}
 const idel=e.target.closest("[data-income-delete]");if(idel){if(confirm("Diese Einnahme wirklich löschen?")){state.incomes=state.incomes.filter(x=>x.id!==idel.dataset.incomeDelete);save()}}
 const acc=e.target.closest("[data-account]");if(acc){const a=state.accounts.find(x=>x.id===acc.dataset.account);if(a){document.querySelector("#accountName").textContent=a.name;document.querySelector("#accountBalance").value=a.balance;document.querySelector("#accountForm").dataset.id=a.id;document.querySelector("#accountDialog").showModal()}}
});
document.querySelector("#accountForm").addEventListener("submit",e=>{
 if(e.submitter?.value==="cancel")return;e.preventDefault();
 const a=state.accounts.find(x=>x.id===e.target.dataset.id);if(a){a.balance=Number(document.querySelector("#accountBalance").value)||0;save()}
 document.querySelector("#accountDialog").close();
});
document.addEventListener("change",e=>{
 const balanceField=e.target.closest("[data-balance]");
 if(balanceField){
  const a=state.accounts.find(x=>x.id===balanceField.dataset.balance);
  if(a){a.balance=Number(balanceField.value)||0;save()}
 }
 const balanceDateField=e.target.closest("[data-balance-date]");
 if(balanceDateField){
  state.balanceDates=state.balanceDates||{};
  state.balanceDates[balanceDateField.dataset.balanceDate]=balanceDateField.value||todayISO();
  const fd=state.forecastDates?.[balanceDateField.dataset.balanceDate];
  if(fd&&fd<balanceDateField.value)state.forecastDates[balanceDateField.dataset.balanceDate]=balanceDateField.value;
  save()
 }
 const field=e.target.closest("[data-forecast-date]");
 if(field){
  state.forecastDates=state.forecastDates||{};
  state.forecastDates[field.dataset.forecastDate]=field.value||todayISO();
  save();
 }
});
if("serviceWorker" in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(()=>{});
render();
