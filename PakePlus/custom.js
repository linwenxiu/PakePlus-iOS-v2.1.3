window.addEventListener("DOMContentLoaded",()=>{const t=document.createElement("script");t.src="https://www.googletagmanager.com/gtag/js?id=G-W5GKHM0893",t.async=!0,document.head.appendChild(t);const n=document.createElement("script");n.textContent="window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-W5GKHM0893');",document.body.appendChild(n)});// 全局配置：目标域名、页面路径及对应CSS映射（保留原链接，优化加载逻辑）
const TARGET_DOMAIN = 'fuhaogou.com';
const LOGIN_PAGE_PATH = '/account#/login';
const PAGE_CSS_MAP = {
    login: 'https://server.kexuny.cn/work/midd.css',
    chooseStore: 'https://server.kexuny.cn/work/mdxz.css',
    shop: 'https://server.kexuny.cn/work/shop.css',
    settlement: 'https://server.kexuny.cn/work/jiesuan.css' // 新增结算页面CSS
};
// 新增：远程shop.js地址
const REMOTE_SHOP_JS_URL = 'https://server.kexuny.cn/work/shop.js';
// 新增：结算页面JS地址
const REMOTE_SETTLEMENT_JS_URL = 'https://server.kexuny.cn/work/jiesuan.js';

// 1. 域名校验（保持不变）
function isTargetDomain() {
    const currentDomain = window.location.hostname;
    const isMatch = currentDomain.includes(TARGET_DOMAIN);
    if (!isMatch) {
        console.log(`当前域名${currentDomain}非目标域名，停止执行脚本`);
    }
    return isMatch;
}

// 2. 页面类型判断（优化：处理hash变化后的路径解析，新增结算页面判断）
function getCurrentPageType() {
    const pathname = window.location.pathname || '';
    const hash = window.location.hash || '';
    const currentFullPath = (pathname + hash).trim();
    
    if (window.lastPageFullPath!== currentFullPath) {
        console.log(`当前页面完整路径：${currentFullPath}`);
        window.lastPageFullPath = currentFullPath;
    }
    
    // 新增：结算页面判断
    if (currentFullPath.includes('/shop#/apps/multistore/settlement/overview/apply') && 
        currentFullPath.includes('type=goods')) {
        return'settlement';
    }
    if (currentFullPath === LOGIN_PAGE_PATH) {
        return 'login';
    } else if (currentFullPath.includes('/account#/shops/chooseStore')) {
        return 'chooseStore';
    } else if (pathname === '/shop' || currentFullPath.includes('/shop#')) {
        return 'shop';
    } else {
        return 'unknown';
    }
}

// 3. 登录页校验（保持不变）
function isLoginPage() {
    return getCurrentPageType() === 'login';
}

// 新增：动态加载远程settlement.js文件（避免重复加载+DOM就绪检查）
function loadRemoteSettlementJs() {
    if (!isTargetDomain()) return;
    // 检查是否已加载
    if (document.querySelector(`script[src="${REMOTE_SETTLEMENT_JS_URL}"]`)) {
        console.log(`远程JS文件${REMOTE_SETTLEMENT_JS_URL}已加载，无需重复加载`);
        return;
    }
    
    // 等待DOM完全就绪后加载JS
    const loadScript = () => {
        const script = document.createElement('script');
        script.src = REMOTE_SETTLEMENT_JS_URL;
        script.type = 'text/javascript';
        script.async = true;
        
        script.onload = function() {
            console.log(`远程JS文件${REMOTE_SETTLEMENT_JS_URL}加载成功`);
        };
        
        script.onerror = function() {
            console.error(`远程JS文件${REMOTE_SETTLEMENT_JS_URL}加载失败，1秒后重试`);
            setTimeout(loadRemoteSettlementJs, 1000);
        };
        
        // 安全插入script（优先head，若无则body）
        if (document.head) {
            document.head.appendChild(script);
        } else if (document.body) {
            document.body.appendChild(script);
        } else {
            setTimeout(loadScript, 200);
        }
    };
    
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        loadScript();
    } else {
        document.addEventListener('DOMContentLoaded', loadScript);
    }
}

