// Elegant PDF Viewer using IndexedDB + PDF.js
const DB_NAME = 'pdfReaderDB';
const STORE_NAME = 'pdfFiles';
let db, pdfDoc, currentPage = 1, currentPdfId = null;

const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// IndexedDB setup
const request = indexedDB.open(DB_NAME, 1);
request.onupgradeneeded = e => {
  const db = e.target.result;
  db.createObjectStore(STORE_NAME, { keyPath: 'id' });
};
request.onsuccess = e => {
  db = e.target.result;
};
request.onerror = () => alert('Database failed to open.');

const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('pdfCanvas');
const ctx = canvas.getContext('2d');
const pageInfo = document.getElementById('pageInfo');

// File handling
fileInput.addEventListener('change', e => handleFiles(e.target.files));
uploadZone.addEventListener('dragover', e => {
  e.preventDefault();
  uploadZone.classList.add('dragover');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  handleFiles(e.dataTransfer.files);
});

async function handleFiles(files) {
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const record = { id: `${file.name}_${Date.now()}`, name: file.name, data: blob, lastPage: 1 };
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => openPdf(record.id);
  }
}

// Open PDF
function openPdf(id) {
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  store.get(id).onsuccess = async e => {
    const pdfFile = e.target.result;
    currentPdfId = id;
    pdfDoc = await pdfjsLib.getDocument(URL.createObjectURL(pdfFile.data)).promise;
    currentPage = pdfFile.lastPage || 1;
    renderPage(currentPage);
  };
}

// Render page
async function renderPage(num) {
  const page = await pdfDoc.getPage(num);
  const viewport = page.getViewport({ scale: 1.4 });
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  await page.render({ canvasContext: ctx, viewport }).promise;
  pageInfo.textContent = `Page ${num} / ${pdfDoc.numPages}`;
  saveLastPage();
}

// Save last page to DB
function saveLastPage() {
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.get(currentPdfId).onsuccess = e => {
    const pdf = e.target.result;
    if (pdf) {
      pdf.lastPage = currentPage;
      store.put(pdf);
    }
  };
}

// Controls
document.getElementById('nextPage').addEventListener('click', () => {
  if (pdfDoc && currentPage < pdfDoc.numPages) {
    currentPage++;
    renderPage(currentPage);
  }
});
document.getElementById('prevPage').addEventListener('click', () => {
  if (pdfDoc && currentPage > 1) {
    currentPage--;
    renderPage(currentPage);
  }
});
