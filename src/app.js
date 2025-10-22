// Main app logic, PDF rendering, and persistence

import { pdfDB } from './db.js';
import { updatePageInfo, updateNavButtons } from './ui.js';

const canvas = document.getElementById('pdfCanvas');
const ctx = canvas.getContext('2d');

let pdfDocs = new Map();

let currentPdfId = null;
let currentPage = 1;
let totalPages = 0;

function isPdfLoaded() {
  return currentPdfId !== null && pdfDocs.has(currentPdfId);
}

async function loadAndRenderPDF(id, arrayBuffer) {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  pdfDocs.set(id, pdfDoc);
  currentPdfId = id;
  totalPages = pdfDoc.numPages;
  currentPage = getLastPage(id);
  await renderPage(currentPage);
  updateNavButtons(currentPage, totalPages);
  updatePageInfo(currentPage, totalPages);
}

async function renderPage(pageNum) {
  if (!isPdfLoaded()) return;
  const pdfDoc = pdfDocs.get(currentPdfId);
  const page = await pdfDoc.getPage(pageNum);
  const scale = 1.5;
  const viewport = page.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport
  };

  await page.render(renderContext).promise;
  currentPage = pageNum;
  saveCurrentPage(currentPdfId, pageNum);
  updatePageInfo(currentPage, totalPages);
  updateNavButtons(currentPage, totalPages);
}

function saveCurrentPage(id, page) {
  localStorage.setItem(`pdf_${id}_lastPage`, page);
}

function getLastPage(id) {
  const p = localStorage.getItem(`pdf_${id}_lastPage`);
  return p ? parseInt(p, 10) : 1;
}

// Load all stored PDFs on app initialization
async function initialize() {
  const allPdfs = await pdfDB.getAllPDFs();
  if (allPdfs.length === 0) {
    updatePageInfo(0, 0);
    return;
  }
  for (const pdfEntry of allPdfs) {
    await loadAndRenderPDF(pdfEntry.id, pdfEntry.data);
  }
}

// Listen for navigation events from UI module
window.addEventListener('pdfPageChange', async (event) => {
  if (!isPdfLoaded()) return;
  if (event.detail === 'next' && currentPage < totalPages) {
    await renderPage(currentPage + 1);
  } else if (event.detail === 'prev' && currentPage > 1) {
    await renderPage(currentPage - 1);
  }
});

// Start the app
window.addEventListener('load', () => {
  initialize();
});

export { loadAndRenderPDF, renderPage, isPdfLoaded };
