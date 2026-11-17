export type Stats = {str:number;dex:number;int:number;luk:number;all:number;allPct:number;attack:number;attackPct:number;damagePct:number;bossPct:number;ied:number};
export const blankMonster:Stats={str:0,dex:0,int:0,luk:0,all:0,allPct:0,attack:0,attackPct:0,damagePct:0,bossPct:0,ied:0};
export const monsterFields:[keyof Stats,string][]=[['str','力量'],['dex','敏捷'],['int','智力'],['luk','幸運'],['all','全屬性'],['allPct','全屬性(%)'],['attack','攻擊力'],['attackPct','攻擊力(%)'],['damagePct','總傷害(%)'],['bossPct','BOSS傷害(%)'],['ied','無視防禦(%)']];
export type Gear={id:string;name:string;group:string;attack:number;main:number;sub:number;potentialAttack:number;potentialMain:number;potentialSub:number;potentialAttackPct:number;potentialMainPct:number;potentialSubPct:number};
const groups:[string,string[]][]=[['武器類',['武器','副武／標誌','盾牌']],['防具類',['帽子','披風','手套','上衣（套服）','褲裙','鞋子']],['飾品類',['臉飾','眼飾','項鍊','腰帶','耳環','肩膀','戒指1','戒指2','戒指3','戒指4']],['其他類',['徽章','勳章','口袋道具','機械心臟','圖騰','寵物裝備1','寵物裝備2','寵物裝備3']]];
export const defaultGear=():Gear[]=>groups.flatMap(([group,names])=>names.map((name,i)=>({id:`${group}-${i}`,name,group,attack:0,main:0,sub:0,potentialAttack:0,potentialMain:0,potentialSub:0,potentialAttackPct:0,potentialMainPct:0,potentialSubPct:0})));
export type Skill={name:string;attack:number;main:number;sub:number;attackPct:number};
export const defaultSkills=():Skill[]=>[{name:'女神的祝福',attack:0,main:0,sub:0,attackPct:0},{name:'傳授',attack:0,main:0,sub:0,attackPct:0}];
export type Simple={attack:number;main:number;sub:number};
export const zeroSimple=():Simple=>({attack:0,main:0,sub:0});
export type Requirement={id:string;gearId:string;required:number};
export type Character={id:string;name:string;mainStat:'str'|'dex'|'int'|'luk';subStat:'str'|'dex'|'int'|'luk';baseMain:number;baseSub:number;mastery:number;weaponCoefficient:number;mapleBlessing:number;skills:Skill[];requirements?:Requirement[];consumables:Simple & {attack2:number};sets:Simple[];gear:Gear[];extra:{attack:number;main:number;sub:number;attackPct:number;mainPct:number;subPct:number}};
export const newCharacter=(id:string,name='欄位'):Character=>({id,name,mainStat:'str',subStat:'dex',baseMain:4,baseSub:4,mastery:20,weaponCoefficient:1.2,mapleBlessing:0,skills:defaultSkills(),requirements:[{id:'requirement-1',gearId:'',required:0}],consumables:{...zeroSimple(),attack2:0},sets:Array.from({length:5},zeroSimple),gear:defaultGear(),extra:{attack:0,main:0,sub:0,attackPct:0,mainPct:0,subPct:0}});
export type Data={version:1;monster:Stats;ied:number[];oldIed:number;newIed:number;characters:Character[]};
export const newData=():Data=>({version:1,monster:{...blankMonster},ied:Array(7).fill(0),oldIed:0,newIed:0,characters:[newCharacter('character-1')]});
export const percent=(n:number)=>Math.max(0,Math.min(100,n))/100;
export const combinedIed=(values:number[])=>100*(1-values.reduce((p,n)=>p*(1-percent(n)),1));
export const defenseDamage=(defense:number,ied:number)=>Math.max(0,100*(1-defense/100*(1-percent(ied))));
export const improvement=(oldDamage:number,newDamage:number)=>oldDamage<=0?null:(newDamage/oldDamage-1)*100;
const sum=(values:number[])=>values.reduce((a,b)=>a+(Number.isFinite(b)?b:0),0);
export function calculate(c:Character,monster:Stats){
 const g=c.gear; const sumGear=(key:keyof Gear,filter?:(x:Gear)=>boolean)=>sum(g.filter(filter??(()=>true)).map(x=>Number(x[key])||0));
 const basicAtk=sumGear('attack'); const basicMain=sumGear('main'); const basicSub=sumGear('sub');
 const potAtk=sumGear('potentialAttack',x=>x.group==='武器類');
 const potMain=sumGear('potentialMain'); const potSub=sumGear('potentialSub');
 const potAtkPct=sumGear('potentialAttackPct',x=>x.name==='武器'||x.name==='副武／標誌');
 const potMainPct=sumGear('potentialMainPct');const potSubPct=sumGear('potentialSubPct');
 const monsterMain=monster[c.mainStat]+monster.all,monsterSub=monster[c.subStat]+monster.all;
 const blessing=Math.floor((c.mapleBlessing+1)/2)/100;
 const fixedAttack=c.consumables.attack+c.consumables.attack2+monster.attack+sum(c.skills.map(s=>s.attack))+sum(c.sets.map(s=>s.attack))+basicAtk+potAtk;
 const fixedMain=Math.floor(c.baseMain*(1+blessing)+0.1)+c.consumables.main+monsterMain+sum(c.skills.map(s=>s.main))+sum(c.sets.map(s=>s.main))+basicMain+potMain;
 const fixedSub=Math.floor(c.baseSub*(1+blessing)+0.1)+c.consumables.sub+monsterSub+sum(c.skills.map(s=>s.sub))+sum(c.sets.map(s=>s.sub))+basicSub+potSub;
 const attackPct=monster.attackPct+sum(c.skills.map(s=>s.attackPct))+potAtkPct;
 const mainPct=monster.allPct+potMainPct,subPct=monster.allPct+potSubPct;
 const range=(a:number,m:number,s:number,ap:number,mp:number,sp:number)=>Math.floor(a*(1+ap/100)*(m*(1+mp/100)*4+s*(1+sp/100))*c.weaponCoefficient*.01);
 return {blessing:blessing*100,fixedAttack,fixedMain,fixedSub,attackPct,mainPct,subPct,finalAttack:Math.floor(fixedAttack*(1+attackPct/100)),finalMain:Math.floor(fixedMain*(1+mainPct/100)),finalSub:Math.floor(fixedSub*(1+subPct/100)),range:range(fixedAttack,fixedMain,fixedSub,attackPct,mainPct,subPct),afterRange:range(fixedAttack+c.extra.attack,fixedMain+c.extra.main,fixedSub+c.extra.sub,attackPct+c.extra.attackPct,mainPct+c.extra.mainPct,subPct+c.extra.subPct),afterAttack:Math.floor((fixedAttack+c.extra.attack)*(1+(attackPct+c.extra.attackPct)/100)),afterMain:Math.floor((fixedMain+c.extra.main)*(1+(mainPct+c.extra.mainPct)/100)),afterSub:Math.floor((fixedSub+c.extra.sub)*(1+(subPct+c.extra.subPct)/100))};
}

