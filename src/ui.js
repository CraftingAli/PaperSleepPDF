// UI event handlers and rendering helpers

import { pdfDB } from './db.js';
import { loadAndRenderPDF, renderPage, isPdfLoaded } from './app.js';

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');

function updatePageInfo(current, total) {
  pageInfo.textContent = `Page ${current} of ${total}`;
}

function updateNavButtons(current, total) {
  prevBtn.disabled = current <= 1;
  nextBtn.disabled = current >= total;
}

uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', e => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', e => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', async e => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  const files = e.dataTransfer.files;
  await handleFiles(files);
});

fileInput.addEventListener('change', async e => {
  const files = e.target.files;
  await handleFiles(files);
  fileInput.value = '';
});

async function handleFiles(files) {
  for (const file of files) {
    if (file.type !== 'application/pdf') continue;
    const arrayBuffer = await file.arrayBuffer();
    const id = generateId(file);
    await pdfDB.addPDF(id, arrayBuffer);
    await loadAndRenderPDF(id, arrayBuffer);
  }
}

function generateId(file) {
  return `${file.name.replace(/W+/g, '_')}_${file.lastModified}`;
}

prevBtn.addEventListener('click', () => {
  if (!isPdfLoaded()) return;
  window.dispatchEvent(new CustomEvent('pdfPageChange', { detail: 'prev' }));
});

nextBtn.addEventListener('click', () => {
  if (!isPdfLoaded()) return;
  window.dispatchEvent(new CustomEvent('pdfPageChange', { detail: 'next' }));
});

export { updatePageInfo, updateNavButtons, generateId, handleFiles };
