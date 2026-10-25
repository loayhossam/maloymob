/* Maloy OS service worker: أوفلاين + تحديث يدوي للتطبيق + إشعارات */
const V='maloy-os-v2',IMG='maloy-img-v1',OV='maloy-override-v1';
const SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!==IMG&&k!==OV).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const netFirst=r=>fetch(r).then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res})
  .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('./index.html')));
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin===location.origin){
    if(/\/(index\.html)?$/.test(u.pathname)){
      // لو رفعت نسخة جديدة من جوه التطبيق بتتقدّم على الملف اللي على الجهاز. افتح index.html?stock=1 للرجوع للأصلية
      e.respondWith((async()=>{
        const oc=await caches.open(OV),key=new URL('./index.html',self.registration.scope).href;
        if(u.searchParams.has('stock'))await oc.delete(key);
        else{const m=await oc.match(key);if(m)return m}
        return netFirst(r);
      })());return;
    }
    e.respondWith(netFirst(r));return;
  }
  if(r.destination==='image'){
    e.respondWith(caches.open(IMG).then(c=>c.match(r).then(m=>{
      const net=fetch(r).then(res=>{c.put(r,res.clone());c.keys().then(ks=>{if(ks.length>120)c.delete(ks[0])});return res}).catch(()=>m);
      return m||net})));
  }
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{
    const c=cs.find(x=>x.url.startsWith(self.registration.scope));
    return c?c.focus():clients.openWindow(self.registration.scope+'index.html');
  }));
});