/**
 * Equip unrestricted items first, then constrained items in ascending required sub-stat order.
 * Only worn equipment contributes fixed or potential bonuses. Unworn equipment never contributes.
 * Global buffs, skills, and set bonuses are assumed already active, matching the damage sheet.
 */
export function checkSubRequirements(c:Character, monster:Stats){
 const numeric=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?v:0;
 const records=(c.requirements??[]).filter(r=>r.gearId&&Number.isFinite(r.required)&&r.required>0);
 const requiredByGear=new Map<string,number>();
 for(const r of records)requiredByGear.set(r.gearId,Math.max(requiredByGear.get(r.gearId)??0,r.required));
 const restrictions=[...requiredByGear].map(([gearId,required])=>({gear:c.gear.find(g=>g.id===gearId),required})).filter((x):x is {gear:Gear;required:number}=>!!x.gear).sort((a,b)=>a.required-b.required||a.gear.name.localeCompare(b.gear.name));
 const equipped=c.gear.filter(g=>!requiredByGear.has(g.id));
 const blessing=Math.floor((c.mapleBlessing+1)/2)/100;
 const base=Math.floor(c.baseSub*(1+blessing)+0.1)+numeric(c.consumables.sub)+numeric(monster[c.subStat])+numeric(monster.all)+sum(c.skills.map(s=>s.sub))+sum(c.sets.map(s=>s.sub));
 const total=()=>Math.floor((base+sum(equipped.map(g=>numeric(g.sub)+numeric(g.potentialSub))))*(1+(numeric(monster.allPct)+sum(equipped.map(g=>numeric(g.potentialSubPct))))/100));
 const failed:{gearId:string;name:string;required:number;available:number}[]=[];
 for(const {gear,required} of restrictions){
   const available=total();
   if(available>=required)equipped.push(gear);
   else failed.push({gearId:gear.id,name:gear.name,required,available});
 }
 return {failed,finalSub:total(),equippedCount:equipped.length};
}
