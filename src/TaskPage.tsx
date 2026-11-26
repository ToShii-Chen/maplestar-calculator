import {useState} from 'react';
import {Plus,Pencil,Trash2,RotateCcw,ArrowUp,ArrowDown} from 'lucide-react';
import {type TaskState,type TaskRole,type TaskItem,newTaskId,setTaskRoles,deleteTaskRole,changeTaskAssignments} from './tasks';

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
 const [modal,setModal]=useState<ModalMode|'sort-role'|'delete-roles'|'sort-task'|'delete-tasks'>(null);
 const [target,setTarget]=useState('');
 const [name,setName]=useState('');
 const [chosen,setChosen]=useState<string[]>([]);
 const [order,setOrder]=useState<string[]>([]);
 const column=value.columns.find(c=>c.id===selected);
 const roleList=value.roles;
 const allTasks=value.columns.flatMap(c=>c.tasks.map(t=>({id:t.id,name:t.name,column:c.name,roleIds:t.roleIds})));
 const close=()=>{setModal(null);setTarget('');setName('');setChosen([]);setOrder([])};
 const openNewRole=()=>{setTarget('');setName('');setChosen([]);setModal('new-role')};
 const openNewTask=()=>{setTarget('');setName('');setChosen([]);setModal('new-task')};
 const editRole=(id:string)=>{
  const role=roleList.find(r=>r.id===id);if(!role)return;
  setTarget(id);setName(role.name);setChosen(allTasks.filter(t=>t.roleIds.includes(id)).map(t=>t.id));setModal('edit-role');
 };
 const editTask=(id:string)=>{
  const task=column?.tasks.find(t=>t.id===id);if(!task)return;
  setTarget(id);setName(task.name);setChosen([...task.roleIds]);setModal('edit-task');
 };
 const toggle=(id:string,checked:boolean)=>setChosen(prev=>checked?[...new Set([...prev,id])]:prev.filter(x=>x!==id));
 const addRole=()=>{
  const trimmed=name.trim().slice(0,5);
  if(!trimmed||roleList.length>=12)return;
  const role:TaskRole={id:newTaskId('role'),name:trimmed};
  set(prev=>prev.roles.length>=12?prev:setTaskRoles({...prev,roles:[...prev.roles,role]},role.id,new Set(chosen)));
  close();
 };
 const saveRole=()=>{
  if(!target)return;
  set(prev=>setTaskRoles({...prev,roles:prev.roles.map(r=>r.id===target?{...r,name:name.trim().slice(0,5)||r.name}:r)},target,new Set(chosen)));
  close();
 };
 const addTask=()=>{
  const trimmed=name.trim().slice(0,7);
  if(!column||!trimmed)return;
  const task:TaskItem={id:newTaskId('task'),name:trimmed,roleIds:[...chosen],completedRoleIds:[]};
  set(prev=>({...prev,columns:prev.columns.map(c=>c.id===selected?{...c,tasks:[...c.tasks,task]}:c)}));close();
 };
 const saveTask=()=>{
  if(!target)return;
  set(prev=>({...prev,columns:prev.columns.map(c=>c.id===selected?{...c,tasks:c.tasks.map(t=>t.id===target?{...changeTaskAssignments(t,new Set(chosen)),name:name.trim().slice(0,7)||t.name}:t)}:c)}));close();
 };
 const openSort=(kind:'role'|'task')=>{
  setOrder(kind==='role'?roleList.map(r=>r.id):(column?.tasks??[]).map(t=>t.id));
  setModal(kind==='role'?'sort-role':'sort-task');
 };
 const move=(index:number,direction:-1|1)=>setOrder(current=>{
  const next=[...current],target=index+direction;
  if(target<0||target>=next.length)return current;
  [next[index],next[target]]=[next[target],next[index]];
  return next;
 });
 const saveSort=()=>{
  const positions=new Map(order.map((id,i)=>[id,i]));
  if(modal==='sort-role')set(prev=>({...prev,roles:[...prev.roles].sort((a,b)=>(positions.get(a.id)??999)-(positions.get(b.id)??999))}));
  if(modal==='sort-task')set(prev=>({...prev,columns:prev.columns.map(c=>c.id===selected?{...c,tasks:[...c.tasks].sort((a,b)=>(positions.get(a.id)??999)-(positions.get(b.id)??999))}:c)}));
  close();
 };
 const openDelete=(kind:'role'|'task')=>{setChosen([]);setModal(kind==='role'?'delete-roles':'delete-tasks')};
 const deleteSelected=()=>{
  if(!chosen.length)return;
  const removing=new Set(chosen);
  if(!window.confirm('確定刪除選取的'+chosen.length+'個'+(modal==='delete-roles'?'角色':'任務')+'？此操作無法復原。'))return;
  if(modal==='delete-roles')set(prev=>chosen.reduce((s,id)=>deleteTaskRole(s,id),prev));
  else if(modal==='delete-tasks')set(prev=>({...prev,columns:prev.columns.map(c=>c.id===selected?{...c,tasks:c.tasks.filter(t=>!removing.has(t.id))}:c)}));
  close();
 };
 const reset=()=>{
  if(!column)return;
  if(column.resetReminderEnabled!==false&&!window.confirm('確定重置「'+column.name+'」全部任務進度？'))return;
  set(prev=>({...prev,columns:prev.columns.map(c=>c.id===selected?{...c,lastReset:new Date().toISOString(),tasks:c.tasks.map(t=>({...t,completedRoleIds:[]}))}:c)}));
 };
 const toggleProgress=(taskId:string,roleId:string,checked:boolean)=>set(prev=>({...prev,columns:prev.columns.map(c=>c.id===selected?{...c,tasks:c.tasks.map(t=>t.id===taskId?{...t,completedRoleIds:checked?[...new Set([...t.completedRoleIds,roleId])]:t.completedRoleIds.filter(id=>id!==roleId)}:t)}:c)}));
 const checkboxList=(items:{id:string;label:string}[])=><div className="task-check-list">{items.length?items.map(item=><label key={item.id} className="task-assign-row"><input type="checkbox" checked={chosen.includes(item.id)} onChange={e=>toggle(item.id,e.target.checked)}/><span>{item.label}</span></label>):<p className="hint">目前尚無可選項目</p>}</div>;
 const title=modal==='new-role'?'新增角色':modal==='new-task'?'新增任務':
  modal==='pick-role'?'編輯角色':modal==='pick-task'?'編輯任務':
  modal==='edit-role'?'編輯角色: '+(roleList.find(r=>r.id===target)?.name??''):
  modal==='edit-task'?'編輯任務: '+(column?.tasks.find(t=>t.id===target)?.name??''):
  modal==='sort-role'?'調整角色順序':modal==='sort-task'?'調整任務順序':
  modal==='delete-roles'?'刪除角色':'刪除任務';
 const itemsForOrder=modal==='sort-role'?roleList:(column?.tasks??[]);
 const sortedItems=order.map(id=>itemsForOrder.find(x=>x.id===id)).filter((item):item is TaskRole|TaskItem=>!!item);
 const deleting=modal==='delete-roles'||modal==='delete-tasks';
 const sorting=modal==='sort-role'||modal==='sort-task';
 const picking=modal==='pick-role'||modal==='pick-task';
 const selectingRole=modal==='new-role'||modal==='edit-role';
 const selectingTask=modal==='new-task'||modal==='edit-task';
 const applicableItems=modal==='delete-roles'?roleList:(column?.tasks??[]);
 return <><div className="task-page">
 {selected==='roles'?<><p className="intro">新增、編輯或是刪除角色。上限12名。</p>
 <section className="panel"><div className="panel-title-row"><h2>現有角色</h2><div className="task-actions">
 <button className="ghost" disabled={roleList.length>=12} onClick={openNewRole}><Plus size={15}/>新增</button>
 <button className="ghost" disabled={!roleList.length} onClick={()=>setModal('pick-role')}><Pencil size={15}/>編輯</button>
 <button className="ghost" disabled={roleList.length<2} onClick={()=>openSort('role')}><ArrowUp size={15}/>調整順序</button>
 <button className="ghost task-danger" disabled={!roleList.length} onClick={()=>openDelete('role')}><Trash2 size={15}/>刪除角色</button>
 </div></div>
 <div className="task-roles-grid">{roleList.length?roleList.map(r=><div className="task-role-card" key={r.id}>{r.name}</div>):<p className="hint task-no-roles">尚未建立角色，可按「新增」建立。</p>}</div></section></>:
 column?<><p className="intro">管理多角色的任務。可新增、編輯或刪除任務。</p>
 <section className="panel"><div className="panel-title-row"><h2>現有任務</h2><div className="task-actions">
 <button className="ghost" onClick={openNewTask}><Plus size={15}/>新增</button>
 <button className="ghost" disabled={!column.tasks.length} onClick={()=>setModal('pick-task')}><Pencil size={15}/>編輯</button>
 <button className="ghost" disabled={column.tasks.length<2} onClick={()=>openSort('task')}><ArrowUp size={15}/>調整順序</button>
 <button className="ghost task-danger" disabled={!column.tasks.length} onClick={()=>openDelete('task')}><Trash2 size={15}/>刪除任務</button>
 </div></div>
 <div className="task-roles-grid task-items-grid">{column.tasks.length?column.tasks.map(t=><div className="task-role-card" key={t.id}>{t.name}</div>):<p className="hint task-no-roles">尚未新增任務，可按「新增」建立。</p>}</div></section>
 <section className="panel"><div className="panel-title-row"><h2>任務進度</h2><div className="task-reset-actions"><span>上次重置時間: {fmtDate(column.lastReset)}</span><label className="task-reset-reminder"><input type="checkbox" checked={column.resetReminderEnabled!==false} onChange={e=>set(prev=>({...prev,columns:prev.columns.map(c=>c.id===selected?{...c,resetReminderEnabled:e.target.checked}:c)}))}/><span>重置提醒</span></label><button className="ghost" onClick={reset}><RotateCcw size={15}/>重置進度</button></div></div>
 <div className="task-progress-groups">
 {Array.from({length:Math.max(1,Math.ceil(roleList.length/6))},(_,groupIndex)=>{
  const positions=Array.from({length:6},(_,slot)=>roleList[groupIndex*6+slot]??null);
  return <div className="table-scroll" key={groupIndex}><table className="data-table task-progress-table">
  <thead><tr><th>任務名稱</th>{positions.map((r,i)=><th key={r?.id??'empty-'+i}>{r?.name??''}</th>)}</tr></thead>
  <tbody>{column.tasks.map(t=><tr key={t.id}><td>{t.name}</td>{positions.map((r,i)=><td key={r?.id??'empty-'+i}>{r&&t.roleIds.includes(r.id)?<button className={t.completedRoleIds.includes(r.id)?'task-check-circle checked':'task-check-circle'} aria-label={r.name+' '+t.name} aria-pressed={t.completedRoleIds.includes(r.id)} onClick={()=>toggleProgress(t.id,r.id,!t.completedRoleIds.includes(r.id))}>{t.completedRoleIds.includes(r.id)?'✓':''}</button>:null}</td>)}</tr>)}
  {!column.tasks.length&&<tr><td colSpan={7} className="task-empty">尚未新增任務</td></tr>}</tbody></table></div>
 })}</div></section></>:<p className="intro">請從上方選擇任務欄位。</p>}
 </div>
 {modal&&<div className="modal-backdrop"><div className="modal task-modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
 <div className="task-editor-head"><h2 id="task-modal-title">{title}</h2></div>
 {picking?<><label className="field"><span>選擇現有的{modal==='pick-role'?'角色':'任務'}</span>
 <select value={target} onChange={e=>{setTarget(e.target.value);if(e.target.value)modal==='pick-role'?editRole(e.target.value):editTask(e.target.value)}}>
 <option value="">請選擇</option>{(modal==='pick-role'?roleList:column?.tasks??[]).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
 <div className="modal-actions"><button className="ghost" onClick={close}>取消</button></div></>:
 sorting?<><div className="task-sort-list">{sortedItems.map((item,index)=><div className="task-sort-row" key={item.id}>
 <span className="task-sort-index">{index+1}.</span><span className="task-sort-name">{item.name}</span>
 <button className="icon-button" aria-label={'將'+item.name+'往上移'} disabled={index===0} onClick={()=>move(index,-1)}><ArrowUp size={18}/></button>
 <button className="icon-button" aria-label={'將'+item.name+'往下移'} disabled={index===sortedItems.length-1} onClick={()=>move(index,1)}><ArrowDown size={18}/></button>
 </div>)}</div><div className="modal-actions"><button className="solid" onClick={saveSort}>確定</button><button className="ghost" onClick={close}>取消</button></div></>:
 deleting?<><p className="hint">可勾選多個{modal==='delete-roles'?'角色':'任務'}，確認後一次刪除。此操作無法復原。</p>
 {checkboxList(applicableItems.map(x=>({id:x.id,label:x.name})))}
 <div className="modal-actions"><button className="solid task-delete-submit" disabled={!chosen.length} onClick={deleteSelected}>刪除所選（{chosen.length}）</button><button className="ghost" onClick={close}>取消</button></div></>:
 <>
 {(modal==='new-role'||modal==='new-task')&&<label className="field"><span>{modal==='new-role'?'新增角色名稱 (最多5個字)':'新增任務名稱 (最多7個字)'}</span>
 <input autoFocus value={name} maxLength={modal==='new-role'?5:7} onChange={e=>setName(e.target.value)}/></label>}
 {selectingRole&&<><p className="task-check-label">適用任務:</p>{checkboxList(allTasks.map(t=>({id:t.id,label:t.column+' - '+t.name})))}</>}
 {selectingTask&&<><p className="task-check-label">適用角色:</p>{checkboxList(roleList.map(r=>({id:r.id,label:r.name})))}</>}
 <div className="modal-actions"><button className="solid" onClick={modal==='new-role'?addRole:modal==='edit-role'?saveRole:modal==='new-task'?addTask:saveTask}
 disabled={((modal==='new-role'||modal==='new-task')&&!name.trim())||(modal==='new-role'&&roleList.length>=12)}>
 {modal==='new-role'?'新增角色':modal==='new-task'?'新增任務':'確定'}</button>
 <button className="ghost" onClick={close}>取消</button></div>
 </>}
 </div></div>}
 </>;
}
