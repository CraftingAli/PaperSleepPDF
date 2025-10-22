// IndexedDB helper module for storing and retrieving PDFs

const DB_NAME = 'papersleekpdf_db';
const STORE_NAME = 'pdf_store';
const DB_VERSION = 1;

export class PDFDatabase {
  constructor() {
    this.db = null;
  }

  open() {
    return new Promise((resolve, reject) => {
      if (this.db) return resolve(this.db);
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };
    });
  }

  addPDF(id, data) {
    return new Promise(async (resolve, reject) => {
      await this.open();
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put({ id, data });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  getPDF(id) {
    return new Promise(async (resolve, reject) => {
      await this.open();
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => {
        resolve(request.result ? request.result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  getAllPDFs() {
    return new Promise(async (resolve, reject) => {
      await this.open();
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  deletePDF(id) {
    return new Promise(async (resolve, reject) => {
      await this.open();
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const pdfDB = new PDFDatabase();
