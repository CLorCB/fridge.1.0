const CACHE_NAME = "my-fridge-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json"
];


/*
  第一次安装时
  保存应用需要的基础文件
*/

self.addEventListener("install", event => {

  event.waitUntil(

    caches
      .open(CACHE_NAME)
      .then(cache => {

        return cache.addAll(APP_FILES);

      })

  );

  self.skipWaiting();

});


/*
  新版本启用时
  清理旧缓存
*/

self.addEventListener("activate", event => {

  event.waitUntil(

    caches
      .keys()
      .then(cacheNames => {

        return Promise.all(

          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))

        );

      })

  );

  self.clients.claim();

});


/*
  打开网页文件时：

  有网络 → 优先拿最新版
  没网络 → 使用手机里的缓存
*/

self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") {
    return;
  }


  event.respondWith(

    fetch(event.request)

      .then(response => {

        const copy = response.clone();


        caches
          .open(CACHE_NAME)
          .then(cache => {

            cache.put(
              event.request,
              copy
            );

          });


        return response;

      })


      .catch(() => {

        return caches
          .match(event.request)
          .then(cachedResponse => {

            return (
              cachedResponse ||
              caches.match("./index.html")
            );

          });

      })

  );

});
