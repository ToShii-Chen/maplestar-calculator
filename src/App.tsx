import {useEffect,useState} from 'react';
import {Plus,BookOpen,Calculator,Download,Upload,RotateCcw,ChevronRight,Trash2} from 'lucide-react';
import {blankMonster,calculate,combinedIed,defenseDamage,improvement,monsterFields,newCharacter,newData,type Character,type Data,type Gear,type Simple,type Skill} from './model';
const storage='maplestar-calculator-v1';
const num=(v:string)=>v===''?0:Number(v);
const fmt=(n:number,d=0)=>n.toLocaleString('zh-TW',{minimumFractionDigits:d,maximumFractionDigits:d});
function load():Data{try{const v=JSON.parse(localStorage.getItem(storage)||'null');if(v?.version===1&&Array.isArray(v.characters)&&v.characters.length)return v}catch{}return newData()}
function NumberInput({value,onChange,placeholder='0'}:{value:number;onChange:(v:number)=>void;placeholder?:string}){return <input type="number" inputMode="decimal" value={value===0?'':value} placeholder={placeholder} onChange={e=>onChange(num(e.target.value))}/>}
function Field({label,value,onChange,unit}:{label:string;value:number;onChange:(n:number)=>void;unit?:string}){return <label className="field"><span>{label}</span><div className="field-control"><NumberInput value={value} onChange={onChange}/>{unit&&<span className="unit">{unit}</span>}</div></label>}
function Section({title,description,children}:{title:string;description?:string;children:React.ReactNode}){return <section className="panel"><div className="panel-heading"><h2>{title}</h2>{description&&<p>{description}</p>}</div>{children}</section>}
const statOptions:[Character['mainStat'],string][]=[['str','力量'],['dex','敏捷'],['int','智力'],['luk','幸運']];
const simpleLabels:[keyof Simple,string][]=[['attack','攻擊力'],['main','主屬性'],['sub','副屬性']];
const gearKeys:[keyof Gear,string][]=[['attack','攻擊力'],['main','主屬性'],['sub','副屬性'],['potentialAttack','潛能攻擊力'],['potentialMain','潛能主屬性'],['potentialSub','潛能副屬性'],['potentialAttackPct','潛能攻擊力(%)'],['potentialMainPct','潛能主屬性(%)'],['potentialSubPct','潛能副屬性(%)']];
const weaponGroups:[string,[string,number][]][]=[
 ['冒險家－劍士',[['單手劍',1.2],['單手斧',1.2],['單手棍',1.2],['雙手劍',1.34],['雙手斧',1.34],['雙手棍',1.34],['槍',1.49],['矛',1.49]]],
 ['冒險家－法師',[['短杖',1.2],['長杖',1.2]]],
 ['冒險家－弓箭手',[['弓',1.3],['弩',1.35]]],
 ['冒險家－盜賊',[['短劍',1.3],['拳套',1.75]]],
 ['冒險家－海盜',[['指虎',1.7],['火槍',1.5]]],
 ['其他職業',[['重砲－加農砲',1.5],['影武者－短劍',1.3],['精靈遊俠－雙弩槍',1.3],['幻影俠盜－手杖',1.3]]]
];

