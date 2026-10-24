export const PERIOD = {start:'2026-10-01',end:'2026-10-31',days:31,cutoff:'2026-11-02'};
const day=s=>Date.parse(s+'T00:00:00Z');
export const cents=n=>Math.round(Number(n)*100);
export const usd=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(n/100);
export function seed(){return {
 contracts:[
 {id:'ALD',name:'Alder Residential',property:'Alder North',units:420,rate:4,previousUnits:400,previousRate:4,previousActive:true,activation:'2026-08-01',end:null,setup:0,owner:'Maya · Finance',roi:{noiBefore:92000,noiAfter:95000,occBefore:92,occAfter:93.1,hoursBefore:24,hoursAfter:10,hourly:55}},
 {id:'BIR',name:'Birch Living',property:'Birch House',units:180,rate:5,previousUnits:0,previousRate:5,previousActive:false,activation:'2026-10-16',end:null,setup:750,owner:'Eli · Customer Ops',roi:{noiBefore:null,noiAfter:61000,occBefore:null,occAfter:91.4,hoursBefore:18,hoursAfter:8,hourly:55}},
 {id:'CED',name:'Cedar Communities',property:'Cedar West',units:300,rate:3.5,previousUnits:300,previousRate:4,previousActive:true,activation:'2026-07-01',end:null,setup:0,owner:'Maya · Finance',roi:{noiBefore:68000,noiAfter:67000,occBefore:94,occAfter:93.6,hoursBefore:20,hoursAfter:12,hourly:55}},
 {id:'DUN',name:'Dune Property Group',property:'Dune Park',units:250,rate:4,previousUnits:250,previousRate:4,previousActive:true,activation:'2026-06-01',end:'2026-10-20',setup:0,owner:'Noah · Data Ops',roi:{noiBefore:73000,noiAfter:74500,occBefore:90,occAfter:91,hoursBefore:16,hoursAfter:9,hourly:55}}
 ],
 usage:[{id:'u-101',contract:'ALD',units:420,asOf:'2026-10-31',received:'2026-11-01'},{id:'u-102',contract:'BIR',units:180,asOf:'2026-10-31',received:'2026-11-01'},{id:'u-102',contract:'BIR',units:180,asOf:'2026-10-31',received:'2026-11-01'},{id:'u-104',contract:'DUN',units:250,asOf:'2026-10-20',received:'2026-11-04'}],
 approval:false
};}
export function serviceDays(c){if(!c.activation)return 0;const lo=Math.max(day(c.activation),day(PERIOD.start)),hi=Math.min(day(c.end||PERIOD.end),day(PERIOD.end));return Math.max(0,Math.round((hi-lo)/86400000)+1);}
export function build(state){
 const issues=[],seen=new Map(),rows=[];
 for(const u of state.usage){if(seen.has(u.id)){const a=seen.get(u.id);const same=JSON.stringify(a)===JSON.stringify(u);issues.push({key:'duplicate-'+u.id,contract:u.contract,type:same?'Duplicate excluded':'Conflicting duplicate',blocking:!same,owner:'Noah · Data Ops',action:same?'Drop duplicate row; retain original event ID.':'Reconcile source-of-truth record before release.',fix:'duplicate'});if(!same)a.conflict=true;continue;}seen.set(u.id,{...u});}
 const invoices=state.contracts.map(c=>{
  const before=c.previousActive?cents(c.previousUnits*c.previousRate):0;
  const activeAtEnd=!!c.activation&&c.activation<=PERIOD.end&&(!c.end||c.end>PERIOD.end);
  const after=activeAtEnd?cents(c.units*c.rate):0;
  const days=serviceDays(c),recurring=Math.round(cents(c.units*c.rate)*days/PERIOD.days);
  const setup=c.activation&&c.activation>=PERIOD.start&&c.activation<=PERIOD.end?cents(c.setup):0;
  const matches=[...seen.values()].filter(u=>u.contract===c.id).sort((a,b)=>b.asOf.localeCompare(a.asOf));
  const u=matches[0];const own=[];
  const expectedAsOf=c.end&&c.end<PERIOD.end?c.end:PERIOD.end;
  if(!c.activation)own.push({type:'Missing activation',action:'Confirm service start with Customer Ops.',fix:'activation'});
  if(!u&&days>0)own.push({type:'Missing usage',action:'Obtain a signed-off product snapshot.',fix:'missing'});
  if(u&&u.units!==c.units)own.push({type:'Unit mismatch',action:`Reconcile ${u.units} product units against ${c.units} contracted units.`,fix:'units'});
  if(u&&u.asOf!==expectedAsOf)own.push({type:'Stale snapshot',action:`Refresh to ${expectedAsOf} or document final service date.`,fix:'stale'});
  if(u&&u.received>PERIOD.cutoff)own.push({type:'Late arrival',action:'Verify late record and reopen the billing review.',fix:'late'});
  if(u?.conflict)own.push({type:'Conflicting duplicate',action:'Resolve conflicting source values.',fix:'duplicate'});
  for(const e of own)issues.push({...e,key:c.id+'-'+e.fix,contract:c.id,blocking:true,owner:c.owner});
  const blocked=own.length>0;
  return {id:c.id,name:c.name,days,recurring,setup,total:recurring+setup,before,after,blocked,source:u?.id||'Missing',beforeUnits:c.previousUnits,units:c.units,rate:c.rate};
 });
 const before=invoices.reduce((s,i)=>s+i.before*12,0),after=invoices.reduce((s,i)=>s+i.after*12,0);
 let newARR=0,expansion=0,contraction=0,churn=0;
 for(const i of invoices){const delta=(i.after-i.before)*12;if(!i.before&&i.after)newARR+=delta;else if(i.before&&!i.after)churn+=-delta;else if(delta>0)expansion+=delta;else contraction+=-delta;}
 const draft=invoices.filter(i=>!i.blocked).reduce((s,i)=>s+i.total,0),held=invoices.filter(i=>i.blocked).reduce((s,i)=>s+i.total,0);
 const recurring=invoices.filter(i=>!i.blocked).reduce((s,i)=>s+i.recurring,0),oneTime=invoices.filter(i=>!i.blocked).reduce((s,i)=>s+i.setup,0);
 return {invoices,issues,arr:{before,after,newARR,expansion,contraction,churn,balanced:before+newARR+expansion-contraction-churn===after},draft,held,recurring,oneTime,expected:draft+held,ready:issues.every(i=>!i.blocking),approved:state.approval&&issues.every(i=>!i.blocking)};
}
export function roi(c){const r=c.roi;const noiChange=r.noiBefore===null||r.noiAfter===null?null:cents(r.noiAfter-r.noiBefore);const occupancy=r.occBefore===null||r.occAfter===null?null:r.occAfter-r.occBefore;const labor=r.hoursBefore===null||r.hoursAfter===null?null:cents((r.hoursBefore-r.hoursAfter)*r.hourly);const fee=cents(c.units*c.rate);return {noiChange,occupancy,labor,fee,netLabor: labor===null?null:labor-fee};}
export function resolve(state,issue){state.approval=false;const c=state.contracts.find(c=>c.id===issue.contract);if(issue.fix==='duplicate'){const seen=new Set();state.usage=state.usage.filter(u=>{if(seen.has(u.id))return false;seen.add(u.id);return true;});return;}
 if(issue.fix==='activation')c.activation=PERIOD.start;
 let u=state.usage.find(u=>u.contract===c.id);if(!u){u={id:'review-'+c.id,contract:c.id};state.usage.push(u);}
 u.units=c.units;u.asOf=c.end&&c.end<PERIOD.end?c.end:PERIOD.end;u.received=PERIOD.cutoff;
}
export function memo(state){const m=build(state);return `# Customer-to-Cash Operating Review\nOctober 2026 · synthetic demonstration · USD\n\n## Decision\n${m.ready?'Reconciliation complete; request Finance approval for the draft pack.':'Hold '+usd(m.held)+' pending data-owner review; advance the validated draft of '+usd(m.draft)+'.'} No invoices are sent and no QuickBooks connection exists.\n\n## Billing bridge\nReleased recurring ${usd(m.recurring)} + released one-time ${usd(m.oneTime)} + held draft ${usd(m.held)} = expected service charges ${usd(m.expected)}.\n\n## ARR bridge (committed recurring, unprorated)\nOpening ${usd(m.arr.before)} + new ${usd(m.arr.newARR)} + expansion ${usd(m.arr.expansion)} - contraction ${usd(m.arr.contraction)} - churn ${usd(m.arr.churn)} = closing ${usd(m.arr.after)}. One-time fees excluded.\n\n## Exceptions\n${m.issues.map(i=>`- ${i.contract}: ${i.type}; ${i.owner}; ${i.action}`).join('\n')||'None'}\n\n## ROI caution\nAll property metrics are synthetic before/after observations, not causal attribution or realized Rentana results. Missing baselines remain unknown. Labor-only value excludes NOI change to avoid double counting.\n\n${state.contracts.map(c=>{const r=roi(c);return '- '+c.name+': NOI change '+(r.noiChange===null?'Unknown':usd(r.noiChange))+'; occupancy change '+(r.occupancy===null?'Unknown':r.occupancy.toFixed(1)+' pp')+'; assumed labor value '+(r.labor===null?'Unknown':usd(r.labor))+'; full monthly fee '+usd(r.fee)+'; labor-only net value '+(r.netLabor===null?'Unknown':usd(r.netLabor))+'.';}).join('\n')}\n\n## Repeatable close\n1. Data Ops snapshots contracted and activated units; keep stable event IDs.\n2. Customer Ops confirms inclusive service dates and one-time terms.\n3. Finance reconciles recurring/one-time/held totals and ARR movements.\n4. Data owners clear missing, stale, conflicting and late records.\n5. Finance reviewer approves draft and imports it in the real accounting workflow only after independent verification.\n\nApproval status: ${m.approved?'Reviewed in this local simulation':'Not approved'}.\n\nPrimary context: https://www.rentana.io/careers/strategy-operations-associate and https://www.rentana.io/blog/rentana-revenue-management\n`;}