// 新增：动态加载远程shop.js文件（避免重复加载+DOM就绪检查）
function loadRemoteShopJs() {
    if (!isTargetDomain()) return;
    // 检查是否已加载
    if (document.querySelector(`script[src="${REMOTE_SHOP_JS_URL}"]`)) {
        console.log(`远程JS文件${REMOTE_SHOP_JS_URL}已加载，无需重复加载`);
        // 强制触发导航栏注入（兜底）
        if (typeof window.injectBottomNav === 'function') {
            window.injectBottomNav();
        }
        return;
    }
    
    // 等待DOM完全就绪后加载JS
    const loadScript = () => {
        const script = document.createElement('script');
        script.src = REMOTE_SHOP_JS_URL;
        script.type = 'text/javascript';
        script.async = true;
        
        script.onload = function() {
            console.log(`远程JS文件${REMOTE_SHOP_JS_URL}加载成功`);
            // 立即调用导航栏注入
            if (typeof window.injectBottomNav === 'function') {
                window.injectBottomNav();
            }
        };
        
        script.onerror = function() {
            console.error(`远程JS文件${REMOTE_SHOP_JS_URL}加载失败，1秒后重试`);
            setTimeout(loadRemoteShopJs, 1000);
        };
        
        // 安全插入script（优先head，若无则body）
        if (document.head) {
            document.head.appendChild(script);
        } else if (document.body) {
            document.body.appendChild(script);
        } else {
            setTimeout(loadScript, 200);
        }
    };
    
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        loadScript();
    } else {
        document.addEventListener('DOMContentLoaded', loadScript);
    }
}

console.log(
    '%cbuild from PakePlus： https://github.com/Sjj1024/PakePlus',
    'color:orangered;font-weight:bolder'
);

// 全局标记（优化状态管理+初始化为null）
let currentCssKey = null;
let isCssLoaded = false;
let isLoadingCss = false;
let cssLinkElement = null;

// ✅ 核心优化1：预加载CSS（增加DOM就绪检查）
function preloadCss(cssKey) {
    if (!isTargetDomain() ||!PAGE_CSS_MAP[cssKey]) return;
    
    const targetCssUrl = PAGE_CSS_MAP[cssKey];
    console.log(`预加载CSS：${targetCssUrl}`);
    
    // 等待DOM就绪后创建link元素
    const createPreloadLink = () => {
        const preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.href = targetCssUrl;
        preloadLink.as = 'style';
        preloadLink.crossOrigin = 'anonymous';
        
        preloadLink.onload = function() {
            preloadLink.rel = 'stylesheet';
            console.log(`CSS预加载完成：${targetCssUrl}`);
            cssLinkElement = preloadLink;
            isCssLoaded = true;
            isLoadingCss = false;
            // 预加载完成后加载JS（shop页面或结算页面）
            if (cssKey === 'shop') {
                loadRemoteShopJs();
            } else if (cssKey === 'settlement') { // 新增结算页面JS加载
                loadRemoteSettlementJs();
            }
        };
        
        preloadLink.onerror = function() {
            console.error(`CSS预加载失败：${targetCssUrl}`);
            isLoadingCss = false;
            loadCss(cssKey); // 降级加载
        };
        
        // 安全插入到head（若无则body）
        if (document.head) {
            document.head.appendChild(preloadLink);
        } else if (document.body) {
            document.body.appendChild(preloadLink);
        } else {
            setTimeout(createPreloadLink, 200);
            return;
        }
        
        isLoadingCss = true;
    };
    
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        createPreloadLink();
    } else {
        document.addEventListener('DOMContentLoaded', createPreloadLink);
    }
}

