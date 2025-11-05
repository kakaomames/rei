/*
 * PWAアプリとしてWebページを動作させた後に、PWAプラグインを読んでいく
 */
(() => {
    const PUBLIC_OBJECT = "littlesoft";
    const PLUGIN_FOLDER_PATH = "/lib/javascripts/pwa_plugins/";
    const INDEXEDDB_CLIENT = "/lib/javascripts/indexedDBClient.js";
    const log = console.log.bind(console, `[${new Date().toISOString()}][PWA LOADER]%s`);
    /*
     * littlesoft.util
     */
    const util = class {
        /**
         * PWAプラグインの場所を戻す
         * */
        static getPluginFolderPath() {
            return PLUGIN_FOLDER_PATH;
        }

        /**
         * 外部スクリプトを読み込む
         * */
        static loadScript(url) {
            return new Promise((resolve, reject) => {
                log("loading:" + url);
                let script = document.createElement("script");
                script.onload = resolve;
                script.onerror = reject;
                script.defer = true;
                script.setAttribute("importance", "low"); //　PWAは付加機能であるため、読み込みの優先度は下げる
                script.src = url;
                document.getElementsByTagName("head")[0].appendChild(script);
            });
        }

        /**
         * Cordova内部かどうかを判定する 
         **/
        static isCordova() {
            if (window.cordova) return true;
            if (window._cordovaNative) return true;
            return navigator.userAgent.indexOf('Cordova') !== -1;
        }
    };

    /*
     * Private 
     */
    const _private = new class {
        async init() {
            // PWAアプリとしてWebManifestを読む
            this.manifest = await this.loadManifest();
            // localhostのみ動作の場合
            if (this.manifest.options.pwa_only_local && location.hostname !== "localhost") {
                log("PWA disabled because pwa_only_local option is true");
                return;
            }
            // WebManifestから読み込むプラグインのリストを取得
            const pluginList = this.getPluginList(this.manifest);
            if (pluginList.length == 0) {
                // 0件ならservice workerを削除
                this.unregisterServiceWorker();
            }
            else {
                try {
                    // SW更新確認
                    await this.checkServiceWorkerUpdate();
                    // バックグラウンド(Service Worker)にプラグインを読む
                    await this.kickServiceWorker(pluginList);
                    // SW読み込みを待つ
                    await this.waitServiceWorkerStarting();
                } catch (e) { log(e) };
                // フォアグラウンドにプラグインを読む
                await this.kickPlugin(pluginList);
            }
        }

        /**
         * web manifestを動的に読み込む
         */
        loadManifest() {
            return new Promise((resolve, reject) => {
                const settings = LsAppConfig.client.pwaPlugins;
                // webmanifestにls_optionsは必須
                if (!settings["options"]) {
                    throw new Error("options property is needed!");
                }
                // ls_options > pwa_installableがtrueの場合はインストール可としてwebmanifestを有効にする
                else if (settings["options"]["pwa_installable"] && !window.__doNotInstall) {
                    const manifest = document.querySelector("link[rel=manifest]");
                    const url = manifest.dataset["webmanifest"];
                    if (!url) reject(new URIError("data-webmanifest attribute is needed!"));
                    manifest.setAttribute('href', url);
                }
                // それ以外はインストール不可とする
                else {
                    log(settings, "this webmanifest did not installed");
                }
                resolve(settings);
            });
        }

        getPluginList(manifest) {
            let list = [];
            try {
                const settings = manifest["options"]["load_plugins"];
                if (util.isCordova()) {
                    list = settings["cordova"];
                }
                else {
                    list = settings["web"];
                }
            }
            catch (e) {
                console.error("options属性に読み込むプラグインを記述してください");
                throw e;
            }
            log("Loading PWA Plugin:" + list.toString());
            return list;
        }

        async checkServiceWorkerUpdate() {
            try {
                if (typeof navigator.serviceWorker == "undefined") return;
                const regist = await navigator.serviceWorker.getRegistration();
                if (regist) {
                    await regist.update();
                }
            }
            catch (e) {
                log(e); // network error
            }
        }

        kickServiceWorker(options) {
            if (!navigator.serviceWorker) {
                throw new Error("ServiceWorker requires localhost or Secure Context. Example: http://localhost:3333 or https://hogehuga.example/");
            }
            const query = options.join("&");
            return navigator.serviceWorker
                .register(PLUGIN_FOLDER_PATH + "serviceworker_loader.js" + "?" + query, { scope: "/" })
        }

        waitServiceWorkerStarting() {
            return new Promise(resolve => {
                const wait = () => setTimeout(() => {
                    if (navigator.serviceWorker.controller)
                        resolve();
                    else
                        wait();
                }, 500);
                wait();
            });
        }

        async unregisterServiceWorker() {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
                const result = await registration.unregister();
                log("Service Worker unregistered:" + result);
            }
        }

        kickPlugin(pluginList) {
            return new Promise((resolve, reject) => {
                fetch(PLUGIN_FOLDER_PATH + "packages.jsonp.js", { importance: "low" })
                    .then(res => res.text())
                    .then(async text => {
                        const jsontext = text.split("/*JSON*/")[1];
                        try {
                            return JSON.parse(jsontext);
                        }
                        catch (e) {
                            console.error("invalid JSONP:", text);
                            throw e;
                        }
                    })
                    .then(async packages => {
                        // とくに読み込みは急がないので、他のリクエストを邪魔しないように同期モードかつ低優先度で一つづつ読み込んでいく
                        for (let name in packages) {
                            const _plugin = packages[name];
                            if (!_plugin.fg) continue;
                            if (pluginList.indexOf(name) == -1) continue;
                            const _url = new URL(PLUGIN_FOLDER_PATH + name + "/" + _plugin.fg, location.origin);
                            if (_url.origin != location.origin) throw new URIError(url + "is danger!!");
                            await util.loadScript(_url)
                                .catch(error => {
                                    console.error("plugin loading error:", error, _plugin);
                                    reject("plugin loading error:" + _url);
                                });
                        }
                        resolve();
                    });
            });

        }
    };
    /*
     * Public
     */
    const _public = new class {
        constructor() {
            (async () => {
                window[PUBLIC_OBJECT] = window[PUBLIC_OBJECT] || {};
                window[PUBLIC_OBJECT].util = util;
                await util.loadScript(INDEXEDDB_CLIENT);
                await _private.init();
            })();
        }
    };

})();
