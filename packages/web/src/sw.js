// 这是您的自定义 Service Worker 文件

// 导入必要的 workbox 工具
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// 预缓存清单会被 InjectManifest 插件自动注入
// 注意: 下面这行是唯一应该包含预缓存清单的地方
precacheAndRoute(self.__WB_MANIFEST);

// 自定义缓存策略 - API 请求 (示例)
// 网络优先策略 - 优先尝试网络请求，失败时回退到缓存
registerRoute(
    ({ url }) => url.pathname.startsWith('/api/'),
    new NetworkFirst({
        cacheName: 'api-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 天
            }),
            new CacheableResponsePlugin({
                statuses: [0, 200], // 只缓存成功的响应
            }),
        ],
    })
);

// 图片资源缓存 (示例)
// 缓存优先策略 - 优先使用缓存，减少网络请求和加载时间
registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
        cacheName: 'image-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 天
            }),
        ],
    })
);

// 脚本和样式表 (CSS/JS) 缓存 (示例)
// 同步更新缓存策略 - 同时从缓存和网络获取资源，优先使用缓存，但会在后台更新缓存
registerRoute(
    ({ request }) =>
        request.destination === 'script' ||
        request.destination === 'style',
    new StaleWhileRevalidate({
        cacheName: 'static-resources',
    })
);

// Service Worker 安装事件
self.addEventListener('install', (event) => {
    self.skipWaiting(); // 跳过等待，直接激活新的 Service Worker
});

// Service Worker 激活事件
self.addEventListener('activate', (event) => {
    // 在激活时立即控制所有客户端
    event.waitUntil(clients.claim());
});

// 可选：处理离线页面
// const FALLBACK_HTML_URL = '/offline.html';
// const CACHE_NAME = 'offline-html';

// // 预缓存离线页面
// self.addEventListener('install', (event) => {
//     event.waitUntil(
//         caches.open(CACHE_NAME)
//             .then((cache) => cache.add(FALLBACK_HTML_URL))
//     );
// });

// // 当导航请求失败时提供离线页面
// registerRoute(
//     ({ request }) => request.mode === 'navigate',
//     async ({ event }) => {
//         try {
//             // 尝试使用网络优先策略
//             return await new NetworkFirst({
//                 cacheName: 'pages-cache',
//                 plugins: [
//                     new ExpirationPlugin({
//                         maxEntries: 25,
//                     }),
//                 ],
//             }).handle({ event });
//         } catch (error) {
//             // 当网络不可用时返回缓存的离线页面
//             return caches.match(FALLBACK_HTML_URL);
//         }
//     }
// );