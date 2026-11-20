export type MileageItem={name:string;price:number;quantity:number};
export type CustomMileageItem=MileageItem & {id:string};
export const mileageCatalog:{group:string;items:MileageItem[]}[]=[
 {group:'遊戲類',items:[
  {name:'護身符',price:250,quantity:1},{name:'原地復活術',price:340,quantity:1},{name:'天氣',price:350,quantity:1},{name:'瞬移石',price:200,quantity:1},
  {name:'白金神奇剪刀',price:7100,quantity:1},{name:'神奇剪刀',price:3900,quantity:1},
  {name:'一般喇叭x13',price:9900,quantity:13},{name:'道具喇叭x13',price:12000,quantity:13}]},
 {group:'寵物',items:[{name:'生命之水30日',price:3200,quantity:1},{name:'生命之水90日',price:8600,quantity:1},{name:'生命之水180日',price:16300,quantity:1},{name:'技能格子',price:5400,quantity:1},{name:'寵物裝備',price:2900,quantity:1}]},
 {group:'潛能',items:[{name:'罕見寶珠',price:800,quantity:1},{name:'罕見保底 (120顆)',price:96000,quantity:1},{name:'傳說寶珠',price:2150,quantity:1},{name:'傳說保底 (180顆)',price:387000,quantity:1},{name:'罕見附加寶珠',price:630,quantity:1},{name:'罕見附加保底 (120顆)',price:75600,quantity:1},{name:'傳說附加寶珠',price:1600,quantity:1},{name:'傳說附加保底 (180顆)',price:288000,quantity:1}]},
 {group:'美容美髮',items:[{name:'整形 + 美容',price:9600,quantity:1},{name:'外觀裝備(披風外)',price:11700,quantity:1},{name:'外觀披風',price:5900,quantity:1},{name:'外觀武器',price:3900,quantity:1},{name:'全套造型',price:31100,quantity:1}]},
 {group:'其他',items:[{name:'30天交易VIP',price:12900,quantity:1},{name:'90天交易VIP',price:34800,quantity:1},{name:'180天交易VIP',price:65700,quantity:1},{name:'欄位擴充卷',price:4800,quantity:1},{name:'腳色擴充卷',price:9900,quantity:1}]}
];
export function netMileage(gross:number){return Math.max(0,gross)*.99}
export function unitMesoPrice(item:MileageItem,gross:number,quantityMillions:number):number|null{
 const actual=netMileage(gross);
 if(actual<=0||quantityMillions<=0||item.quantity<=0)return null;
 return Math.round(item.price*quantityMillions*1000000/actual/item.quantity);
}
