declare module "pdfkit" {
  class PDFDocument {
    // Cursor position used by pdfkit
    y: number;

    constructor(options?: any);

    // Common methods used in our code
    fontSize(size: number): this;

    // pdfkit supports multiple signatures for text()
    text(text: string, options?: any): this;
    text(text: string, x?: number, y?: number, options?: any): this;

    moveDown(lines?: number): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    stroke(color?: any): this;
    fillColor(color: any): this;

    // Streams/events
    on(event: string, listener: (...args: any[]) => void): this;
    pipe(dest: any, options?: any): any;

    end(): void;
  }

  export default PDFDocument;
}
