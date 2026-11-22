import {beginConclusion} from './conclusion.js?v=0.21.6';
export const endingSlides=[
 {title:'УМА ПОБЕДИЛА',art:'extra:1',text:'Инфошум распадается. Из осколков экрана выбирается Юрий Шмаков — бледный, но живой. Ума бросается к нему.'},
 {title:"ГОРОД ЗАТИХАЕТ",art:'finaleHistory:0',text:"По всему городу существа рассыпаются на бумажные обрывки и гаснущие искры. Красные глаза исчезают с экранов. Юрий свободен. Впервые за эту ночь становится тихо."},
 {title:"ОТКУДА ОНИ ВЗЯЛИСЬ",art:'finaleHistory:1',text:"«Но откуда они вообще взялись?» — Юрий смотрит на остывший экран. Ума настораживает уши. Среди обломков ещё мерцает след самого первого искажённого сообщения."},
 {title:"В ОЖИДАНИИ",art:'finaleHistory:2',text:"В нём едва шевелилась тёмная тень — зародыш Инфошума. Ещё слабый, почти незаметный. Сам по себе он не мог захватить город. Он ждал своего часа."},
 {title:"КОГДА ПЕРЕСТАЮТ ПРОВЕРЯТЬ",art:'finaleHistory:3',text:"Он ждал, когда перестанут спрашивать: «Кто это сообщил? Где подтверждение?» Когда поверят громкому заголовку, не открыв полную запись."},
 {title:"КОГДА ПЕРЕСЫЛАЮТ НЕ ДУМАЯ",art:'finaleHistory:4',text:"Когда сообщение начнут пересылать дальше, не разобравшись. «На всякий случай». «Раз все пишут». Каждая новая копия давала тени силу — и находила ей следующий экран."},
 {title:"КОГДА ПОБЕЖДАЮТ ЭМОЦИИ",art:'finaleHistory:5',text:"Когда страх и ярость заставят нажимать быстрее, чем появится мысль проверить. Инфошум раздувал тревогу, а люди передавали её друг другу. Так он рос."},
 {title:"КОГДА НЕ ХОТЯТ СЛУШАТЬ",art:'finaleHistory:6',text:"Ему нужен мир, в котором проверять факты считают лишним делом. В котором честный журналист ещё задаёт вопросы — а его уже не хотят слушать. Тогда громкое сообщение сможет заменить правду."},
 {title:"ОН МОЖЕТ ВЕРНУТЬСЯ",art:'finaleHistory:7',text:"Сегодня Ума его победила. Но это не значит, что он исчез навсегда. Если ложь снова примут без проверки и понесут дальше, у Инфошума появится новый шанс."},
 {title:'ВОЗВРАЩЕНИЕ ДОМОЙ',art:'ending:2',text:'Помехи стихают. Юрий садится за свой стол и впервые за долгое время слышит тишину. Ума узнаёт его голос без треска.'},
 {title:'ТЕПЕРЬ МЫ ВМЕСТЕ',art:'ending:3',text:'Юрий обнимает Уму. «Одному было не справиться, — шепчет он. — Хорошо, что я был не один». Ума тихо мурлычет.'}
];
export const projectPurpose='Проверка фактов — ответственность и авторов, и читателей. Чтобы информационный шум не возвращался, важно участие каждого из нас.';
export function scoreBreakdown(g){const values=[['Рыбки',g.fish,10],['Побеждённые враги',g.kills,50],['Боссы',g.bossesDefeated.size,1000]];return{items:values.map(([label,count,points])=>({label,count,points,total:count*points})),total:values.reduce((sum,[,count,points])=>sum+count*points,0)};}
export function beginFinale(g){if(g.ending||g.conclusion||g.mode==='won')return false;g.truthFound=true;g.bolts=[];g.portals=[];g.tether=null;g.player.attack=0;g.player.vx=0;g.player.vy=0;g.finalScore=scoreBreakdown(g);g.ending={index:0};g.dialogue=null;g.mode='ending';g.emit('victory');g.emit('endingSlide',{index:0});return true;}
export function advanceFinale(g,direction=1){if(g.mode!=='ending'||!g.ending)return false;if(direction<0){if(g.ending.index===0)return false;g.ending.index--;g.emit('endingSlide',{index:g.ending.index});return true;}if(g.ending.index<endingSlides.length-1){g.ending.index++;g.emit('endingSlide',{index:g.ending.index});return true;}return beginConclusion(g);}
