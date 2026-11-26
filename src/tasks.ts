export type TaskRole={id:string;name:string};
export type TaskItem={id:string;name:string;roleIds:string[];completedRoleIds:string[]};
export type TaskColumn={id:string;name:string;tasks:TaskItem[];lastReset:string|null};
export type TaskState={roles:TaskRole[];columns:TaskColumn[];resetReminderEnabled:boolean};
export const taskDefaults=():TaskState=>({roles:[],resetReminderEnabled:true,columns:[{id:'weekly',name:'每週任務',tasks:[],lastReset:null},{id:'daily',name:'每日任務',tasks:[],lastReset:null}]});
export const newTaskId=(prefix:string)=>prefix+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,9);
export const addTaskColumn=(s:TaskState):TaskState=>({...s,columns:[...s.columns,{id:newTaskId('column'),name:'新欄位',tasks:[],lastReset:null}]});
export const cleanTaskState=(raw:unknown):TaskState=>{
 if(!raw||typeof raw!=='object')return taskDefaults();
 const v=raw as Partial<TaskState>;
 if(!Array.isArray(v.roles)||!Array.isArray(v.columns))return taskDefaults();
 const roles=v.roles.filter(r=>r&&typeof r.id==='string'&&typeof r.name==='string').map(r=>({id:r.id,name:r.name.slice(0,5)}));
 const valid=new Set(roles.map(r=>r.id));
 const columns=v.columns.filter(c=>c&&typeof c.id==='string'&&typeof c.name==='string'&&Array.isArray(c.tasks)).map(c=>({
  id:c.id,name:c.name.slice(0,10),lastReset:typeof c.lastReset==='string'?c.lastReset:null,
  tasks:c.tasks.filter(t=>t&&typeof t.id==='string'&&typeof t.name==='string').map(t=>({
   id:t.id,name:t.name.slice(0,7),
   roleIds:Array.isArray(t.roleIds)?[...new Set(t.roleIds.filter(id=>valid.has(id)))]:[],
   completedRoleIds:Array.isArray(t.completedRoleIds)?[...new Set(t.completedRoleIds.filter(id=>valid.has(id)))]:[]
  }))
 }));
 return {roles,columns,resetReminderEnabled:v.resetReminderEnabled!==false};
};
export const setTaskRoles=(s:TaskState,roleId:string,selectedTaskIds:Set<string>):TaskState=>({
 ...s,columns:s.columns.map(c=>({...c,tasks:c.tasks.map(t=>({
  ...t,
  roleIds:selectedTaskIds.has(t.id)?[...new Set([...t.roleIds,roleId])]:t.roleIds.filter(id=>id!==roleId),
  completedRoleIds:selectedTaskIds.has(t.id)?t.completedRoleIds:t.completedRoleIds.filter(id=>id!==roleId)
 }))}))
});
export const deleteTaskRole=(s:TaskState,id:string):TaskState=>({
 ...s,
 roles:s.roles.filter(r=>r.id!==id),
 columns:s.columns.map(c=>({...c,tasks:c.tasks.map(t=>({...t,roleIds:t.roleIds.filter(x=>x!==id),completedRoleIds:t.completedRoleIds.filter(x=>x!==id)}))}))
});
export const changeTaskAssignments=(t:TaskItem,selected:Set<string>):TaskItem=>({
 ...t,roleIds:[...selected],completedRoleIds:t.completedRoleIds.filter(id=>selected.has(id))
});