function MonsterPage({data,set}:{data:Data;set:(d:Data)=>void}){
 const update=(k:keyof typeof blankMonster,v:number)=>set({...data,monster:{...data.monster,[k]:v}});
 const fields=(start:number,end:number)=>(monsterFields.slice(start,end).map(([k,label])=><Field key={k} label={label} value={data.monster[k]} unit={k.endsWith('Pct')||k==='ied'||k==='bossPct'||k==='damagePct'?'%':undefined} onChange={v=>update(k,v)}/>));
 return <><Section title="屬性加成"><div className="fields-grid four">{fields(0,4)}</div><div className="fields-grid two spaced">{fields(4,6)}</div></Section><Section title="攻擊與傷害加成"><div className="fields-grid two">{fields(6,8)}</div><div className="fields-grid three spaced">{fields(8,11)}</div></Section></>
}
function IedPage({data,set}:{data:Data;set:(d:Data)=>void}){
 const total=combinedIed(data.ied);
 return <><p className="intro">計算實際無視率及不同 BOSS 防禦下的增傷幅度。</p>
 <Section title="實際無視防禦計算" description="無視來源以乘法疊加，而非直接相加。"><div className="ied-grid">{data.ied.map((v,i)=><Field key={i} label="無視(%)" value={v} unit="%" onChange={n=>set({...data,ied:data.ied.map((x,j)=>i===j?n:x)})}/>)}</div><div className="result-strip"><span>總無視(%)</span><strong>{fmt(total,1)}%</strong></div></Section>
 <Section title="無視提升後增傷計算"><div className="fields-grid two"><Field label="原無視(%)" value={data.oldIed} unit="%" onChange={n=>set({...data,oldIed:n})}/><Field label="新無視(%)" value={data.newIed} unit="%" onChange={n=>set({...data,newIed:n})}/></div><div className="table-scroll"><table className="data-table"><thead><tr><th>BOSS防禦(%)</th><th>原傷害(%)</th><th>新傷害(%)</th><th>傷害提升(%)</th></tr></thead><tbody>{[40,50,55,60,70,100,180,200].map(def=>{const old=defenseDamage(def,data.oldIed),next=defenseDamage(def,data.newIed),inc=improvement(old,next);return <tr key={def}><td>{def}%</td><td>{fmt(old,1)}%</td><td>{fmt(next,1)}%</td><td className={inc===null?'':inc>0?'positive':inc<0?'negative':''}>{inc===null?'無法計算':`${inc>0?'+':''}${fmt(inc,1)}%`}</td></tr>})}</tbody></table></div></Section></>
}
function CharacterSettings({c,update}:{c:Character;update:(c:Character)=>void}){
 const patch=(p:Partial<Character>)=>update({...c,...p});
 return <><Section title="角色設定"><div className="fields-grid four"><label className="field"><span>主屬性種類</span><select value={c.mainStat} onChange={e=>patch({mainStat:e.target.value as Character['mainStat']})}>{statOptions.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label className="field"><span>副屬性種類</span><select value={c.subStat} onChange={e=>patch({subStat:e.target.value as Character['subStat']})}>{statOptions.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><Field label="武器熟練度(%)" value={c.mastery} unit="%" onChange={v=>patch({mastery:v})}/><Field label="武器係數" value={c.weaponCoefficient} onChange={v=>patch({weaponCoefficient:v})}/></div></Section>
 <Section title="武器係數參考"><div className="weapon-reference">{weaponGroups.map(([group,items])=><div key={group} className="weapon-group"><h3>{group}</h3>{items.map(([name,coefficient])=><div className="weapon-row" key={name}><span>{name}</span><strong>{coefficient.toFixed(2)}</strong></div>)}</div>)}</div><p className="hint">參考常見舊版楓之谷數值；楓星若有不同設定，請以上方可編輯的武器係數為準。</p></Section></>
}
function SkillSettings({c,update}:{c:Character;update:(c:Character)=>void}){
 const change=(i:number,k:keyof Skill,v:number|string)=>update({...c,skills:c.skills.map((s,j)=>i===j?{...s,[k]:v}:s)});
 const add=()=>update({...c,skills:[...c.skills,{name:'',attack:0,main:0,sub:0,attackPct:0}]});
 const remove=(i:number)=>update({...c,skills:c.skills.filter((_,j)=>j!==i)});
 return <Section title="技能加成"><div className="table-scroll"><table className="data-table editable"><thead><tr><th>技能</th><th>攻擊力</th><th>主屬性</th><th>副屬性</th><th>攻擊力(%)</th><th></th></tr></thead><tbody>{c.skills.map((s,i)=><tr key={i}><td><input className="name-input" value={s.name} aria-label={`技能${i+1}名稱`} placeholder="技能名稱" onChange={e=>change(i,'name',e.target.value)}/></td>{(['attack','main','sub','attackPct'] as const).map(k=><td key={k}><NumberInput value={s[k]} onChange={v=>change(i,k,v)}/></td>)}<td><button className="icon-button" title="移除此技能" aria-label="移除此技能" disabled={c.skills.length<=1} onClick={()=>remove(i)}><Trash2 size={16}/></button></td></tr>)}</tbody></table></div><button className="ghost add-row" onClick={add}><Plus size={16}/>新增技能</button></Section>
}

function DamagePage({c,monster,update}:{c:Character;monster:Data['monster'];update:(c:Character)=>void}){
 const calc=calculate(c,monster),patch=(p:Partial<Character>)=>update({...c,...p});
 const metric=(label:string,value:number,percent=false)=><div className="metric" key={label}><span>{label}</span><strong>{fmt(value,percent?1:0)}{percent?'%':''}</strong></div>;
 const boost=calc.range===0?null:(calc.afterRange/calc.range-1)*100;
 return <><Section title="基本設定"><div className="fields-grid two"><Field label="主屬性（能力配點）" value={c.baseMain} onChange={v=>patch({baseMain:v})}/><Field label="副屬性（能力配點）" value={c.baseSub} onChange={v=>patch({baseSub:v})}/></div><div className="fields-grid two spaced"><Field label="楓葉祝福等級" value={c.mapleBlessing} onChange={v=>patch({mapleBlessing:v})}/></div></Section>
 <Section title="額外效果"><div className="fields-grid three">{([['attack','攻擊力'],['main','主屬性'],['sub','副屬性']] as [keyof Simple,string][]).map(([k,label])=><Field key={k} label={label} value={c.consumables[k]} onChange={v=>patch({consumables:{...c.consumables,[k]:v}})}/>)}</div></Section>
 <Section title="目前數值總覽"><div className="metrics">{metric('攻擊力',calc.fixedAttack)}{metric('固定主屬性',calc.fixedMain)}{metric('副屬性',calc.fixedSub)}{metric('攻擊力(%)',calc.attackPct,true)}{metric('主屬性(%)',calc.mainPct,true)}{metric('副屬性(%)',calc.subPct,true)}</div><div className="metrics metric-separated">{metric('最終攻擊力',calc.finalAttack)}{metric('最終主屬性',calc.finalMain)}{metric('最終副屬性',calc.finalSub)}</div><div className="result-strip"><span>表攻上限</span><strong>{fmt(calc.range)}</strong></div></Section>
 <Section title="額外裝備提升試算"><div className="fields-grid three">{([['attack','攻擊力'],['main','主屬性'],['sub','副屬性'],['attackPct','攻擊力(%)'],['mainPct','主屬性(%)'],['subPct','副屬性(%)']] as [keyof Character['extra'],string][]).map(([k,label])=><Field key={k} label={label} value={c.extra[k]} unit={k.endsWith('Pct')?'%':undefined} onChange={v=>patch({extra:{...c.extra,[k]:v}})}/>)}</div><div className="metrics spaced">{metric('最終攻擊力',calc.afterAttack)}{metric('最終主屬性',calc.afterMain)}{metric('最終副屬性',calc.afterSub)}</div><div className="result-strip"><span>提升後表攻上限</span><strong>{fmt(calc.afterRange)}</strong></div><div className="result-strip"><span>表攻提升幅度(%)</span><strong className={boost!==null&&boost<0?'negative':'positive'}>{boost===null?'無法計算':`${boost>0?'+':''}${fmt(boost,1)}%`}</strong></div></Section></>
}
function EquipmentPage({c,update}:{c:Character;update:(c:Character)=>void}){
 const change=(id:string,k:keyof Gear,v:number)=>update({...c,gear:c.gear.map(g=>g.id===id?{...g,[k]:v}:g)});
 const changeSet=(i:number,k:keyof Simple,v:number)=>update({...c,sets:c.sets.map((s,j)=>i===j?{...s,[k]:v}:s)});
 const groups=['武器類','防具類','飾品類','其他類'];
 return <><p className="intro">如果無需計算是否能達成副屬性需求，則無需填入「需求副屬性」。</p>
 {groups.map(group=><Section key={group} title={group}><div className="table-scroll"><table className="data-table editable gear-table"><thead><tr><th>裝備</th><th>需求副屬性</th>{gearKeys.filter(([k])=>group==='武器類'||(k!=='potentialAttack'&&k!=='potentialAttackPct')).map(([k,label])=><th key={k}>{label}</th>)}</tr></thead><tbody>{c.gear.filter(g=>g.group===group).map(g=><tr key={g.id}><td className="sticky-name">{g.name}</td><td><NumberInput value={g.requiredSub??0} onChange={v=>change(g.id,'requiredSub',v)}/></td>{gearKeys.filter(([k])=>group==='武器類'||(k!=='potentialAttack'&&k!=='potentialAttackPct')).map(([k])=>{const enabled=k==='potentialAttackPct'?(g.name==='武器'||g.name==='副武／標誌'):true;return <td key={k}>{enabled?<NumberInput value={Number(g[k])||0} onChange={v=>change(g.id,k,v)}/>:<span className="na">—</span>}</td>})}</tr>)}</tbody></table></div></Section>)}
 <Section title="套裝效果"><div className="table-scroll"><table className="data-table editable"><thead><tr><th>項目</th>{c.sets.map((_,i)=><th key={i}>效果{i+1}</th>)}</tr></thead><tbody>{simpleLabels.map(([k,label])=><tr key={k}><td>{label}</td>{c.sets.map((s,i)=><td key={i}><NumberInput value={s[k]} onChange={v=>changeSet(i,k,v)}/></td>)}</tr>)}</tbody></table></div></Section></>
}
function App(){
 const [data,setData]=useState<Data>(load);
 const [tab,setTab]=useState('monster');
 const [sub,setSub]=useState<'settings'|'skills'|'gear'|'damage'>('settings');
 const [rename,setRename]=useState(false);
 const [newName,setNewName]=useState('');
 const [notice,setNotice]=useState('');
 useEffect(()=>{localStorage.setItem(storage,JSON.stringify(data))},[data]);
 const current=data.characters.find(c=>c.id===tab);
 const updateCharacter=(c:Character)=>setData(d=>({...d,characters:d.characters.map(x=>x.id===c.id?c:x)}));
 const add=()=>{const id=`character-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;setData(d=>({...d,characters:[...d.characters,newCharacter(id)]}));setTab(id);setSub('settings')};
 const remove=()=>{if(!current)return;if(!window.confirm(`確定刪除「${current.name}」？此操作無法復原。`))return;setData(d=>({...d,characters:d.characters.length<=1?[newCharacter(`character-${Date.now()}`)]:d.characters.filter(c=>c.id!==current.id)}));setTab('monster')};
 const exportData=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='楓星計算器備份.json';a.click();URL.revokeObjectURL(url)};
 const importData=async(f?:File)=>{if(!f)return;try{const obj=JSON.parse(await f.text());if(obj.version!==1||!Array.isArray(obj.characters)||!obj.characters.length||!obj.monster||!Array.isArray(obj.ied))throw Error();setData(obj);setTab('monster');setNotice('已匯入備份')}catch{setNotice('匯入失敗：備份格式不正確')}};
 return <div className="app"><header className="top"><div className="brand"><div className="brand-icon"><Calculator size={21}/></div><div><strong>楓星計算工具</strong><small>MapleStar Toolkit</small></div></div><div className="top-actions"><button className="ghost" onClick={exportData}><Download size={16}/>匯出備份</button><label className="ghost upload"><Upload size={16}/>匯入備份<input type="file" accept=".json,application/json" hidden onChange={e=>{void importData(e.target.files?.[0]);e.target.value=''}}/></label></div></header>
 <main className="main"><nav className="tabs" aria-label="主功能頁籤"><button className={tab==='monster'?'tab active':'tab'} onClick={()=>setTab('monster')}><BookOpen size={16}/>怪物圖鑑</button><button className={tab==='ied'?'tab active':'tab'} onClick={()=>setTab('ied')}><Calculator size={16}/>無視防禦計算</button>{data.characters.map(c=><button key={c.id} className={tab===c.id?'tab active':'tab'} onClick={()=>{setTab(c.id);setSub('settings')}} title={c.name}>{c.name}</button>)}<button className="tab add-tab" onClick={add} aria-label="新增欄位"><Plus size={19}/></button></nav>
 {tab==='monster'?<MonsterPage data={data} set={setData}/>:tab==='ied'?<IedPage data={data} set={setData}/>:current?<><div className="subtabs"><button className={sub==='settings'?'selected':''} onClick={()=>setSub('settings')}>角色設定</button><button className={sub==='skills'?'selected':''} onClick={()=>setSub('skills')}>技能設定</button><button className={sub==='gear'?'selected':''} onClick={()=>setSub('gear')}>裝備</button><button className={sub==='damage'?'selected':''} onClick={()=>setSub('damage')}>傷害計算</button><button onClick={()=>{setNewName(current.name);setRename(true)}}>重新命名 <ChevronRight size={15}/></button><button className="danger-tab" onClick={remove}><Trash2 size={15}/>刪除該欄位</button></div>
 {sub==='settings'?<CharacterSettings c={current} update={updateCharacter}/>:sub==='skills'?<SkillSettings c={current} update={updateCharacter}/>:sub==='gear'?<EquipmentPage c={current} update={updateCharacter}/>:<DamagePage c={current} monster={data.monster} update={updateCharacter}/>}</>:null}
 <footer><span>楓星計算工具 · 資料僅儲存在此瀏覽器</span><button onClick={()=>{if(window.confirm('確定清除全部欄位與全域資料？此動作無法復原。')){setData(newData());setTab('monster')}}}><RotateCcw size={14}/>重設全部</button></footer></main>
 {rename&&current&&<div className="modal-backdrop" onClick={()=>setRename(false)}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="rename-title" onClick={e=>e.stopPropagation()}><h2 id="rename-title">重新命名欄位</h2><p>名稱最多 15 個字。</p><input autoFocus maxLength={15} value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newName.trim()){updateCharacter({...current,name:newName.trim()});setRename(false)}}}/><div className="modal-actions"><button className="ghost" onClick={()=>setRename(false)}>取消</button><button className="solid" disabled={!newName.trim()} onClick={()=>{updateCharacter({...current,name:newName.trim()});setRename(false)}}>儲存名稱</button></div></div></div>}
 {notice&&<div className="toast" onClick={()=>setNotice('')}>{notice} ×</div>}</div>
}
export default App;
