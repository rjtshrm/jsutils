// Images to PDF
const imgBtn = document.getElementById('imgToPdfBtn');
imgBtn.addEventListener('click', async () => {
  const files = document.getElementById('imgFiles').files;
  if (!files.length) return;
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  for (let i = 0; i < files.length; i++) {
    if (i > 0) pdf.addPage();
    const file = files[i];
    const imgData = await file.arrayBuffer();
    const dataUrl = await new Promise((res) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.readAsDataURL(new Blob([imgData]));
    });
    const img = new Image();
    await new Promise((r) => {
      img.onload = r;
      img.src = dataUrl;
    });
    const width = pdf.internal.pageSize.getWidth();
    const height = (img.height / img.width) * width;
    pdf.addImage(img, 'PNG', 0, 0, width, height);
  }

  pdf.save('images.pdf');
});

// PDF to Images
const pdfToImgBtn = document.getElementById('pdfToImgBtn');
pdfToImgBtn.addEventListener('click', async () => {
  const file = document.getElementById('pdfToImgFile').files[0];
  if (!file) return;
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const preview = document.getElementById('imgPreview');
  preview.innerHTML = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    const img = document.createElement('img');
    img.src = canvas.toDataURL();
    preview.appendChild(img);
  }
});

// Merge PDFs
const mergeBtn = document.getElementById('mergeBtn');
mergeBtn.addEventListener('click', async () => {
  const files = document.getElementById('mergeFiles').files;
  if (!files.length) return;
  const mergedPdf = await PDFLib.PDFDocument.create();

  for (const f of files) {
    const bytes = await f.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(bytes);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(p => mergedPdf.addPage(p));
  }

  const bytes = await mergedPdf.save();
  downloadPdf(bytes, 'merged.pdf');
});

// Split PDF
const splitBtn = document.getElementById('splitBtn');
splitBtn.addEventListener('click', async () => {
  const file = document.getElementById('splitFile').files[0];
  const range = document.getElementById('splitRange').value;
  if (!file || !range) return;
  const bytes = await file.arrayBuffer();
  const pdf = await PDFLib.PDFDocument.load(bytes);
  const pageIndices = parseRange(range, pdf.getPageCount());
  const newPdf = await PDFLib.PDFDocument.create();
  const pages = await newPdf.copyPages(pdf, pageIndices);
  pages.forEach(p => newPdf.addPage(p));
  const out = await newPdf.save();
  downloadPdf(out, 'split.pdf');
});

function parseRange(str, total) {
  const result = [];
  const parts = str.split(',');
  parts.forEach(p => {
    if (p.includes('-')) {
      const [a, b] = p.split('-').map(n => parseInt(n.trim(), 10) - 1);
      for (let i = a; i <= b && i < total; i++) result.push(i);
    } else {
      const idx = parseInt(p.trim(), 10) - 1;
      if (idx >= 0 && idx < total) result.push(idx);
    }
  });
  return result;
}

function downloadPdf(bytes, name) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
