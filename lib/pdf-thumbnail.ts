// Renders page 1 of a PDF to a PNG, entirely client-side. Used right after a
// PDF upload to give the resource a real cover image instead of a generic
// placeholder — see FileUploadList.tsx and LessonPlanUpload.tsx. Dynamically
// imports pdfjs-dist so its cost is only paid at upload time, not on every
// resource-page view.
const MAX_WIDTH = 800;

export async function generatePdfThumbnail(file: File): Promise<Blob> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const page = await pdf.getPage(1);

  const unscaledViewport = page.getViewport({ scale: 1 });
  const scale = MAX_WIDTH / unscaledViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create canvas context");

  await page.render({ canvas, canvasContext: context, viewport }).promise;
  await pdf.destroy();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not generate thumbnail"))), "image/png");
  });
}
