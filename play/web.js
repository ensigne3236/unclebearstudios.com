/* Browser integration for Fast Track '98 Version 2.20. Game rules remain in the supplied game. */
(() => {
  'use strict';
  const status = document.getElementById('webStatus');
  const say = text => { status.textContent = text; };
  const keys = ['fastTrack98_v212','fastTrack98_v211','fastTrack98_v20','fastTrack98_v19','fastTrack98_v18','fastTrack98_v17','fastTrack98_v16','fastTrack98_v15','fastTrack98_v14','fastTrack98_v13','fastTrack98_v09','fastTrack98_v08','fastTrack98_v07','fastTrack98_v06','fastTrack98_v05','fastTrack98_v04','fastTrack98_v03','fastTrack98_v02'];
  const currentKey = keys[0]; // Retain the game's schema key; public release name is Version 2.20.
  function validate(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('This is not a game save.');
    if (!CHARACTERS.some(c => c.id === value.characterId) || !Number.isInteger(value.week) || value.week < 1 || ![26,52,78].includes(value.maxWeeks) || value.week > value.maxWeeks + 1 || !['balanced','wealth','career','education'].includes(value.goal)) throw Error('This save has invalid character or campaign settings.');
    for (const key of ['cash','time','energy','happy','health','economy','previousEconomy']) if (!Number.isFinite(value[key])) throw Error('This save is missing game statistics.');
    if (!Array.isArray(value.inventory) || !Array.isArray(value.courses) || !Array.isArray(value.log) || !value.weekStats || !value.careerExp || !BUILDINGS.home || !['camper','apartment','house','penthouse','mansion'].includes(value.housing) || !DISTRICTS[value.currentDistrict]) throw Error('This save is missing game data.');
    let nodes=0;
    const walk=(x,depth=0)=>{
      if (++nodes > 150000 || depth > 40) throw Error('This save is too complex.');
      if(typeof x==='number'&&!Number.isFinite(x))throw Error('Invalid number in save.');
      if(x&&typeof x==='object')for(const key of Object.keys(x)){
        if(['__proto__','prototype','constructor'].includes(key))throw Error('Unsupported property in save.');
        walk(x[key],depth+1);
      }
    };walk(value);return value;
  }
  // Saves contain story prose rendered as HTML by the original game. Treat imported text as text.
  function safeText(value) {
    if(typeof value==='string')return value.replace(/&(?!(?:amp|lt|gt|quot|#39|#96);)|[<>"'`]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'}[c]));
    if(Array.isArray(value))return value.map(safeText);
    if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,safeText(v)]));
    return value;
  }
  function hydrate(value) {
    const previous=s, previousCharacter=selectedCharacter, previousView=view, previousBuilding=selectedBuilding;
    try {
      s=validate(value);
      migrateTransportState();migrateNewsState();migrateV06State();ensureV20();ensureFinanceRecoveryV21();ensureV212();
      selectedCharacter=s.characterId;view='map';selectedBuilding=null;
      preloadTravelAssets();preloadDistrictMenusV20();render();
      $('startScreen').classList.add('hidden');$('gameScreen').classList.remove('hidden');
    } catch(error) {
      s=previous;selectedCharacter=previousCharacter;view=previousView;selectedBuilding=previousBuilding;
      if(s)render();else{$('startScreen').classList.remove('hidden');$('gameScreen').classList.add('hidden');}
      throw error;
    }
  }
  saveGame = function() {
    if(!s)return;
    try {ensureV212();localStorage.setItem(currentKey,JSON.stringify(s));addLog('Game saved to this browser.','good');render();say('Game saved. Export a save file for a separate backup.');}
    catch(error){say('Browser save failed. Use Export Save to keep a backup.');}
  };
  loadGame = function() {
    try {
      const raw=keys.map(key=>localStorage.getItem(key)).find(Boolean);
      if(!raw){say('No saved game found in this browser. Start a game or import a save file.');return;}
      hydrate(JSON.parse(raw));say('Saved game loaded.');
    }catch(error){say('Could not load the saved game: '+error.message+' You can import a backup.');}
  };
  const baseHighScoreSave=saveHighScoreV211;
  highScoresV211=function(){
    try{const rows=JSON.parse(localStorage.getItem(V211_HIGH_SCORE_KEY)||'[]');return Array.isArray(rows)?rows.filter(row=>row&&Number.isFinite(row.score)&&CHARACTERS.some(c=>c.name===row.character)).slice(0,10):[];}
    catch{return [];}
  };
  saveHighScoreV211=function(){
    try{return baseHighScoreSave();}
    catch{const b=scoreBreakdownV211(),entry={...b,character:gameChar().name,weeks:s.maxWeeks};say('Campaign complete. Browser storage is unavailable, so this high score cannot be saved.');return {entry,rank:1,rows:[entry]};}
  };
  // Earlier scripts bound outdated function objects. Bind the final game implementations.
  $('startBtn').onclick=()=>{newGame();say('Game started. Use SAVE before leaving this page.');};
  $('saveBtn').onclick=()=>saveGame();
  $('loadStartBtn').onclick=()=>loadGame();
  $('endWeekBtn').onclick=()=>endWeek();
  $('exportSave').onclick=()=>{
    try {
      let state=s;
      if(!state){const raw=keys.map(key=>localStorage.getItem(key)).find(Boolean);if(raw)state=validate(JSON.parse(raw));}
      if(!state){say('Start or load a game before exporting a save.');return;}
      const blob=new Blob([JSON.stringify({game:'Fast Track 98',release:'2.20',format:1,savedAt:new Date().toISOString(),state},null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Fast-Track-98-v2.20-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);say('Save exported. Keep the JSON file to restore or transfer your game.');
    }catch(error){say('Could not export save: '+error.message);}
  };
  $('importSave').onclick=()=>$('saveFile').click();
  $('saveFile').onchange=async event=>{
    const file=event.target.files[0];event.target.value='';if(!file)return;
    try {
      if(file.size>8*1024*1024)throw Error('Save files must be smaller than 8 MB.');
      const parsed=JSON.parse(await file.text());
      if(parsed.game&& (parsed.game!=='Fast Track 98'||parsed.format!==1))throw Error('Unsupported save file format.');
      const next=safeText(validate(parsed.state||parsed));
      if(s&&!confirm('Replace the current game with this imported save? Export first if you need a backup.'))return;
      hydrate(next);say('Save imported. Use SAVE to keep it in this browser.');
    }catch(error){say('Could not import save: '+error.message);}
  };
  $('fullscreenGame').onclick=async()=>{
    try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
    catch{say('Full screen is unavailable here. Open the game directly in its own tab.');}
  };
  try {const probe='fastTrack98_storage_probe';localStorage.setItem(probe,'1');localStorage.removeItem(probe);}
  catch {say('Browser storage is unavailable. You can play, but use Export Save before leaving.');}
})();
