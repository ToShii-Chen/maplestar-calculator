export type Stats = {str:number;dex:number;int:number;luk:number;all:number;allPct:number;attack:number;attackPct:number;damagePct:number;bossPct:number;ied:number};
export const blankMonster:Stats={str:0,dex:0,int:0,luk:0,all:0,allPct:0,attack:0,attackPct:0,damagePct:0,bossPct:0,ied:0};
export const monsterFields:[keyof Stats,string][]=[['str','力量'],['dex','敏捷'],['int','智力'],['luk','幸運'],['all','全屬性'],['allPct','全屬性(%)'],['attack','攻擊力'],['attackPct','攻擊力(%)'],['damagePct','總傷害(%)'],['bossPct','BOSS傷害(%)'],['ied','無視防禦(%)']];
export type SetId='none'|'von'|'empress'|'sengoku';
export type Gear={id:string;name:string;group:string;setId?:SetId;attack:number;main:number;sub:number;potentialAttack:number;potentialMain:number;potentialSub:number;potentialAttackPct:number;potentialMainPct:number;potentialSubPct:number};
const groups:[string,string[]][]=[['武器類',['武器','副武／標誌','盾牌']],['防具類',['帽子','披風','手套','上衣（套服）','褲裙','鞋子']],['飾品類',['臉飾','眼飾','項鍊','腰帶','耳環','肩膀','戒指1','戒指2','戒指3','戒指4']],['其他類',['徽章','勳章','口袋道具','機械心臟','圖騰','寵物裝備1','寵物裝備2','寵物裝備3']]];
export const defaultGear=():Gear[]=>groups.flatMap(([group,names])=>names.map((name,i)=>({id:`${group}-${i}`,name,group,setId:'none',attack:0,main:0,sub:0,potentialAttack:0,potentialMain:0,potentialSub:0,potentialAttackPct:0,potentialMainPct:0,potentialSubPct:0})));

