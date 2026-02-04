import { HistoryChapter } from '../../types';
import { downloadBackendPdf } from '../../utils/downloadBackendPdf';

type PaperSizeType = 'a5' | 'a4' | 'a3' | 'a2' | 'a1';

export const generateChapterPdf = async (
  chapter: HistoryChapter,
  _paperSize: PaperSizeType = 'a5'
): Promise<void> => {
  const safeTitle = chapter.title?.replace(/\s+/g, '_') || 'Chapter';
  const filename = `Chapter_${chapter.chapterNumber ?? ''}_${safeTitle}.pdf`.replace(/__+/g, '_');
  await downloadBackendPdf(`/api/pdfs/history-chapters/${chapter.id}`, filename);
};

