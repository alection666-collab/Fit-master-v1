const CACHE='fit-master-v5-r5';
const FILES=[
  './','./index.html','./styles.css','./app.js','./manifest.webmanifest','./icon.svg',
  './assets/chest-supported-row.svg','./assets/leg-extension.svg','./assets/arm-machine.svg',
  './assets/anatomy/anatomy-front.svg','./assets/anatomy/anatomy-back.svg',
  './assets/machines/leg-extension.jpg','./assets/machines/seated-calf-raise.jpg','./assets/machines/chest-supported-row.jpg','./assets/machines/user-hip-combo.jpg','./assets/machines/user-butterfly.jpg'
];
const PHOTO_FILES=[
  'https://upload.wikimedia.org/wikipedia/commons/0/0a/Woman_using_a_seated_cable_row_machine_at_the_gym.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/2/2a/Diverging_Lat_Pulldown_Machine.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/3/36/LegExtensionMachineExercise.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/e/e7/SeatedCalfRaiseMachineExercise.JPG',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/Chest_Fly_Machine.jpg/960px-Chest_Fly_Machine.jpg',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f9/Girl_doing_chest_press_machine_exercise.jpg/1280px-Girl_doing_chest_press_machine_exercise.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/b/bd/Water_aerobics_in_a_swimmingpool_Gambia.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/f/f5/Aqua_Aerobics.JPG'
];
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(FILES);
  await Promise.all(PHOTO_FILES.map(url=>cache.add(url).catch(()=>null)));
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('fit-master-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  event.respondWith((async()=>{
    const cached=await caches.match(request);
    if(cached)return cached;
    try{
      const response=await fetch(request);
      if(response&&response.ok&&url.origin===self.location.origin){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}
      return response;
    }catch(error){
      if(request.mode==='navigate')return caches.match('./index.html');
      return new Response('',{status:504,statusText:'Offline resource unavailable'});
    }
  })());
});
