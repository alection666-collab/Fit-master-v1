const CACHE='fit-master-v06';
const FILES=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./icon.svg','./assets/chest-supported-row.svg','./assets/leg-extension.svg','./assets/arm-machine.svg'];
const PHOTO_HOSTS=['upload.wikimedia.org','thumb.wikimedia.org'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(PHOTO_HOSTS.includes(url.hostname)){
  event.respondWith(caches.open(CACHE).then(async cache=>{
   const cached=await cache.match(event.request);if(cached)return cached;
   try{const response=await fetch(event.request);if(response.ok||response.type==='opaque'){await cache.put(event.request,response.clone());}return response;}
   catch(error){return new Response('',{status:503,statusText:'Photo not cached yet'});}
  }));return;
 }
 if(url.origin!==self.location.origin)return;
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}return response;}).catch(()=>caches.match('./index.html'))));
});