export type SetBonus={required:number;attack:number;all:number};
export const setDefinitions:{id:Exclude<SetId,'none'>;name:string;pieces:string[];bonuses:SetBonus[]}[]=[
 {id:'von',name:'凡雷恩',pieces:['武器','帽子','上衣（套服）','手套','披風','鞋子'],bonuses:[{required:4,attack:0,all:4},{required:5,attack:10,all:6},{required:6,attack:0,all:14}]},
 {id:'empress',name:'女皇',pieces:['武器','帽子','上衣（套服）','手套','披風','鞋子'],bonuses:[{required:4,attack:15,all:0},{required:5,attack:0,all:20},{required:6,attack:30,all:0}]},
 {id:'sengoku',name:'戰國',pieces:['武器','帽子','上衣（套服）','手套','披風','鞋子','肩膀','腰帶'],bonuses:[{required:2,attack:0,all:10},{required:6,attack:20,all:0},{required:7,attack:0,all:30},{required:8,attack:40,all:0}]}
];
export const setOptions=(gear:Gear):SetId[]=>['none',...setDefinitions.filter(d=>d.pieces.includes(gear.name)).map(d=>d.id)];
export const setName=(id:SetId|undefined)=>id==='none'||!id?'-':setDefinitions.find(d=>d.id===id)?.name??'-';
export function activeSetBonuses(equipped:Gear[]){
 return setDefinitions.map(set=>{
  const count=equipped.filter(g=>g.setId===set.id&&set.pieces.includes(g.name)).length;
  const levels=set.bonuses.map(b=>({...b,active:count>=b.required}));
  return {id:set.id,name:set.name,count,max:set.pieces.length,levels,attack:sum(levels.filter(b=>b.active).map(b=>b.attack)),all:sum(levels.filter(b=>b.active).map(b=>b.all))};
 });
}
export type Skill={name:string;attack:number;main:number;sub:number;attackPct:number};
export const defaultSkills=():Skill[]=>[{name:'女皇的祝福',attack:0,main:0,sub:0,attackPct:0},{name:'傳授',attack:0,main:0,sub:0,attackPct:0}];
export type Simple={attack:number;main:number;sub:number};
export const zeroSimple=():Simple=>({attack:0,main:0,sub:0});
export type Requirement={id:string;gearId:string;required:number};
export type CharacterSubTab='settings'|'skills'|'gear'|'damage'|'subcheck';
export type Character={id:string;name:string;simulatedGear?:Gear[];lastSubTab?:CharacterSubTab;mainStat:'str'|'dex'|'int'|'luk';subStat:'str'|'dex'|'int'|'luk';baseMain:number;baseSub:number;mastery:number;weaponCoefficient:number;mapleBlessing:number;skills:Skill[];requirements?:Requirement[];lockCheckExtraSub?:number;lockCheckDisabledSets?:boolean[];consumables:Simple & {attack2:number};sets:Simple[];gear:Gear[];extra:{attack:number;main:number;sub:number;attackPct:number;mainPct:number;subPct:number}};
export const newCharacter=(id:string,name='欄位'):Character=>({id,name,lastSubTab:'settings',mainStat:'str',subStat:'dex',baseMain:4,baseSub:4,mastery:20,weaponCoefficient:1.2,mapleBlessing:0,skills:defaultSkills(),requirements:[{id:'requirement-1',gearId:'',required:0}],lockCheckExtraSub:0,lockCheckDisabledSets:[true,true,true],consumables:{...zeroSimple(),attack2:0},sets:Array.from({length:3},zeroSimple),gear:defaultGear(),extra:{attack:0,main:0,sub:0,attackPct:0,mainPct:0,subPct:0}});
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
 const auto=activeSetBonuses(g);const autoAttack=sum(auto.map(x=>x.attack)),autoAll=sum(auto.map(x=>x.all));
 const monsterMain=monster[c.mainStat]+monster.all,monsterSub=monster[c.subStat]+monster.all;
 const blessing=Math.floor((c.mapleBlessing+1)/2)/100;
 const fixedAttack=c.consumables.attack+c.consumables.attack2+monster.attack+sum(c.skills.map(s=>s.attack))+sum(c.sets.slice(0,3).map(s=>s.attack))+autoAttack+basicAtk+potAtk;
 const fixedMain=Math.floor(c.baseMain*(1+blessing)+0.1)+c.consumables.main+monsterMain+sum(c.skills.map(s=>s.main))+sum(c.sets.slice(0,3).map(s=>s.main))+autoAll+basicMain+potMain;
 const fixedSub=Math.floor(c.baseSub*(1+blessing)+0.1)+c.consumables.sub+monsterSub+sum(c.skills.map(s=>s.sub))+sum(c.sets.slice(0,3).map(s=>s.sub))+autoAll+basicSub+potSub;
 const attackPct=monster.attackPct+sum(c.skills.map(s=>s.attackPct))+potAtkPct;
 const mainPct=monster.allPct+potMainPct,subPct=monster.allPct+potSubPct;
 const range=(a:number,m:number,s:number,ap:number,mp:number,sp:number)=>Math.floor(a*(1+ap/100)*(m*(1+mp/100)*4+s*(1+sp/100))*c.weaponCoefficient*.01);
 return {blessing:blessing*100,fixedAttack,fixedMain,fixedSub,attackPct,mainPct,subPct,finalAttack:Math.floor(fixedAttack*(1+attackPct/100)),finalMain:Math.floor(fixedMain*(1+mainPct/100)),finalSub:Math.floor(fixedSub*(1+subPct/100)),range:range(fixedAttack,fixedMain,fixedSub,attackPct,mainPct,subPct),afterRange:range(fixedAttack+c.extra.attack,fixedMain+c.extra.main,fixedSub+c.extra.sub,attackPct+c.extra.attackPct,mainPct+c.extra.mainPct,subPct+c.extra.subPct),afterAttack:Math.floor((fixedAttack+c.extra.attack)*(1+(attackPct+c.extra.attackPct)/100)),afterMain:Math.floor((fixedMain+c.extra.main)*(1+(mainPct+c.extra.mainPct)/100)),afterSub:Math.floor((fixedSub+c.extra.sub)*(1+(subPct+c.extra.subPct)/100))};
}


