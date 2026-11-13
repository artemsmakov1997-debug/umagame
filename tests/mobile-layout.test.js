import test from 'node:test';
import assert from 'node:assert/strict';
import {panelLayout,PANEL} from '../mobile-layout.js';
test('phone portrait panel: one scene scale everywhere, room left for the controls, nothing on desktop or landscape',()=>{
 assert.equal(panelLayout(1280,800,true),null);assert.equal(panelLayout(390,780,false),null);assert.equal(panelLayout(780,390,true),null);
 const tall=panelLayout(390,844,true);assert.equal(tall.world,PANEL.worldWidth);assert.ok(844-PANEL.bossHud-tall.scene>=PANEL.minPanel);
 const se=panelLayout(375,667,true);assert.ok(667-PANEL.bossHud-se.scene>=PANEL.minPanel-1);assert.ok(se.world>PANEL.worldWidth&&se.world<600,'a short phone sees a little more instead of losing the panel');
});
test('landscape phones get their own layout; tablets and desktops do not',async()=>{
 const {isLandscapePhone}=await import('../mobile-layout.js');
 assert.equal(isLandscapePhone(844,390,true),true);assert.equal(isLandscapePhone(390,844,true),false);assert.equal(isLandscapePhone(1280,800,true),false);assert.equal(isLandscapePhone(844,390,false),false);
});
