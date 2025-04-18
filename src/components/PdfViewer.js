import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import './PdfViewer.css';

function PdfViewer({ bookId, pdfUrl }) {
  const { user } = useAuth();
  const canvasRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPdf = async () => {
      const pdfjsLib = window.pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/build/pdf.worker.min.js';

      try {
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        setTotalPages(pdf.numPages);

        if (user) {
          const progressRef = doc(db, 'progress', `${user.uid}_${bookId}`);
          const progressSnap = await getDoc(progressRef);
          if (progressSnap.exists()) {
            setCurrentPage(progressSnap.data().page || 1);
          }
        }

        const page = await pdf.getPage(currentPage);
        const viewport = page.getViewport({ scale: 1.5 }); // Increased scale for readability

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        await page.render(renderContext).promise;
        setError(null);
      } catch (error) {
        console.error('Error rendering PDF:', error);
        setError('Failed to load PDF. Please try another book.');
      }
    };

    if (pdfUrl) {
      loadPdf();
    }
  }, [pdfUrl, currentPage, bookId, user]);

  const saveProgress = async (page) => {
    if (user) {
      const progressRef = doc(db, 'progress', `${user.uid}_${bookId}`);
      await setDoc(progressRef, { bookId, page, pdfUrl }, { merge: true });
    }
  };

  const goToPage = async (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      await saveProgress(pageNum);
    }
  };

  return (
    <div className="pdf-viewer">
      {error ? (
        <p className="error">{error}</p>
      ) : pdfUrl ? (
        <>
          <div className="pdf-controls">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
            </button>
          </div>
          <canvas ref={canvasRef}></canvas>
        </>
      ) : (
        <p>Loading PDF...</p>
      )}
    </div>
  );
}

export default PdfViewer;