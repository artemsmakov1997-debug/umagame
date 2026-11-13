// Portrait phone layout («вариант Г»): the scene keeps one scale everywhere — about 450 world pixels across — and sits
// right under the HUD; the space below is a decorated panel that holds the stick and the action buttons, so nothing
// covers the floor or Uma. The scene height is reserved for the tallest HUD (boss bar) so the scale never jumps.
export const PANEL={worldWidth:450,bossHud:132,minPanel:200};
export function panelLayout(width,height,touch){
 if(!touch||width>700||height<=width)return null;
 const scene=Math.round(Math.min(width*480/PANEL.worldWidth,height-PANEL.bossHud-PANEL.minPanel));
 return {scene,world:Math.round(width*480/scene)};
}
// Landscape phones («вариант Б»): the scene fills the screen, compact brass controls sit in the bottom corners and the
// dialogue is a slim strip along the bottom (tap anywhere to go on).
export function isLandscapePhone(width,height,touch){return !!touch&&width>height&&height<=520;}
export function applyPanelLayout(app,touch){
 const layout=panelLayout(innerWidth,innerHeight,touch);
 if(!layout){const land=isLandscapePhone(innerWidth,innerHeight,touch);if(land){if(app.dataset.layout!=='landscape')app.dataset.layout='landscape';}else if(app.dataset.layout)delete app.dataset.layout;return null;}
 app.dataset.layout='panel';app.style.setProperty('--scene-h',layout.scene+'px');return layout;
}
