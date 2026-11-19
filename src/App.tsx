import {useEffect,useRef,useState} from 'react';
import {Plus,BookOpen,Calculator,Download,Upload,RotateCcw,ChevronRight,Trash2} from 'lucide-react';
import {blankMonster,calculate,combinedIed,defenseDamage,improvement,monsterFields,newCharacter,newData,type Character,type CharacterSubTab,type Data,type Gear,type Simple,type Skill,type Requirement,type SetId,checkSubRequirements,activeSetBonuses,setDefinitions,setOptions,setName} from './model';
import {mileageCatalog,netMileage,unitMesoPrice,type MileageItem,type CustomMileageItem} from './mileage';
const storage='maplestar-calculator-v1';
const num=(v:string)=>v===''?0:Number(v);
const fmt=(n:number,d=0)=>n.toLocaleString('zh-TW',{minimumFractionDigits:d,maximumFractionDigits:d});
function load():Data{try{const v=JSON.parse(localStorage.getItem(storage)||'null');if(v?.version===1&&Array.isArray(v.characters)&&v.characters.length)return {...v,characters:v.characters.map((c:Character)=>({...c,skills:Array.isArray(c.skills)?c.skills.map(s=>s.name==='女神的祝福'?{...s,name:'女皇的祝福'}:s):[]}))}}catch{}return newData()}
function NumberInput({value,onChange,placeholder='0',percent=false}:{value:number;onChange:(v:number)=>void;placeholder?:string;percent?:boolean}){
 const input=<input type="number" inputMode="decimal" value={value===0?'':value} placeholder={placeholder} onChange={e=>onChange(num(e.target.value))} onKeyDown={e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown')e.preventDefault()}} onWheel={e=>e.currentTarget.blur()}/>;
 return percent?<span className="numeric-percent">{input}<span className="percent-mark">%</span></span>:input;
}
function Field({label,value,onChange,unit}:{label:string;value:number;onChange:(n:number)=>void;unit?:string}){
 const suffix=unit??(label.includes('(%)')?'%':undefined);
 return <label className="field"><span>{label}</span><div className="field-control"><NumberInput value={value} onChange={onChange}/>{suffix&&<span className="unit">{suffix}</span>}</div></label>;
}
function Section({title,description,action,children}:{title:string;description?:string;action?:React.ReactNode;children:React.ReactNode}){return <section className="panel"><div className="panel-heading"><div className="panel-title-row"><h2>{title}</h2>{action}</div>{description&&<p>{description}</p>}</div>{children}</section>}
const statOptions:[Character['mainStat'],string][]=[['str','力量'],['dex','敏捷'],['int','智力'],['luk','幸運']];
const simpleLabels:[keyof Simple,string][]=[['attack','攻擊力'],['main','主屬性'],['sub','副屬性']];
const gearKeys:[keyof Gear,string][]=[['attack','攻擊力'],['main','主屬性'],['sub','副屬性'],['potentialAttack','潛能攻擊力'],['potentialMain','潛能主屬性'],['potentialSub','潛能副屬性'],['potentialAttackPct','潛能攻擊力(%)'],['potentialMainPct','潛能主屬性(%)'],['potentialSubPct','潛能副屬性(%)']];
const weaponGroups:[string,[string,number][]][]=[
 ['劍士',[['單手劍',1.2],['單手斧',1.2],['單手棍',1.2],['雙手劍',1.34],['雙手斧',1.34],['雙手棍',1.34],['槍',1.49],['矛',1.49]]],
 ['法師',[['短杖',1.0],['長杖',1.0]]],
 ['弓箭手',[['弓',1.3],['弩',1.35],['雙弩槍',1.3]]],
 ['盜賊',[['短劍',1.3],['拳套',1.75],['手杖',1.3]]],
 ['海盜',[['指虎',1.7],['火槍',1.5],['加農砲',1.5]]]
];

function MonsterPage({data,set}:{data:Data;set:(d:Data)=>void}){
 const update=(k:keyof typeof blankMonster,v:number)=>set({...data,monster:{...data.monster,[k]:v}});
 const fields=(start:number,end:number)=>(monsterFields.slice(start,end).map(([k,label])=><Field key={k} label={label} value={data.monster[k]} unit={k.endsWith('Pct')||k==='ied'||k==='bossPct'||k==='damagePct'?'%':undefined} onChange={v=>update(k,v)}/>));
 return <><p className="intro">統計怪物圖鑑中的所有加成。</p><Section title="屬性加成"><div className="fields-grid four">{fields(0,4)}</div><div className="fields-grid two spaced">{fields(4,6)}</div></Section><Section title="攻擊與傷害加成"><div className="fields-grid two">{fields(6,8)}</div><div className="fields-grid three spaced">{fields(8,11)}</div></Section></>
}
function IedPage({data,set}:{data:Data;set:(d:Data)=>void}){
 const total=combinedIed(data.ied);
 return <><p className="intro">計算實際無視防禦率及不同 BOSS 防禦率下的增傷幅度。</p>
 <Section title="實際無視防禦計算" description="無視來源以乘法疊加，而非直接相加。"><div className="ied-grid">{data.ied.map((v,i)=><Field key={i} label="無視(%)" value={v} unit="%" onChange={n=>set({...data,ied:data.ied.map((x,j)=>i===j?n:x)})}/>)}</div><div className="result-strip"><span>總無視(%)</span><strong>{fmt(total,1)}%</strong></div></Section>
 <Section title="無視提升後增傷計算"><div className="fields-grid two"><Field label="原無視(%)" value={data.oldIed} unit="%" onChange={n=>set({...data,oldIed:n})}/><Field label="新無視(%)" value={data.newIed} unit="%" onChange={n=>set({...data,newIed:n})}/></div><div className="table-scroll"><table className="data-table"><thead><tr><th>BOSS防禦(%)</th><th>原傷害(%)</th><th>新傷害(%)</th><th>傷害提升(%)</th></tr></thead><tbody>{[40,50,55,60,70,100,180,200].map(def=>{const old=defenseDamage(def,data.oldIed),next=defenseDamage(def,data.newIed),inc=improvement(old,next);return <tr key={def}><td>{def}%</td><td>{fmt(old,1)}%</td><td>{fmt(next,1)}%</td><td className={inc===null?'':inc>0?'positive':inc<0?'negative':''}>{inc===null?'無法計算':`${inc>0?'+':''}${fmt(inc,1)}%`}</td></tr>})}</tbody></table></div></Section></>
}
function CharacterSettings({c,update}:{c:Character;update:(c:Character)=>void}){
 const patch=(p:Partial<Character>)=>update({...c,...p});
 return <><p className="intro">設定角色主屬性與副屬性種類，武器熟練度需查詢自身技能，武器係數則參考下方表格</p><Section title="角色設定"><div className="fields-grid four"><label className="field"><span>主屬性種類</span><select value={c.mainStat} onChange={e=>patch({mainStat:e.target.value as Character['mainStat']})}>{statOptions.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label className="field"><span>副屬性種類</span><select value={c.subStat} onChange={e=>patch({subStat:e.target.value as Character['subStat']})}>{statOptions.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><Field label="武器熟練度(%)" value={c.mastery} unit="%" onChange={v=>patch({mastery:v})}/><Field label="武器係數" value={c.weaponCoefficient} onChange={v=>patch({weaponCoefficient:v})}/></div></Section>
 <Section title="武器係數參考"><div className="weapon-reference">{weaponGroups.map(([group,items])=><div key={group} className="weapon-group"><h3>{group}</h3>{items.map(([name,coefficient])=><div className="weapon-row" key={name}><span>{name}</span><strong>{coefficient.toFixed(2)}</strong></div>)}</div>)}</div><p className="hint">參考常見舊版楓之谷數值；楓星若有不同設定，請以上方可編輯的武器係數為準。</p></Section></>
}
const statName=(c:Character,key:'main'|'sub')=>statOptions.find(([id])=>id===(key==='main'?c.mainStat:c.subStat))?.[1]??(key==='main'?'主屬性':'副屬性');
const roleLabel=(c:Character,label:string)=>label.replace(/主屬性|副屬性/g,match=>match==='主屬性'?statName(c,'main'):statName(c,'sub'));
const previewTerms=(c:Character,v:Partial<Record<'attack'|'main'|'sub'|'attackPct'|'mainPct'|'subPct',number>>)=>{
 const labels:[keyof typeof v,string,boolean][]=[
 ['attack','攻擊',false],['main',statName(c,'main'),false],['sub',statName(c,'sub'),false],
 ['attackPct','攻擊',true],['mainPct',statName(c,'main'),true],['subPct',statName(c,'sub'),true]];
 return labels.flatMap(([key,label,pct])=>{const value=v[key]??0;return Number.isFinite(value)&&value!==0?[`${label}+${value}${pct?'%':''}`]:[]});
};
function EffectPreview({items}:{items:{label:string;text:string}[]}){
 const shown=items.filter(item=>item.text);
 return shown.length?<div className="effect-preview">{shown.map(item=><div key={item.label} className="effect-preview-row"><strong>{item.label}</strong><span> - {item.text}</span></div>)}</div>:null;
}
function SkillSettings({c,update}:{c:Character;update:(c:Character)=>void}){
 const change=(i:number,k:keyof Skill,v:number|string)=>update({...c,skills:c.skills.map((s,j)=>i===j?{...s,[k]:v}:s)});
 const add=()=>update({...c,skills:[...c.skills,{name:'',attack:0,main:0,sub:0,attackPct:0}]});
 const remove=(i:number)=>update({...c,skills:c.skills.filter((_,j)=>j!==i)});
 const [showPreview,setShowPreview]=useState(false);
 const previewItems=c.skills.map((skill,i)=>({label:skill.name.trim()||`技能${i+1}`,text:previewTerms(c,skill).join(', ')}));
 return <><p className="intro">僅統計除楓葉祝福以外的自身技能，不要包含隊友與天氣、藥的效果。</p><Section title="技能加成" action={<button className="ghost preview-toggle" type="button" onClick={()=>setShowPreview(v=>!v)}>{showPreview?'關閉效果預覽':'展開效果預覽'}</button>}><div className="table-scroll"><table className="data-table editable"><thead><tr><th>技能</th><th>攻擊力</th><th>{statName(c,'main')}</th><th>{statName(c,'sub')}</th><th>攻擊力(%)</th><th></th></tr></thead><tbody>{c.skills.map((s,i)=><tr key={i}><td><input className="name-input" value={s.name} aria-label={`技能${i+1}名稱`} placeholder="技能名稱" onChange={e=>change(i,'name',e.target.value)}/></td>{(['attack','main','sub','attackPct'] as const).map(k=><td key={k}><NumberInput value={s[k]} percent={k==='attackPct'} onChange={v=>change(i,k,v)}/></td>)}<td><button className="icon-button" title="移除此技能" aria-label="移除此技能" disabled={c.skills.length<=1} onClick={()=>remove(i)}><Trash2 size={16}/></button></td></tr>)}</tbody></table></div><button className="ghost add-row" onClick={add}><Plus size={16}/>新增技能</button>{showPreview&&<EffectPreview items={previewItems}/>}</Section></>
}

function DamagePage({c,monster,update}:{c:Character;monster:Data['monster'];update:(c:Character)=>void}){
 const calc=calculate(c,monster),patch=(p:Partial<Character>)=>update({...c,...p});
 const metric=(label:string,value:number,percent=false)=><div className="metric" key={label}><span>{roleLabel(c,label)}</span><strong>{fmt(value,0)}{percent?'%':''}</strong></div>;
 const boost=calc.range===0?null:(calc.afterRange/calc.range-1)*100;
 const enhancements:[keyof Character['extra'],number,string][]=[
  ['attack',10,'攻擊力 +10'],['attack',20,'攻擊力 +20'],['attack',30,'攻擊力 +30'],
  ['attackPct',6,'攻擊力 +6%'],['attackPct',9,'攻擊力 +9%'],['attackPct',12,'攻擊力 +12%'],
  ['mainPct',3,'主屬性 +3%'],['mainPct',6,'主屬性 +6%'],['mainPct',9,'主屬性 +9%'],['mainPct',12,'主屬性 +12%']
 ];
 const recommendations=enhancements.map(([field,amount,label],index)=>{
  const extra={attack:0,main:0,sub:0,attackPct:0,mainPct:0,subPct:0,[field]:amount};
  const tested=calculate({...c,extra},monster);
  return {label:roleLabel(c,label),gain:tested.afterRange-calc.range,pct:calc.range>0?(tested.afterRange-calc.range)/calc.range*100:null,index};
 }).sort((a,b)=>b.gain-a.gain||a.index-b.index);
 return <><div className="page-descriptions"><p>表攻最大值計算、裝備提升期望計算與推薦。</p><p>因公式中進位條件可能與遊戲不同，數值可能與遊戲內有些微誤差。</p></div><Section title="基本設定"><div className="fields-grid two"><Field label={roleLabel(c,"主屬性（能力配點）")} value={c.baseMain} onChange={v=>patch({baseMain:v})}/><Field label={roleLabel(c,"副屬性（能力配點）")} value={c.baseSub} onChange={v=>patch({baseSub:v})}/></div><div className="fields-grid two spaced"><Field label="楓葉祝福等級" value={c.mapleBlessing} onChange={v=>patch({mapleBlessing:v})}/><div className="blessing-info">楓葉祝福提升 {fmt(calc.blessing)}%全屬性</div></div></Section>
 <Section title="額外效果"><div className="fields-grid three">{([['attack','攻擊力'],['main','主屬性'],['sub','副屬性']] as [keyof Simple,string][]).map(([k,label])=><Field key={k} label={roleLabel(c,label)} value={c.consumables[k]} onChange={v=>patch({consumables:{...c.consumables,[k]:v}})}/>)}</div></Section>
 <Section title="目前數值總覽"><div className="metrics">{metric('攻擊力',calc.fixedAttack)}{metric('主屬性 (含楓葉祝福)',calc.fixedMain)}{metric('副屬性 (含楓葉祝福)',calc.fixedSub)}{metric('攻擊力(%)',calc.attackPct,true)}{metric('主屬性(%)',calc.mainPct,true)}{metric('副屬性(%)',calc.subPct,true)}</div><div className="metrics metric-separated">{metric('最終攻擊力',calc.finalAttack)}{metric('最終主屬性',calc.finalMain)}{metric('最終副屬性',calc.finalSub)}</div><div className="result-strip"><span>表攻上限</span><strong>{fmt(calc.range)}</strong></div></Section>
 <Section title="額外裝備提升試算"><div className="fields-grid three">{([['attack','攻擊力'],['main','主屬性'],['sub','副屬性'],['attackPct','攻擊力(%)'],['mainPct','主屬性(%)'],['subPct','副屬性(%)']] as [keyof Character['extra'],string][]).map(([k,label])=><Field key={k} label={roleLabel(c,label)} value={c.extra[k]} unit={k.endsWith('Pct')?'%':undefined} onChange={v=>patch({extra:{...c.extra,[k]:v}})}/>)}</div><div className="metrics spaced">{metric('最終攻擊力',calc.afterAttack)}{metric('最終主屬性',calc.afterMain)}{metric('最終副屬性',calc.afterSub)}</div><div className="result-strip"><span>提升後表攻上限</span><strong>{fmt(calc.afterRange)}</strong></div><div className="result-strip"><span>表攻提升幅度(%)</span><strong className={boost!==null&&boost<0?'negative':'positive'}>{boost===null?'無法計算':`${boost>0?'+':''}${fmt(boost,1)}%`}</strong></div></Section>
 <Section title="推薦強化" description="各項強化分別加入目前角色數值，依表攻上限增加量由高到低排序；不包含額外裝備提升試算中的數值。">
  <div className="table-scroll"><table className="data-table recommendation-table"><thead><tr><th>排名</th><th>強化項目</th><th>表攻提升數值</th></tr></thead>
  <tbody>{recommendations.map((r,i)=><tr key={r.index}><td>{i+1}</td><td>{r.label}</td><td className={r.gain>0?'positive':''}>{r.gain>0?'+':''}{fmt(r.gain)} ({r.pct===null?'無法計算':`${r.pct>0?'+':''}${fmt(r.pct,1)}%`})</td></tr>)}</tbody></table></div>
 </Section></>
}
function EquipmentPage({c,update}:{c:Character;update:(c:Character)=>void}){
 const [expanded,setExpanded]=useState<Record<string,boolean>>({});
 const [gearPicker,setGearPicker]=useState<string|null>(null);
 const toggle=(key:string)=>setExpanded(v=>({...v,[key]:!v[key]}));
 const button=(key:string)=><button type="button" className="ghost preview-toggle" onClick={()=>toggle(key)}>{expanded[key]?'關閉效果預覽':'展開效果預覽'}</button>;
 const change=(id:string,k:keyof Gear,v:number)=>update({...c,gear:c.gear.map(g=>g.id===id?{...g,[k]:v}:g)});
 const changeSet=(i:number,k:keyof Simple,v:number)=>update({...c,sets:Array.from({length:3},(_,j)=>j===i?{...(c.sets[j]??{attack:0,main:0,sub:0}),[k]:v}:(c.sets[j]??{attack:0,main:0,sub:0}))});
 const chooseSet=(id:string,setId:SetId)=>{update({...c,gear:c.gear.map(g=>g.id===id?{...g,setId}:g)});setGearPicker(null)};
 const pickerGear=c.gear.find(g=>g.id===gearPicker);
 const groups=['武器類','防具類','飾品類','其他類'];
 const autoSets=activeSetBonuses(c.gear);
 return <><p className="intro">統計裝備數值，潛能數值需分開統計，用於後續鎖潛檢查。</p><p className="intro equipment-second-intro">點擊裝備類別，可以選擇凡雷恩、女皇...等，系統會統計套裝效果。</p>
 {groups.map(group=><Section key={group} title={group} action={button(group)}>
 <div className="table-scroll"><table className="data-table editable gear-table"><thead><tr><th>裝備</th>{gearKeys.filter(([k])=>group==='武器類'||(k!=='potentialAttack'&&k!=='potentialAttackPct')).map(([k,label])=><th key={k} className={`gear-${k.startsWith('potential')?'potential':'standard'} ${k===(group==='武器類'?'potentialAttack':'potentialMain')?'potential-start':''}`}>{roleLabel(c,label)}</th>)}</tr></thead>
 <tbody>{c.gear.filter(g=>g.group===group).map(g=><tr key={g.id}><td className="sticky-name"><button type="button" className="gear-name-button" onClick={()=>setGearPicker(g.id)}>{g.name}<ChevronRight size={13}/></button>{g.setId&&g.setId!=='none'&&<div className="gear-set-caption">{setName(g.setId)}</div>}</td>
 {gearKeys.filter(([k])=>group==='武器類'||(k!=='potentialAttack'&&k!=='potentialAttackPct')).map(([k])=>{const enabled=k==='potentialAttackPct'?(g.name==='武器'||g.name==='副武／標誌'):true;return <td key={k} className={`gear-${k.startsWith('potential')?'potential':'standard'} ${k===(group==='武器類'?'potentialAttack':'potentialMain')?'potential-start':''}`}>{enabled?<NumberInput value={Number(g[k])||0} percent={k.endsWith('Pct')} onChange={v=>change(g.id,k,v)}/>:<span className="na">—</span>}</td>})}</tr>)}</tbody></table></div>
 {expanded[group]&&<EffectPreview items={c.gear.filter(g=>g.group===group).map(g=>{
 const basic=previewTerms(c,{attack:g.attack,main:g.main,sub:g.sub}).join(', ');
 const potential=previewTerms(c,{attack:g.potentialAttack,main:g.potentialMain,sub:g.potentialSub,attackPct:g.potentialAttackPct,mainPct:g.potentialMainPct,subPct:g.potentialSubPct}).join(', ');
 return {label:g.name,text:[basic,potential?`潛能: ${potential}`:''].filter(Boolean).join(', ')};
 })}/>}</Section>)}
 <Section title="額外套裝效果" action={button('sets')}>
 <div className="table-scroll"><table className="data-table editable"><thead><tr><th>項目</th>{simpleLabels.map(([k,label])=><th key={k}>{roleLabel(c,label)}</th>)}</tr></thead>
 <tbody>{Array.from({length:3},(_,i)=><tr key={i}><td>額外套裝效果{i+1}</td>{simpleLabels.map(([k])=><td key={k}><NumberInput value={c.sets[i]?.[k]??0} onChange={v=>changeSet(i,k,v)}/></td>)}</tr>)}</tbody></table></div>
 {expanded.sets&&<EffectPreview items={Array.from({length:3},(_,i)=>({label:`額外套裝效果${i+1}`,text:previewTerms(c,c.sets[i]??{attack:0,main:0,sub:0}).join(', ')}))}/>}</Section>
 <Section title="自動套裝效果預覽" description="依實際選擇的套裝與裝備件數自動判定；各達標件數的加成會累積。">
 <div className="auto-set-grid">{autoSets.filter(set=>set.count>0).map(set=><div className="auto-set-card" key={set.id}><div className="auto-set-title"><strong>{set.name}</strong><span>{set.count} / {set.max} 件</span></div>
 {set.levels.filter(level=>set.count<set.levels[0].required||level.active).map(level=><div key={level.required} className={level.active?'set-level active':'set-level'}><span>{level.required} 件</span><span>{[level.attack?`攻擊+${level.attack}`:'',level.all?`全屬性+${level.all}`:''].filter(Boolean).join(', ')}</span><span>{level.active?'已觸發':'未觸發'}</span></div>)}
 </div>)}</div></Section>
 {pickerGear&&<div className="modal-backdrop"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="gear-set-title"><h2 id="gear-set-title">設定 {pickerGear.name} 的套裝</h2><p>請選擇所屬套裝。只有符合套裝部位的裝備可以選擇該套裝。</p>
 <div className="set-picker-options">{setOptions(pickerGear).map(option=><button type="button" key={option} className={pickerGear.setId===option||(!pickerGear.setId&&option==='none')?'set-picker-choice selected':'set-picker-choice'} onClick={()=>chooseSet(pickerGear.id,option)}>{setName(option)}</button>)}</div>
 <div className="modal-actions"><button className="ghost" onClick={()=>setGearPicker(null)}>取消</button></div></div></div>}
 </>;
}

function SubStatPage({c,monster,update}:{c:Character;monster:Data['monster'];update:(c:Character)=>void}){
 const rows=c.requirements?.length?c.requirements:[{id:'requirement-1',gearId:'',required:0}];
 const patch=(next:Requirement[])=>update({...c,requirements:next});
 const result=checkSubRequirements(c,monster);
 const selections=new Set(rows.map(r=>r.gearId).filter(Boolean));
 const add=()=>patch([...rows,{id:'requirement-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),gearId:'',required:0}]);
 return <><p className="intro">模擬遭遇鎖潛敵技時，裝備是否能正常套用。</p>
 <Section title={roleLabel(c,"副屬性需求")}><div className="table-scroll"><table className="data-table editable requirement-table">
 <thead><tr><th>類別</th><th>{roleLabel(c,"副屬性需求")}</th><th></th></tr></thead>
 <tbody>{rows.map((r,i)=><tr key={r.id}>
 <td><select aria-label={`第${i+1}項裝備類別`} value={r.gearId} onChange={e=>patch(rows.map((item,j)=>j===i?{...item,gearId:e.target.value}:item))}>
 <option value="">選擇裝備</option>{c.gear.map(g=><option key={g.id} value={g.id} disabled={g.id!==r.gearId&&selections.has(g.id)}>{g.name}</option>)}</select></td>
 <td><NumberInput value={r.required} onChange={v=>patch(rows.map((item,j)=>j===i?{...item,required:Math.max(0,v)}:item))}/></td>
 <td><button className="icon-button" onClick={()=>patch(rows.length===1?[{id:r.id,gearId:'',required:0}]:rows.filter((_,j)=>j!==i))} aria-label="移除此項"><Trash2 size={16}/></button></td>
 </tr>)}</tbody></table></div>
 <button className="ghost add-row" onClick={add}><Plus size={16}/>新增欄位</button>
 </Section>
 <Section title="鎖潛檢查額外設定">
 <div className="lock-settings-layout">
 <div className="lock-settings-left"><Field label={roleLabel(c,"透過秘藥或隊友效果獲得副屬性")} value={c.lockCheckExtraSub??0} onChange={v=>update({...c,lockCheckExtraSub:v})}/>
 <p className="hint">勾選代表停用對應的額外套裝效果，僅影響鎖潛檢查。</p>
 <div className="lock-set-toggles">{Array.from({length:3},(_,i)=><label key={i} className="lock-set-toggle">
 <input type="checkbox" checked={c.lockCheckDisabledSets?.[i]??true} onChange={e=>update({...c,lockCheckDisabledSets:Array.from({length:3},(_,j)=>j===i?e.target.checked:(c.lockCheckDisabledSets?.[j]??true))})}/>
 <span>額外套裝效果{i+1}{(c.sets[i]?.sub??0)!==0?' - '+statName(c,'sub')+'+'+c.sets[i].sub:' - 無'+statName(c,'sub')+'加成'}</span>
 </label>)}</div></div>
 <div className="lock-auto-preview"><h3>已觸發的套裝效果</h3>
 {result.activeSets.filter(set=>set.levels.some(level=>level.active)).length===0?<p className="hint">目前沒有觸發任何套裝效果</p>:
 result.activeSets.filter(set=>set.levels.some(level=>level.active)).map(set=><div key={set.id} className="lock-set-detail"><strong>{set.name}（{set.count} 件）</strong>
 {set.levels.filter(level=>level.active).map(level=><div key={level.required}>{level.required} 件：{[level.attack?`攻擊+${level.attack}`:'',level.all?`全屬性+${level.all}`:''].filter(Boolean).join(', ')}</div>)}
 </div>)}</div></div></Section>
 <Section title="無法穿上的裝備"><div className="table-scroll"><table className="data-table"><thead><tr><th>無法穿上的裝備類別</th><th>{roleLabel(c,"需求副屬性")}</th><th>{roleLabel(c,"現有副屬性")}</th></tr></thead>
 <tbody>{result.failed.length?result.failed.map(f=><tr key={f.gearId}><td>{f.name}</td><td>{fmt(f.required)}</td><td className="negative">{fmt(f.available)}</td></tr>):<tr><td colSpan={3} className="empty-requirements">目前沒有無法穿上的裝備</td></tr>}</tbody>
 </table></div></Section></>
}

type MileageState={gross:number;mesos:number;custom:CustomMileageItem[]};
const newMileage=():MileageState=>({gross:0,mesos:1,custom:[]});
function loadMileage():MileageState{
 try{const saved=JSON.parse(localStorage.getItem('maplestar-mileage-v2')||'null');
  if(saved&&Array.isArray(saved.custom))return {gross:Math.max(0,Number(saved.gross)||0),mesos:Math.max(0,Number(saved.mesos) || 0),custom:saved.custom.filter((item:CustomMileageItem)=>item&&typeof item.id==='string').map((item:CustomMileageItem)=>({id:item.id,name:String(item.name||''),price:Math.max(0,Number(item.price)||0),quantity:Math.max(1,Number(item.quantity)||1)}))};
 }catch{}
 // Migrate the previous version, where the second input was a raw mesos amount.
 try{
  const legacy=JSON.parse(localStorage.getItem('maplestar-mileage-v1')||'null');
  if(legacy&&Array.isArray(legacy.custom))return {
   gross:Math.max(0,Number(legacy.gross)||0),
   mesos:Number(legacy.mesos)>0?Number(legacy.mesos)/1000000:1,
   custom:legacy.custom.filter((item:CustomMileageItem)=>item&&typeof item.id==='string').map((item:CustomMileageItem)=>({id:item.id,name:String(item.name||''),price:Math.max(0,Number(item.price)||0),quantity:Math.max(1,Number(item.quantity)||1)}))
  };
 }catch{}
 return newMileage();
}
function MileagePage({value,set}:{value:MileageState;set:React.Dispatch<React.SetStateAction<MileageState>>}){
 const update=(p:Partial<MileageState>)=>set(s=>({...s,...p}));
 const fmtMeso=(item:MileageItem)=>{const amount=unitMesoPrice(item,value.gross,value.mesos);return amount===null?'—':fmt(amount)+' 楓幣'};
 const add=()=>set(s=>({...s,custom:[...s.custom,{id:'mileage-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),name:'',price:0,quantity:1}]}));
 const change=(id:string,p:Partial<CustomMileageItem>)=>set(s=>({...s,custom:s.custom.map(item=>item.id===id?{...item,...p}:item)}));
 const remove=(id:string)=>set(s=>({...s,custom:s.custom.filter(item=>item.id!==id)}));
 const head=<thead><tr><th>名稱</th><th>價格（里程）</th><th>數量</th><th>換算單位價值（楓幣）</th></tr></thead>;
 return <><p className="intro">計算里程購買之後</p>
 <Section title="里程換算"><div className="fields-grid two"><Field label="購買里程" value={value.gross} onChange={n=>update({gross:Math.max(0,n)})}/><Field label="購買數量 (百萬)" value={value.mesos} onChange={n=>update({mesos:Math.max(0,n)})}/></div>
 <div className="result-strip"><span>實際取得里程（扣除 1% 手續費）</span><strong>{fmt(netMileage(value.gross),1)}</strong></div>
 {!(value.gross>0&&value.mesos>0)&&<p className="hint">填入兩個數值後，才會計算道具的楓幣單價。</p>}</Section>
 {mileageCatalog.map(category=><Section key={category.group} title={category.group}><div className="table-scroll"><table className="data-table mileage-table">{head}
 <tbody>{category.items.map(item=><tr key={item.name}><td>{item.name}</td><td>{fmt(item.price)}</td><td>{fmt(item.quantity)}</td><td>{fmtMeso(item)}</td></tr>)}</tbody></table></div></Section>)}
 <Section title="額外" description="自訂項目與輸入的價格、數量會儲存在此瀏覽器；使用「還原至預設」時也會保留。">
 <div className="table-scroll"><table className="data-table editable mileage-table">{head}<tbody>{value.custom.map(item=><tr key={item.id}>
 <td><input className="name-input" aria-label="額外項目名稱" placeholder="項目名稱" maxLength={40} value={item.name} onChange={e=>change(item.id,{name:e.target.value})}/></td>
 <td><NumberInput value={item.price} onChange={n=>change(item.id,{price:Math.max(0,n)})}/></td><td><NumberInput value={item.quantity} onChange={n=>change(item.id,{quantity:Math.max(1,Math.floor(n))})}/></td>
 <td><span className="mileage-value">{fmtMeso(item)}</span><button className="icon-button" title="移除此項" onClick={()=>remove(item.id)}><Trash2 size={15}/></button></td></tr>)}
 </tbody></table></div><button className="ghost add-row" onClick={add}><Plus size={16}/>新增自訂項目</button></Section></>;
}

function App(){
 const [data,setData]=useState<Data>(load);
 const [mileage,setMileage]=useState<MileageState>(loadMileage);
 const [tab,setTab]=useState<string>(()=>{
  try {
   const saved=localStorage.getItem('maplestar-last-view');
   if(saved==='monster'||saved==='ied'||saved==='mileage')return saved;
   const state=JSON.parse(localStorage.getItem(storage)||'null') as Data|null;
   if(state?.characters?.some(c=>c.id===saved))return saved??'monster';
  }catch{}
  return 'monster';
 });
 const [sub,setSub]=useState<CharacterSubTab>(()=>{
  try {
   const saved=localStorage.getItem('maplestar-last-view');
   const state=JSON.parse(localStorage.getItem(storage)||'null') as Data|null;
   const c=state?.characters?.find(x=>x.id===saved);
   return c?.lastSubTab??'settings';
  }catch{return 'settings'}
 });
 const initialScroll=useRef(true);
 const [lastCharacter,setLastCharacter]=useState<string>(()=>{try{return localStorage.getItem('maplestar-last-character')||''}catch{return ''}});
 const [lastCalculator,setLastCalculator]=useState<string>(()=>{
  try{
   const saved=localStorage.getItem('maplestar-last-calculator-view')||localStorage.getItem('maplestar-last-view');
   const stored=JSON.parse(localStorage.getItem(storage)||'null') as Data|null;
   if(saved==='monster'||stored?.characters?.some(c=>c.id===saved))return saved!;
  }catch{}
  return 'monster';
 });
 const [rename,setRename]=useState(false);
 const [newName,setNewName]=useState('');
 const [notice,setNotice]=useState('');
 useEffect(()=>{localStorage.setItem(storage,JSON.stringify(data))},[data]);
 useEffect(()=>{localStorage.setItem('maplestar-mileage-v2',JSON.stringify(mileage))},[mileage]);
 const current=data.characters.find(c=>c.id===tab);
 useEffect(()=>{try{localStorage.setItem('maplestar-last-view',tab)}catch{}},[tab]);
 useEffect(()=>{
  if(tab==='monster'||data.characters.some(c=>c.id===tab)){
   setLastCalculator(tab);
   try{localStorage.setItem('maplestar-last-calculator-view',tab)}catch{}
  }
 },[tab,data.characters]);
 useEffect(()=>{
  const key=tab==='monster'||tab==='ied'||tab==='mileage'?tab:tab+'|'+sub;
  const scrollKey='maplestar-view-scroll-'+key;
  let position=0;
  try{position=Number(localStorage.getItem(scrollKey)||0)||0}catch{}
  let frame2=0;
  const frame1=requestAnimationFrame(()=>{
   frame2=requestAnimationFrame(()=>{
    window.scrollTo({top:Math.max(0,position),behavior:'instant'});
    initialScroll.current=false;
   });
  });
  const saveScroll=()=>{if(initialScroll.current)return;try{localStorage.setItem(scrollKey,String(window.scrollY))}catch{}};
  window.addEventListener('scroll',saveScroll,{passive:true});
  return ()=>{window.removeEventListener('scroll',saveScroll);cancelAnimationFrame(frame1);cancelAnimationFrame(frame2)};
 },[tab,sub]);
 const updateCharacter=(c:Character)=>setData(d=>({...d,characters:d.characters.map(x=>x.id===c.id?c:x)}));
 const selectCharacter=(c:Character)=>{setTab(c.id);setLastCharacter(c.id);setSub(c.lastSubTab??'settings')};
 const openCalculator=()=>{
  if(tab==='ied'||tab==='mileage'){
   const target=lastCalculator==='monster'||data.characters.some(c=>c.id===lastCalculator)?lastCalculator:'monster';
   setTab(target);
   const character=data.characters.find(c=>c.id===target);
   if(character)setSub(character.lastSubTab??'settings');
  }
 };
 useEffect(()=>{try{if(lastCharacter)localStorage.setItem('maplestar-last-character',lastCharacter)}catch{}},[lastCharacter]);
 const selectSub=(next:CharacterSubTab)=>{setSub(next);if(current)setData(d=>({...d,characters:d.characters.map(x=>x.id===current.id?{...x,lastSubTab:next}:x)}))};
 const add=()=>{const id=`character-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;setData(d=>({...d,characters:[...d.characters,newCharacter(id)]}));setTab(id);setLastCharacter(id);setSub('settings')};
 const remove=()=>{
  if(!current||!window.confirm(`確定刪除「${current.name}」？此操作無法復原。`))return;
  const remaining=data.characters.filter(c=>c.id!==current.id);
  const replacement=remaining[0]??newCharacter(`character-${Date.now()}`);
  setData(d=>({...d,characters:remaining.length?remaining:[replacement]}));
  setTab(replacement.id);setLastCharacter(replacement.id);setSub(replacement.lastSubTab??'settings');
 };
 const exportCharacter=()=>{if(!current)return;const payload={format:'maplestar-character',version:1,character:current};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=(current.name.replace(/[^\w\u4e00-\u9fff-]/g,'_')||'欄位')+'.json';anchor.click();URL.revokeObjectURL(url)};
 const importCharacter=async(f?:File)=>{if(!f)return;try{const obj=JSON.parse(await f.text());const c=obj?.format==='maplestar-character'&&obj.version===1?obj.character:null;
 if(!c||typeof c!=='object'||typeof c.name!=='string'||!c.name.trim()||!Array.isArray(c.gear)||!Array.isArray(c.skills)||!Array.isArray(c.sets)||!c.extra||!c.consumables||!['str','dex','int','luk'].includes(c.mainStat)||!['str','dex','int','luk'].includes(c.subStat)||typeof c.weaponCoefficient!=='number')throw Error('格式不正確');
 const id='character-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
 const imported:Character={...c,id,name:c.name.trim().slice(0,10),skills:c.skills.map((s:Skill)=>s.name==='女神的祝福'?{...s,name:'女皇的祝福'}:s),sets:Array.from({length:3},(_,i)=>c.sets[i]??{attack:0,main:0,sub:0}),lockCheckDisabledSets:Array.from({length:3},(_,i)=>c.lockCheckDisabledSets?.[i]??true)};
 setData(d=>({...d,characters:[...d.characters,imported]}));setTab(id);setLastCharacter(id);setSub('settings');setNotice('已匯入角色欄位');
 }catch{setNotice('匯入失敗：請選擇「匯出json」產生的角色檔案')}};
 const resetCurrent=()=>{const label=tab==='monster'?'怪物圖鑑':tab==='ied'?'無視防禦計算':tab==='mileage'?'里程購買計算機':sub==='settings'?'角色設定':sub==='skills'?'技能設定':sub==='gear'?'裝備':sub==='subcheck'?'鎖潛檢查':'傷害計算';
 if(!window.confirm('確定將「'+label+'」還原至預設？只影響目前頁面的資料。'))return;
 if(tab==='monster'){setData(d=>({...d,monster:{...blankMonster}}));return}
 if(tab==='ied'){setData(d=>({...d,ied:Array(7).fill(0),oldIed:0,newIed:0}));return}
 if(tab==='mileage'){setMileage(s=>({...s,gross:0,mesos:1}));return}
 if(!current)return;const defaults=newCharacter(current.id,current.name);
 if(sub==='settings')updateCharacter({...current,mainStat:defaults.mainStat,subStat:defaults.subStat,mastery:defaults.mastery,weaponCoefficient:defaults.weaponCoefficient});
 if(sub==='skills')updateCharacter({...current,skills:defaults.skills});
 if(sub==='gear')updateCharacter({...current,gear:defaults.gear,sets:defaults.sets});
 if(sub==='subcheck')updateCharacter({...current,requirements:defaults.requirements,lockCheckExtraSub:defaults.lockCheckExtraSub,lockCheckDisabledSets:defaults.lockCheckDisabledSets});
 if(sub==='damage')updateCharacter({...current,baseMain:defaults.baseMain,baseSub:defaults.baseSub,mapleBlessing:defaults.mapleBlessing,consumables:defaults.consumables,extra:defaults.extra});
 };
 return <div className="app"><header className="top">
 <div className="top-primary"><div className="brand"><div className="brand-icon"><Calculator size={21}/></div><div><strong>楓星計算工具</strong><small>MapleStar Toolkit</small></div></div>
 <nav className="tabs" aria-label="主功能頁籤">
 <button className={tab!=='ied'&&tab!=='mileage'?'tab active':'tab'} onClick={openCalculator}><Calculator size={16}/>傷害計算機</button>
 <button className={tab==='ied'?'tab active':'tab'} onClick={()=>setTab('ied')}><Calculator size={16}/>無視防禦計算</button>
 <button className={tab==='mileage'?'tab active':'tab'} onClick={()=>setTab('mileage')}><Calculator size={16}/>里程購買計算機</button></nav></div>
 {tab!=='ied'&&tab!=='mileage'&&<><div className="top-secondary"><div className="character-nav">
 <nav className="tabs character-tabs" aria-label="角色欄位"><button className={tab==='monster'?'tab active':'tab'} onClick={()=>setTab('monster')}><BookOpen size={16}/>怪物圖鑑</button>{data.characters.map(c=><button key={c.id} className={tab===c.id?'tab active':'tab'} onClick={()=>selectCharacter(c)} title={c.name}>{c.name}</button>)}<button className="tab add-tab" onClick={add} aria-label="新增欄位"><Plus size={19}/></button></nav>
 <label className="tab import-tab"><Upload size={16}/>匯入json<input type="file" accept=".json,application/json" hidden onChange={e=>{void importCharacter(e.target.files?.[0]);e.target.value=''}}/></label>
 </div></div>
 {current&&<div className="top-tertiary"><div className="subtabs"><button className={sub==='settings'?'selected':''} onClick={()=>selectSub('settings')}>角色設定</button><button className={sub==='skills'?'selected':''} onClick={()=>selectSub('skills')}>技能設定</button><button className={sub==='gear'?'selected':''} onClick={()=>selectSub('gear')}>裝備</button><button className={sub==='damage'?'selected':''} onClick={()=>selectSub('damage')}>傷害計算</button><button className={sub==='subcheck'?'selected':''} onClick={()=>selectSub('subcheck')}>鎖潛檢查</button><span className="subtab-spacer"/><button onClick={exportCharacter}><Download size={15}/>匯出json</button><button onClick={()=>{setNewName(current.name);setRename(true)}}>重新命名 <ChevronRight size={15}/></button><button className="danger-tab" onClick={remove}><Trash2 size={15}/>刪除該欄位</button></div></div>}</>}
 </header>
 <main className="main">
 {tab==='monster'?<MonsterPage data={data} set={setData}/>:tab==='ied'?<IedPage data={data} set={setData}/>:tab==='mileage'?<MileagePage value={mileage} set={setMileage}/>:current?<>
 {sub==='settings'?<CharacterSettings c={current} update={updateCharacter}/>:sub==='skills'?<SkillSettings c={current} update={updateCharacter}/>:sub==='gear'?<EquipmentPage c={current} update={updateCharacter}/>:sub==='damage'?<DamagePage c={current} monster={data.monster} update={updateCharacter}/>:<SubStatPage c={current} monster={data.monster} update={updateCharacter}/>}</>:null}
 <footer><span>作者: Satoshi</span><button onClick={resetCurrent}><RotateCcw size={14}/>還原至預設</button></footer></main>
 {rename&&current&&<div className="modal-backdrop"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="rename-title" onClick={e=>e.stopPropagation()}><h2 id="rename-title">重新命名欄位</h2><p>名稱最多 10 個字。</p><input autoFocus maxLength={10} value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newName.trim()){updateCharacter({...current,name:newName.trim()});setRename(false)}}}/><div className="modal-actions"><button className="ghost" onClick={()=>setRename(false)}>取消</button><button className="solid" disabled={!newName.trim()} onClick={()=>{updateCharacter({...current,name:newName.trim()});setRename(false)}}>儲存名稱</button></div></div></div>}
 {notice&&<div className="toast" onClick={()=>setNotice('')}>{notice} ×</div>}</div>
}
export default App;
