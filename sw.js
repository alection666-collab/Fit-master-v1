const CACHE='fit-master-v5-r2';
const FILES=[
  './','./index.html','./styles.css','./app.js','./manifest.webmanifest','./icon.svg',
  './assets/chest-supported-row.svg','./assets/leg-extension.svg','./assets/arm-machine.svg',
  './assets/anatomy/anatomy-front.svg','./assets/anatomy/anatomy-back.svg',
  './assets/machines/leg-extension.jpg','./assets/machines/seated-calf-raise.jpg','./assets/machines/chest-supported-row.jpg'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('fit-master-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  event.respondWith((async()=>{
    const cached=await caches.match(request);
    if(cached)return cached;
    try{
      const response=await fetch(request);
      if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}
      return response;
    }catch(error){
      if(request.mode==='navigate')return caches.match('./index.html');
      return new Response('',{status:504,statusText:'Offline resource unavailable'});
    }
  })());
});
