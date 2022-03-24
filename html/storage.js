async function open(version = 1) {
  const req = indexedDB.open("storage", version);

  return new Promise((resolve, reject) => {
    req.onsuccess = (event) => {
      console.debug("Database initialized", event);
      resolve(req.result);
    };

    req.onerror = (event) => {
      console.debug("Error loading database", event);
      reject(event);
    };

    req.onupgradeneeded = (event) => {
      console.debug("Database upgraded", event);
      const db = req.result;
      if (version == 1) {
        db.createObjectStore("kv", { keyPath: "key" });
      }
    };
  });
}

export class KVStorage {
  constructor() {
    this.cache = new Map();
    this.db = null;
  }

  setItem(key, value) {
    this.cache.set(key, value);
    return value;
  }

  getItem(key) {
    return this.cache.get(key);
  }

  removeItem(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  async sync() {
    // temporarily reset database

    if (!this.db) {
      this.db = await open();
    }

    const tx = this.db.transaction("kv", "readwrite");
    const kv = tx.objectStore("kv");

    kv.clear();
    this.cache.forEach((value, key) => {
      kv.add({ key, value });
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = (event) => {
        console.debug("Transaction completed", event);
        resolve();
      };
      tx.onerror = (event) => {
        console.debug("Transaction not opened due to error", event);
        reject(event);
      };
    });
  }
}
