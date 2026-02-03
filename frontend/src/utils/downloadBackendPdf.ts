function getFilenameFromContentDisposition(cd: string | null): string | null {
  if (!cd) return null;

  // filename="abc.pdf"
  const m1 = /filename="([^"]+)"/i.exec(cd);
  if (m1?.[1]) return m1[1];

  // filename=abc.pdf
  const m2 = /filename=([^;]+)/i.exec(cd);
  if (m2?.[1]) return m2[1].trim();

  return null;
}

export async function downloadBackendPdf(url: string, fallbackFilename?: string) {
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    // try to return json error message
    try {
      const data = await res.json();
      throw new Error(data?.message || `Request failed (${res.status})`);
    } catch {
      throw new Error(`Request failed (${res.status})`);
    }
  }

  const blob = await res.blob();
  const cd = res.headers.get("content-disposition");
  const filename = getFilenameFromContentDisposition(cd) || fallbackFilename || "download.pdf";

  const blobUrl = window.URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    window.URL.revokeObjectURL(blobUrl);
  }
}
