const KEY="familienkonto-v01";
const defaults={
  accounts:[{id:"you",name:"Mein Girokonto",balance:2450},{id:"partner",name:"Girokonto meiner Frau",balance:1000}],
  reserve:300,
  costs:[
    {id:crypto.randomUUID(),name:"Miete",amount:1100,day:1,owner:"you",category:"Wohnen",paid:false},
    {id:crypto.randomUUID(),name:"Strom",amount:120,day:5,owner:"you",category:"Wohnen",paid:false},
    {id:crypto.randomUUID(),name:"Internet & Mobilfunk",amount:65,day:8,owner:"you",category:"Verträge",paid:false},
    {id:crypto.randomUUID(),name:"Autoversicherung",amount:85,day:12,owner:"you",category:"Mobilität",paid:false},
    {id:crypto.randomUUID(),name:"Versicherungen",amount:95,day:15,owner:"partner",category:"Versicherung",paid:false},
    {id:crypto.randomUUID(),name:"Streaming & Abos",amount:32,day:20,owner:"partner",category:"Abos",paid:false}
  ]
};
let state=load();
function load(){try{return JSON.parse(localStorage.getItem(KEY))||defaults}catch{return defaults}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));render()}
const euro=n=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(Number(n)||0);
const total=()=>state.accounts.reduce((s,a)=>s+Number(a.balance||0),0);
const monthly=()=>state.costs.reduce((s,c)=>s+Number(c.amount||0),0);
const outstanding=()=>state.costs.filter(c=>!c.paid).reduce((s,c)=>s+Number(c.amount||0),0);
const available=()=>total()-outstanding()-Number(state.reserve||0);
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function render(){
 document.querySelector("#available").textContent=euro(available());
 document.querySelector("#totalBalance").textContent=euro(total());
 document.querySelector("#remainingCosts").textContent=euro(outstanding());
 document.querySelector("#monthlyCosts").textContent=euro(monthly());
 document.querySelector("#reserve").value=state.reserve;
 const sorted=[...state.costs].sort((a,b)=>a.day-b.day);
 document.querySelector("#upcoming").innerHTML=sorted.filter(c=>!c.paid).slice(0,4).map(costRow).join("")||'<div class="empty">Keine offenen Fixkosten eingetragen.</div>';
 document.querySelector("#costList").innerHTML=sorted.map(c=>`<div class="list-card"><div class="ico">${categoryIcon(c.category)}</div><div class="row-main"><strong>${esc(c.name)}</strong><small>Tag ${c.day} · ${esc(c.category)} · ${c.owner==="you"?"Dein Konto":"Konto deiner Frau"}</small><div class="amount">${euro(c.amount)}</div></div><button class="paid ${c.paid?"done":""}" data-paid="${c.id}">${c.paid?"Bezahlt":"Offen"}</button><button class="delete" data-delete="${c.id}" aria-label="Löschen">×</button></div>`).join("")||'<div class="empty">Noch keine Fixkosten. Füge eure regelmäßigen Abbuchungen hinzu.</div>';
 document.querySelector("#accountList").innerHTML=state.accounts.map(a=>`<div class="list-card"><div class="ico">€</div><div class="row-main"><strong>${esc(a.name)}</strong><small>Sparkasse Rhein-Haardt · manuell gepflegt</small><div class="amount">${euro(a.balance)}</div></div><button class="account-edit" data-account="${a.id}">Ändern</button></div>`).join("");
}
function categoryIcon(cat){return ({Wohnen:"⌂",Mobilität:"↗",Versicherung:"◇",Verträge:"▤",Abos:"▷"})[cat]||"€"}
function costRow(c){return `<div class="row"><div class="ico">${categoryIcon(c.category)}</div><div class="row-main"><strong>${esc(c.name)}</strong><small>Tag ${c.day} · ${c.owner==="you"?"Dein Konto":"Konto deiner Frau"}</small></div><div class="amount">−${euro(c.amount)}</div></div>`}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.tab)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.go)));
function showTab(id){document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===id));document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id))}
document.querySelector("#reserve").addEventListener("change",e=>{state.reserve=Math.max(0,Number(e.target.value)||0);save()});
document.querySelector("#addCost").addEventListener("click",()=>document.querySelector("#costDialog").showModal());
document.querySelector("#costForm").addEventListener("submit",e=>{
 if(e.submitter?.value==="cancel")return;
 e.preventDefault();
 const name=document.querySelector("#costName").value.trim(),amount=Number(document.querySelector("#costAmount").value),day=Number(document.querySelector("#costDay").value);
 if(!name||amount<=0||day<1||day>31)return;
 state.costs.push({id:crypto.randomUUID(),name,amount,day,owner:document.querySelector("#costOwner").value,category:document.querySelector("#costCategory").value,paid:false});
 e.target.reset();document.querySelector("#costDialog").close();save();
});
document.addEventListener("click",e=>{
 const paid=e.target.closest("[data-paid]");if(paid){const c=state.costs.find(x=>x.id===paid.dataset.paid);if(c)c.paid=!c.paid;save()}
 const del=e.target.closest("[data-delete]");if(del){if(confirm("Diese Fixkosten wirklich löschen?")){state.costs=state.costs.filter(x=>x.id!==del.dataset.delete);save()}}
 const acc=e.target.closest("[data-account]");if(acc){const a=state.accounts.find(x=>x.id===acc.dataset.account);if(a){document.querySelector("#accountName").textContent=a.name;document.querySelector("#accountBalance").value=a.balance;document.querySelector("#accountForm").dataset.id=a.id;document.querySelector("#accountDialog").showModal()}}
});
document.querySelector("#accountForm").addEventListener("submit",e=>{
 if(e.submitter?.value==="cancel")return;e.preventDefault();
 const a=state.accounts.find(x=>x.id===e.target.dataset.id);if(a){a.balance=Number(document.querySelector("#accountBalance").value)||0;save()}
 document.querySelector("#accountDialog").close();
});
if("serviceWorker" in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(()=>{});
render();