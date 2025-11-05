/**
 * IndexedDBをLocalStorageライクに使えるようにするクラスです
 * */
LSIndexedDBClient = class {
    constructor ({ dbName, storeNames, version }) {
        this.dbName = dbName; //データベース名
        this.storeNames = storeNames || ["data"]; //ストア名の配列(RDBのテーブル名に相当)
        this.version = Math.ceil(version); // ストア名を変更するときはバージョンを上げる
        this._getConnection().then(conn => conn.close()); //初期状態ではdbのconnectionは閉じておく
        this._getLogger()("IndexedDBClient Opened:", { dbName, storeNames, version });
        // polyfil
        if (!IDBTransaction.prototype.commit) {
            IDBTransaction.prototype.commit = () => { this._getLogger()("fake commit"); };
        }
    }

    select(storeName) {
        if (!this.storeNames.includes(storeName))
            throw TypeError("Not contains such a store in database:" + storeName);
        this.storeName = storeName;
        return this;
    }

    setItem(key, object) {
        return new Promise((resolve, reject) => {
            this._getConnection()
                .then(conn => {
                    try {
                        const transaction = conn.transaction([this.storeName], 'readwrite');
                        const req = transaction.objectStore(this.storeName).put(object, key);
                        req.onsuccess = (event) => {
                            resolve(event.target.result);
                        };
                        req.onerror = reject;
                        transaction.onerror = reject;
                        transaction.onabort = reject;
                        transaction.commit();
                    }
                    finally {
                        conn.close();
                    }
                })
                .catch(reject);
        });
    }

    getItem(key) {
        return new Promise((resolve, reject) => {
            this._getConnection()
                .then(conn => {
                    try {
                        const transaction = conn.transaction([this.storeName], 'readonly');
                        const req = transaction.objectStore(this.storeName).get(key);
                        req.onsuccess = (event) => {
                            resolve(event.target.result);
                        };
                        req.onerror = reject;
                        transaction.onerror = reject;
                        transaction.onabort = reject;
                    }
                    finally {
                        conn.close();
                    }
                })
                .catch(reject);
        });
    }

    removeItem(key) {
        return this.setItem(key, undefined);
    }

    clear() {
        return new Promise((resolve, reject) => {
            this._getConnection()
                .then(conn => {
                    try {
                        const transaction = conn.transaction([this.storeName], 'readwrite');
                        transaction.objectStore(this.storeName).clear();
                        transaction.oncomplete = resolve;
                        transaction.onerror = reject;
                        transaction.onabort = reject;
                        transaction.commit();
                    }
                    finally {
                        conn.close();
                    }
                })
                .catch(reject);
        });
    }

    drop() {
        //ddlを発行し、データベース自体を削除する
        return new Promise((resolve, reject) => {
            const ddl = indexedDB.deleteDatabase(this.dbName);
            ddl.onsuccess = () => {
                this._getLogger()(this.dbName + " droped");
                resolve();
            };
            ddl.onblocked = () => {
                this._getLogger()("DDL blocked:waiting for drop...");
                ddl.onupgradeneeded = () => {
                    this._getLogger()(this.dbName + " droped");
                    resolve();
                };
            };
            ddl.onerror = reject;
        });
    }

    //データベースのコネクションを取得します
    _getConnection() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onsuccess = () => {
                const conn = request.result;
                resolve(conn);
            };
            request.onerror = reject;
            request.onupgradeneeded = () => {
                const conn = request.result;
                for (let i = 0; i < this.storeNames.length; i++) {
                    try {
                        conn.createObjectStore(this.storeNames[i]);
                    }
                    catch (e) {
                        this._getLogger()(this.storeNames[i] + "seems to be already exist,continue", e);
                    };
                }
            };
        });
    }

    // logging
    _getLogger() {
        if (typeof self != "undefined" && typeof self.log == "function")
            return self.log;
        else
            return console.log.bind(console, `[${new Date().toISOString()}][IndexedDB Client]%O`, "", "");
    }
};