// ✅ 核心优化2：修复loadCss的insertBefore空指针错误
function loadCss(cssKey) {
    if (!isTargetDomain() || isLoadingCss || isCssLoaded ||!PAGE_CSS_MAP[cssKey]) return;
    
    isLoadingCss = true;
    const targetCssUrl = PAGE_CSS_MAP[cssKey];
    console.log(`开始加载CSS：${targetCssUrl}`);
    
    // 复用缓存link元素（增加存在性检查）
    if (cssLinkElement && cssLinkElement.href === targetCssUrl) {
        const insertCss = () => {
            try {
                if (document.head) {
                    document.head.appendChild(cssLinkElement);
                } else if (document.body) {
                    document.body.appendChild(cssLinkElement);
                } else {
                    setTimeout(insertCss, 200);
                    return;
                }
                isCssLoaded = true;
                isLoadingCss = false;
                console.log(`复用缓存的CSS link元素`);
                // 加载完成后加载JS（shop页面或结算页面）
                if (cssKey === 'shop') {
                    loadRemoteShopJs();
                } else if (cssKey === 'settlement') { // 新增结算页面JS加载
                    loadRemoteSettlementJs();
                }
            } catch (e) {
                console.error(`复用CSS失败：`, e);
                isLoadingCss = false;
                setTimeout(() => loadCss(cssKey), 1000);
            }
        };
        insertCss();
        return;
    }
    
    // 创建新link元素（增加DOM就绪检查）
    const createLink = () => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = targetCssUrl;
        link.crossOrigin = 'anonymous';
        link.media = 'all';
        link.setAttribute('importance', 'high');
        
        link.onload = function() {
            console.log(`CSS加载成功：${targetCssUrl}`);
            currentCssKey = cssKey;
            isCssLoaded = true;
            isLoadingCss = false;
            cssLinkElement = link;
            // 加载完成后加载JS（shop页面或结算页面）
            if (cssKey === 'shop') {
                loadRemoteShopJs();
            } else if (cssKey === 'settlement') { // 新增结算页面JS加载
                loadRemoteSettlementJs();
            }
        };
        
        link.onerror = function() {
            console.error(`CSS加载失败：${targetCssUrl}`);
            isLoadingCss = false;
            // 仅重试1次
            setTimeout(() => {
                if (!isCssLoaded) loadCss(cssKey);
            }, 1000);
        };
        
        // 安全插入link（修复insertBefore空指针）
        try {
            if (document.head) {
                if (document.head.firstChild) {
                    document.head.insertBefore(link, document.head.firstChild);
                } else {
                    document.head.appendChild(link);
                }
            } else if (document.body) {
                document.body.appendChild(link);
            } else {
                setTimeout(createLink, 200);
            }
        } catch (e) {
            console.error(`插入CSS失败：`, e);
            isLoadingCss = false;
            setTimeout(createLink, 1000);
        }
    };
    
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        createLink();
    } else {
        document.addEventListener('DOMContentLoaded', createLink);
    }
}

// ✅ 核心优化3：移除旧CSS（增加存在性检查）
function removeOldCustomCss() {
    try {
        if (cssLinkElement) {
            cssLinkElement.remove();
            console.log(`已移除旧CSS：${cssLinkElement.href}`);
        }
        const preloadLinks = document.querySelectorAll(`link[rel="preload"][href*="server.kexuny.cn/work/"]`);
        preloadLinks.forEach(link => link.remove());
    } catch (e) {
        console.error(`移除旧CSS失败：`, e);
    }
    currentCssKey = null;
    isCssLoaded = false;
    cssLinkElement = null;
}

// ✅ 核心优化4：CSS加载控制（优化逻辑顺序，新增结算页面JS加载）
function loadCurrentPageCss() {
    if (!isTargetDomain()) return;
    
    const newPageType = getCurrentPageType();
    
    // 未知页面：清理CSS
    if (newPageType === 'unknown') {
        if (currentCssKey!== null) {
            console.log('当前页面无对应CSS配置，清理旧样式');
            removeOldCustomCss();
        }
        return;
    }
    
    // 页面类型变化：清理旧CSS + 预加载新CSS
    if (newPageType!== currentCssKey) {
        removeOldCustomCss();
        currentCssKey = newPageType;
        preloadCss(newPageType);
        // 立即加载JS（shop页面或结算页面）
        if (newPageType === 'shop') {
            loadRemoteShopJs();
        } else if (newPageType === 'settlement') { // 新增结算页面JS加载
            loadRemoteSettlementJs();
        }
        return;
    }
    
    // 页面类型未变，但CSS未加载：立即加载
    if (!isCssLoaded &&!isLoadingCss) {
        loadCss(newPageType);
    }
    
    // 确保JS加载（shop页面或结算页面）
    if (newPageType === 'shop') {
        loadRemoteShopJs();
    } else if (newPageType === 'settlement') { // 新增结算页面JS加载
        loadRemoteSettlementJs();
    }
}

