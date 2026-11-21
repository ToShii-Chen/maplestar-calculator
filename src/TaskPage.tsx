import {useEffect,useState} from 'react';
import {Plus,Pencil,Trash2,RotateCcw} from 'lucide-react';
import {type TaskState,type TaskRole,type TaskItem,type TaskColumn,newTaskId,setTaskRoles,deleteTaskRole,changeTaskAssignments} from './tasks';

type Props={value:TaskState;set:React.Dispatch<React.SetStateAction<TaskState>>;selected:string;select:(id:string)=>void};
type ModalMode='new-role'|'pick-role'|'edit-role'|'new-task'|'pick-task'|'edit-task'|null;
const fmtDate=(iso:string|null)=>{
 if(!iso)return '尚未重置';
 const d=new Date(iso);if(Number.isNaN(d.valueOf()))return '尚未重置';
 const two=(n:number)=>String(n).padStart(2,'0');
 return two(d.getMonth()+1)+'/'+two(d.getDate())+' '+two(d.getHours())+':'+two(d.getMinutes());
};
export function TaskNav({value,set,selected,select,add}:{value:TaskState;set:React.Dispatch<React.SetStateAction<TaskState>>;selected:string;select:(id:string)=>void;add:()=>void}){
 const [renameOpen,setRenameOpen]=useState(false);
 const [renameValue,setRenameValue]=useState('');
 const column=value.columns.find(c=>c.id===selected);
 const saveRename=()=>{
  const name=renameValue.trim().slice(0,10);
  if(!column||!name)return;
  set(prev=>({...prev,columns:prev.columns.map(c=>c.id===column.id?{...c,name}:c)}));
  setRenameOpen(false);
 };
 const removeColumn=()=>{
  if(!column||!window.confirm('確定刪除「'+column.name+'」及其中所有任務與進度？無法復原。'))return;
  const remaining=value.columns.filter(c=>c.id!==column.id);
  set(prev=>({...prev,columns:prev.columns.filter(c=>c.id!==column.id)}));
  select(remaining[0]?.id??'roles');
 };
 return <><nav className="tabs task-tabs" aria-label="任務管理子目錄">
 <button className={selected==='roles'?'tab active':'tab'} onClick={()=>select('roles')}>角色管理</button>
 {value.columns.map(c=><button key={c.id} className={selected===c.id?'tab active':'tab'} onClick={()=>select(c.id)}>{c.name}</button>)}
 <button className="tab add-tab" aria-label="新增任務欄位" onClick={add}><Plus size={18}/></button>
 </nav>
 {column&&<div className="task-nav-actions">
 <button type="button" onClick={()=>{setRenameValue(column.name);setRenameOpen(true)}}>重新命名</button>
 <button type="button" className="task-danger" onClick={removeColumn}><Trash2 size={15}/>刪除該欄位</button>
 </div>}
 {renameOpen&&column&&<div className="modal-backdrop"><div className="modal task-modal" role="dialog" aria-modal="true" aria-labelledby="task-rename-title">
 <h2 id="task-rename-title">重新命名欄位</h2><p>名稱最多 10 個字。</p>
 <input autoFocus maxLength={10} value={renameValue} onChange={e=>setRenameValue(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')saveRename()}}/>
 <div className="modal-actions"><button className="ghost" onClick={()=>setRenameOpen(false)}>取消</button><button className="solid" disabled={!renameValue.trim()} onClick={saveRename}>確定</button></div>
 </div></div>}
 </>;
}
export function TaskPage({value,set,selected,select}:Props){
 const [modal,setModal]=useState<ModalMode>(null);
 const [target,setTarget]=useState('');
 const [name,setName]=useState('');
 const [chosen,setChosen]=useState<string[]>([]);
 const column=value.columns.find(c=>c.id===selected);
 const allTasks=value.columns.flatMap(c=>c.tasks.map(t=>({id:t.id,name:t.name,column:c.name,roleIds:t.roleIds})));
 const close=()=>{setModal(null);setTarget('');setChosen([]);setName('')};
 const openNewRole=()=>{setTarget('');setName('');setChosen([]);setModal('new-role')};
 const openNewTask=()=>{setTarget('');setName('');setChosen([]);setModal('new-task')};
 const openRoleEditor=(id:string)=>{
  const role=value.roles.find(r=>r.id===id);if(!role)return;
  setTarget(id);setName(role.name);setChosen(allTasks.filter(t=>t.roleIds.includes(id)).map(t=>t.id));setModal('edit-role');
 };
 const openTaskEditor=(id:string)=>{
  const task=column?.tasks.find(t=>t.id===id);if(!task)return;
  setTarget(id);setName(task.name);setChosen([...task.roleIds]);setModal('edit-task');
 };
 const toggle=(id:string,checked:boolean)=>setChosen(old=>checked?[...new Set([...old,id])]:old.filter(x=>x!==id));
 const addRole=()=>{
  const trimmed=name.trim().slice(0,5);if(!trimmed)return;
  if(value.roles.length>=12)return;
  const role:TaskRole={id:newTaskId('role'),name:trimmed};
  set(prev=>prev.roles.length>=12?prev:setTaskRoles({...prev,roles:[...prev.roles,role]},role.id,new Set(chosen)));close();
 };
 const saveRole=()=>{
  if(!target)return;
  set(prev=>setTaskRoles({...prev,roles:prev.roles.map(r=>r.id===target?{...r,name:name.trim().slice(0,5)||r.name}:r)},target,new Set(chosen)));close();
 };
 const removeRole=()=>{if(!target||!window.confirm('確定刪除這個角色？所有任務的角色進度也會移除。'))return;set(prev=>deleteTaskRole(prev,target));close()};
 const addTask=()=>{
  const trimmed=name.trim().slice(0,7);if(!column||!trimmed)return;
  const task:TaskItem={id:newTaskId('task'),name:trimmed,roleIds:[...chosen],completedRoleIds:[]};
  set(prev=>({...prev,columns:prev.columns.map(c=>c.id===selected?{...c,tasks:[...c.tasks,task]}:c)}));close();
 };
 const saveTask=()=>{
  if(!target)return;
  set(prev=>({...prev,columns:prev.columns.map(c=>c.id===selected?{...c,tasks:c.tasks.map(t=>t.id===target?{...changeTaskAssignments(t,new Set(chosen)),name:name.trim().slice(0,7)||t.name}:t)}:c)}));close();
 };
 const removeTask=()=>{if(!target||!window.confirm('確定刪除這項任務？'))return;set(prev=>({...prev,columns:prev.columns.map(c=>c.id===selected?{...c,tasks:c.tasks.filter(t=>t.id!==target)}:c)}));close()};
 const reset=()=>{if(!column||!window.confirm('確定重置「'+column.name+'」全部任務進度？'))return;
  set(prev=>({...prev,columns:prev.columns.map(c=>c.id===selected?{...c,lastReset:new Date().toISOString(),tasks:c.tasks.map(t=>({...t,completedRoleIds:[]}))}:c)}));
 };
 const toggleProgress=(taskId:string,roleId:string,checked:boolean)=>set(prev=>({...prev,columns:prev.columns.map(c=>c.id===selected?{...c,tasks:c.tasks.map(t=>t.id===taskId?{...t,completedRoleIds:checked?[...new Set([...t.completedRoleIds,roleId])]:t.completedRoleIds.filter(id=>id!==roleId)}:t)}:c)}));
 const roleList=value.roles;
 const checkboxList=(items:{id:string;label:string}[])=><div className="task-check-list">{items.length?items.map(item=><label key={item.id} className="task-assign-row"><input type="checkbox" checked={chosen.includes(item.id)} onChange={e=>toggle(item.id,e.target.checked)}/><span>{item.label}</span></label>):<p className="hint">目前尚無可選項目</p>}</div>;
 const header=<div className="task-editor-head"><h2>{modal==='new-role'?'新增角色':modal==='new-task'?'新增任務':modal==='pick-role'?'編輯角色':modal==='pick-task'?'編輯任務':modal==='edit-role'?'編輯角色: '+(value.roles.find(r=>r.id===target)?.name??''):'編輯任務: '+(column?.tasks.find(t=>t.id===target)?.name??'')}</h2>
 {(modal==='edit-role'||modal==='edit-task')&&<button className="task-danger" onClick={modal==='edit-role'?removeRole:removeTask}><Trash2 size={15}/>{modal==='edit-role'?'刪除角色':'刪除任務'}</button>}</div>;
 return <><div className="task-page">
 {selected==='roles'?<><p className="intro">新增、編輯或是刪除角色。上限12名。</p>
 <section className="panel"><div className="panel-title-row"><h2>現有角色</h2><div className="task-actions">
 <button className="ghost" disabled={roleList.length>=12} onClick={openNewRole}><Plus size={15}/>新增</button>
 <button className="ghost" onClick={()=>{setTarget('');setModal('pick-role')}} disabled={!roleList.length}><Pencil size={15}/>編輯</button>
 </div></div>
 <div className="task-roles-grid">{roleList.length?roleList.map(r=><div className="task-role-card" key={r.id}>{r.name}</div>):<p className="hint task-no-roles">尚未建立角色，可按「新增」建立。</p>}</div></section></>:
 column?<><p className="intro">管理多角色的任務。可新增、編輯或刪除任務。</p>
 <section className="panel"><div className="panel-title-row"><h2>現有任務</h2><div className="task-actions">
 <button className="ghost" onClick={openNewTask}><Plus size={15}/>新增</button>
 <button className="ghost" disabled={!column.tasks.length} onClick={()=>{setTarget('');setModal('pick-task')}}><Pencil size={15}/>編輯</button>
 </div></div>
 <div className="task-roles-grid">{column.tasks.length?column.tasks.map(t=><div className="task-role-card" key={t.id}>{t.name}</div>):<p className="hint task-no-roles">尚未新增任務，可按「新增」建立。</p>}</div></section>
 <section className="panel"><div className="panel-title-row"><h2>任務進度</h2><div className="task-reset-actions"><span>上次重置時間: {fmtDate(column.lastReset)}</span><button className="ghost" onClick={reset}><RotateCcw size={15}/>重製進度</button></div></div>
 <div className="task-progress-groups">
 {Array.from({length:Math.max(1,Math.ceil(roleList.length/6))},(_,groupIndex)=>{
  const positions=Array.from({length:6},(_,slot)=>roleList[groupIndex*6+slot]??null);
  return <div className="table-scroll" key={groupIndex}><table className="data-table task-progress-table">
  <thead><tr><th>任務名稱</th>{positions.map((r,i)=><th key={r?.id??'empty-'+i}>{r?.name??''}</th>)}</tr></thead>
  <tbody>{column.tasks.map(t=><tr key={t.id}><td>{t.name}</td>{positions.map((r,i)=><td key={r?.id??'empty-'+i}>{r?(t.roleIds.includes(r.id)?<button className={t.completedRoleIds.includes(r.id)?'task-check-circle checked':'task-check-circle'} aria-label={r.name+' '+t.name} aria-pressed={t.completedRoleIds.includes(r.id)} onClick={()=>toggleProgress(t.id,r.id,!t.completedRoleIds.includes(r.id))}>{t.completedRoleIds.includes(r.id)?'✓':''}</button>:null):null}</td>)}</tr>)}
  {!column.tasks.length&&<tr><td colSpan={7} className="task-empty">尚未新增任務</td></tr>}</tbody></table></div>
 })}</div></section></>:<p className="intro">請從上方選擇任務欄位。</p>}
 </div>
 {modal&&<div className="modal-backdrop"><div className="modal task-modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">{header}
 {(modal==='pick-role'||modal==='pick-task')?<><label className="field"><span>選擇現有的{modal==='pick-role'?'角色':'任務'}</span><select value={target} onChange={e=>{setTarget(e.target.value);if(e.target.value)modal==='pick-role'?openRoleEditor(e.target.value):openTaskEditor(e.target.value)}}><option value="">請選擇</option>{(modal==='pick-role'?roleList:column?.tasks??[]).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div className="modal-actions"><button className="ghost" onClick={close}>取消</button></div></>:
 <>
 {(modal==='new-role'||modal==='new-task')&&<label className="field"><span>{modal==='new-role'?'新增角色名稱 (最多5個字)':'新增任務名稱 (最多7個字)'}</span><input autoFocus value={name} maxLength={modal==='new-role'?5:7} onChange={e=>setName(e.target.value)}/></label>}
 {(modal==='new-role'||modal==='edit-role')&&<><p className="task-check-label">適用任務:</p>{checkboxList(allTasks.map(t=>({id:t.id,label:t.column+' - '+t.name})))}</>}
 {(modal==='new-task'||modal==='edit-task')&&<><p className="task-check-label">適用角色:</p>{checkboxList(roleList.map(r=>({id:r.id,label:r.name})))}</>}
 <div className="modal-actions"><button className="ghost" onClick={close}>取消</button><button className="solid" onClick={modal==='new-role'?addRole:modal==='edit-role'?saveRole:modal==='new-task'?addTask:modal==='edit-task'?saveTask:saveTask} disabled={((modal==='new-role'||modal==='new-task')&&!name.trim())||(modal==='new-role'&&roleList.length>=12)}>{modal==='new-role'?'新增角色':modal==='new-task'?'新增任務':'確定'}</button></div>
 </>}</div></div>}
 </>;
}