/** Equipment bonuses are recalculated after every successful equip; equipment potentials never apply. */
export function checkSubRequirements(c:Character,monster:Stats){
 const n=(x:unknown)=>typeof x==='number'&&Number.isFinite(x)?x:0;
 const requiredByGear=new Map<string,number>();
 for(const r of c.requirements??[]){if(r.gearId&&n(r.required)>0)requiredByGear.set(r.gearId,Math.max(requiredByGear.get(r.gearId)??0,r.required));}
 const candidates=c.gear.filter(g=>requiredByGear.has(g.id)).sort((a,b)=>(requiredByGear.get(a.id)??0)-(requiredByGear.get(b.id)??0)||a.name.localeCompare(b.name));
 const equipped=c.gear.filter(g=>!requiredByGear.has(g.id));
 const blessing=Math.floor((c.mapleBlessing+1)/2)/100;
 const base=Math.floor(n(c.baseSub)*(1+blessing)+.1)+n(c.consumables.sub)+n(monster[c.subStat])+n(monster.all)+sum(c.skills.map(x=>n(x.sub)))+sum(c.sets.slice(0,3).filter((_,i)=>!c.lockCheckDisabledSets?.[i]).map(x=>n(x.sub)))+n(c.lockCheckExtraSub);
 const total=()=>Math.floor((base+sum(equipped.map(g=>n(g.sub)))+sum(activeSetBonuses(equipped).map(x=>x.all)))*(1+n(monster.allPct)/100));
 const failed:{gearId:string;name:string;required:number;available:number}[]=[];
 for(const gear of candidates){const required=requiredByGear.get(gear.id)??0;const available=total();if(available>=required)equipped.push(gear);else failed.push({gearId:gear.id,name:gear.name,required,available});}
 return {failed,finalSub:total(),equippedCount:equipped.length,activeSets:activeSetBonuses(equipped)};
}

export type GearChanges={
 original:ReturnType<typeof calculate>;
 changed:ReturnType<typeof calculate>;
 oldSets:ReturnType<typeof activeSetBonuses>;
 newSets:ReturnType<typeof activeSetBonuses>;
 gear:Gear[];
 fixed:{attack:number;main:number;sub:number};
 potential:{attack:number;main:number;sub:number;attackPct:number;mainPct:number;subPct:number};
};
/** The simulation replaces only selected slots and never changes the real equipment. */
export function simulateEquipment(c:Character,monster:Stats):GearChanges{
 const byId=new Map((c.simulatedGear??[]).map(g=>[g.id,g]));
 const gear=c.gear.map(g=>byId.get(g.id)??g);
 const original=calculate(c,monster);
 const changed=calculate({...c,gear,extra:{attack:0,main:0,sub:0,attackPct:0,mainPct:0,subPct:0}},monster);
 const oldSets=activeSetBonuses(c.gear),newSets=activeSetBonuses(gear);
 const delta=(key:keyof Gear)=>sum(gear.map(g=>Number(g[key])||0))-sum(c.gear.map(g=>Number(g[key])||0));
 // A weapon-only attack potential and weapon/main-offhand attack-% rules match calculate().
 const potentialAttack=(arr:Gear[])=>sum(arr.filter(g=>g.group==='武器類').map(g=>g.potentialAttack));
 const potentialAttackPct=(arr:Gear[])=>sum(arr.filter(g=>g.name==='武器'||g.name==='副武／標誌').map(g=>g.potentialAttackPct));
 const setDeltaAttack=sum(newSets.map(x=>x.attack))-sum(oldSets.map(x=>x.attack));
 const setDeltaAll=sum(newSets.map(x=>x.all))-sum(oldSets.map(x=>x.all));
 return {
  original,changed,oldSets,newSets,gear,
  fixed:{attack:delta('attack')+setDeltaAttack,main:delta('main')+setDeltaAll,sub:delta('sub')+setDeltaAll},
  potential:{attack:potentialAttack(gear)-potentialAttack(c.gear),
   main:delta('potentialMain'),sub:delta('potentialSub'),
   attackPct:potentialAttackPct(gear)-potentialAttackPct(c.gear),
   mainPct:delta('potentialMainPct'),subPct:delta('potentialSubPct')}
 };
}