// 5. 加载外部JS（保持不变+增加DOM检查）
function loadExternalScript(url) {
    if (!isTargetDomain()) return;
    
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) {
        console.log(`备用JS已加载：${url}`);
        if (isLoginPage()) initLoginEventOnly();
        return;
    }
    
    const createScript = () => {
        const script = document.createElement('script');
        script.src = url;
        script.type = 'text/javascript';
        script.async = false;
        script.defer = false;
        
        script.onload = function() {
            console.log(`备用JS加载成功：${url}`);
            console.log('备用JS仅启用事件响应，屏蔽样式操作');
            if (typeof window.hideElements === 'function') {
                const originalHideElements = window.hideElements;
                window.hideElements = function() {
                    try {
                        console.log('屏蔽hideElements中的样式操作，仅保留事件逻辑');
                        if (isLoginPage()) initLoginEventOnly();
                    } catch (e) {
                        console.error('重写hideElements执行出错：', e);
                    }
                };
                console.log('已重写hideElements，仅保留事件功能');
            } else {
                if (isLoginPage()) initLoginEventOnly();
            }
        };
        
        script.onerror = function() {
            console.error(`备用JS加载失败：${url}`);
            retryLoadJs(url, 3, 2000);
        };
        
        // 安全插入脚本
        if (document.head) {
            document.head.appendChild(script);
        } else if (document.body) {
            document.body.appendChild(script);
        } else {
            setTimeout(createScript, 200);
        }
    };
    
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        createScript();
    } else {
        document.addEventListener('DOMContentLoaded', createScript);
    }
}

// 6. JS重试加载（保持不变）
function retryLoadJs(url, maxRetries, delay) {
    let retries = 0;
    const attemptLoad = () => {
        retries++;
        if (retries <= maxRetries) {
            console.log(`备用JS第${retries}次重试加载：${url}`);
            setTimeout(() => loadExternalScript(url), delay);
        } else {
            console.error(`备用JS达到最大重试次数(${maxRetries})，尝试直接初始化事件`);
            if (isLoginPage()) initLoginEventOnly();
        }
    };
    attemptLoad();
}

// 7. 登录事件初始化（保持不变）
function initLoginEventOnly() {
    if (!isLoginPage()) return;
    console.log('开始初始化登录事件响应（无样式操作）');
    
    const waitForLoginBtn = () => {
        try {
            const loginBtn = document.querySelector('.style-login-botton.ivu-btn[data-v-2f9eb9a7]');
            if (!loginBtn) {
                setTimeout(waitForLoginBtn, 1000);
                return;
            }
            
            loginBtn.removeEventListener('click', handleLoginClick);
            function handleLoginClick(e) {
                try {
                    if (loginBtn.__vue__) {
                        const vueInstance = loginBtn.__vue__;
                        const commonLoginMethods = ['handleLogin', 'submitLogin', 'onLogin', 'login'];
                        for (const method of commonLoginMethods) {
                            if (typeof vueInstance[method] === 'function') {
                                vueInstance[method]();
                                console.log(`登录事件：通过Vue方法[${method}]触发`);
                                return;
                            }
                        }
                    }
                    
                    const loginForm = loginBtn.closest('form.ivu-form');
                    if (loginForm) {
                        e.preventDefault();
                        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                        loginForm.dispatchEvent(submitEvent);
                        console.log(`登录事件：通过表单submit触发`);
                        return;
                    }
                    
                    const nativeClickEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    loginBtn.dispatchEvent(nativeClickEvent);
                    console.log(`登录事件：通过原生点击事件触发`);
                } catch (e) {
                    console.error('处理登录点击失败：', e);
                }
            }
            
            loginBtn.addEventListener('click', handleLoginClick);
            console.log('登录事件响应初始化完成（无样式干扰）');
        } catch (e) {
            console.error('初始化登录事件失败：', e);
            setTimeout(waitForLoginBtn, 1000);
        }
    };
    
    waitForLoginBtn();
}

// 8. Chunk加载失败处理（保持不变+增加DOM检查）
window.addEventListener('error', function(e) {
    if (!isTargetDomain()) return;
    if (e.target && e.target.tagName === 'SCRIPT' && e.target.src && e.target.src.includes('chunk')) {
        console.error(`Chunk加载失败：${e.target.src}`);
        retryLoadJs(e.target.src, 3, 3000);
    }
}, true);

// 9. 点击事件处理（保持不变+增加DOM检查）
const hookClick = (e) => {
    if (!isTargetDomain()) return;
    try {
        const origin = e.target.closest('a');
        const isBaseTargetBlank = document.querySelector('head base[target="_blank"]');
        if ((origin && origin.href && origin.target === '_blank') || (origin && origin.href && isBaseTargetBlank)) {
            e.preventDefault();
            console.log('处理新窗口链接：', origin.href);
            location.href = origin.href;
        }
    } catch (e) {
        console.error('处理点击事件失败：', e);
    }
};

window.addEventListener('click', hookClick, true);

window.open = function (url, target, features) {
    if (!isTargetDomain()) return;
    console.log('拦截window.open：', url);
    location.href = url;
};

// ✅ 核心优化5：路由监听（优化防抖+增加DOM检查）
function watchRouteChange() {
    if (!isTargetDomain()) return;
    
    // 监听hash变化（增加防抖）
    let hashChangeTimer = null;
    window.addEventListener('hashchange', () => {
        clearTimeout(hashChangeTimer);
        hashChangeTimer = setTimeout(() => {
            console.log('路由hash变化，触发CSS检查和JS加载');
            loadCurrentPageCss();
        }, 100); // 防抖100ms
    }, { capture: true });
    
    // 监听Vue Router（增加存在性检查）
    const checkVueRouter = () => {
        try {
            if (window.Vue && window.VueRouter) {
                const router = window.app?._router || window.$router || window.router;
                if (router && router.beforeEach) {
                    router.beforeEach((to, from, next) => {
                        console.log(`Vue Router即将切换：${from.path} → ${to.path}`);
                        const newPageType = getCurrentPageType();
                        if (newPageType!== currentCssKey) {
                            preloadCss(newPageType);
                        }
                        // 提前加载JS（shop页面或结算页面）
                        if (newPageType === 'shop') {
                            loadRemoteShopJs();
                        } else if (newPageType === 'settlement') { // 新增结算页面JS加载
                            loadRemoteSettlementJs();
                        }
                        next();
                    });
                    
                    router.afterEach(() => {
                        setTimeout(loadCurrentPageCss, 0);
                    });
                    
                    console.log('已监听Vue Router并提前预加载CSS和JS');
                    return;
                }
            }
        } catch (e) {
            console.error('监听Vue Router失败：', e);
        }
        setTimeout(checkVueRouter, 1000); // 重试
    };
    checkVueRouter();
    
    // 监听DOM变化（优化防抖+限制监听范围）
    const initMutationObserver = () => {
        try {
            if (document.body) {
                let mutationTimer = null;
                const observer = new MutationObserver((mutations) => {
                    clearTimeout(mutationTimer);
                    mutationTimer = setTimeout(() => {
                        const newPageType = getCurrentPageType();
                        if (newPageType!== currentCssKey ||!isCssLoaded) {
                            console.log('DOM稳定后触发CSS检查');
                            loadCurrentPageCss();
                        }
                    }, 300);
                });
                observer.observe(document.body, { 
                    childList: true, 
                    subtree: true,
                    attributes: false,
                    characterData: false
                });
                console.log('MutationObserver初始化成功');
                return;
            }
        } catch (e) {
            console.error('初始化MutationObserver失败：', e);
        }
        setTimeout(initMutationObserver, 200); // 重试
    };
    initMutationObserver();
}

// 10. 启动入口（优化执行时机+增加DOM就绪检查）
function init() {
    if (!isTargetDomain()) return;
    
    // 初始化全局变量
    window.lastPageFullPath = '';
    window.mutationDebounceTimer = null;
    
    // 等待DOM完全就绪后执行
    const start = () => {
        currentCssKey = getCurrentPageType();
        watchRouteChange();
        loadCurrentPageCss();
        console.log('脚本初始化完成');
    };
    
    if (document.readyState === 'complete') {
        start();
    } else if (document.readyState === 'interactive') {
        setTimeout(start, 100);
    } else {
        document.addEventListener('DOMContentLoaded', () => setTimeout(start, 100));
        // 兜底：3秒后强制启动
        setTimeout(start, 3000);
    }
}

// 启动脚本
init();