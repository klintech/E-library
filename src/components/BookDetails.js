import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import PdfViewer from './PdfViewer';
import './BookDetails.css';

function BookDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [similarBooks, setSimilarBooks] = useState([]);
  const [isFreeBook, setIsFreeBook] = useState(true);

  useEffect(() => {
    async function fetchBook() {
      try {
        // Fetch book details from Google Books
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes/${id}`);
        const data = await response.json();
        setBook(data);
        setLoading(false);

        // Check if user has favorited this book
        if (user) {
          const favoriteRef = doc(db, 'favorites', `${user.uid}_${id}`);
          const favoriteSnap = await getDoc(favoriteRef);
          setIsFavorite(favoriteSnap.exists());
        }

        // Fetch PDF from Open Library
        const titleQuery = data.volumeInfo.title.split(' ').join('+').toLowerCase();
        try {
          const olResponse = await fetch(`https://openlibrary.org/search.json?q=${titleQuery}`);
          const olData = await olResponse.json();
          const bookData = olData.docs.find(
            (doc) => doc.ebook_access === 'public' && doc.formats?.['application/pdf']
          );
          if (bookData?.formats?.['application/pdf']) {
            setPdfUrl(bookData.formats['application/pdf']);
          }
        } catch (error) {
          console.error('Error fetching Open Library PDF:', error);
        }

        // Try Project Gutenberg
        if (!pdfUrl) {
          try {
            const gutenbergResponse = await fetch(
              `https://gutendex.com/books?search=${encodeURIComponent(titleQuery)}`
            );
            const gutenbergData = await gutenbergResponse.json();
            const gutenbergBook = gutenbergData.results.find(
              (book) => book.formats['application/pdf']
            );
            if (gutenbergBook?.formats['application/pdf']) {
              setPdfUrl(gutenbergBook.formats['application/pdf']);
            }
          } catch (error) {
            console.error('Error fetching Project Gutenberg PDF:', error);
          }
        }

        // Try Standard Ebooks (using their catalog)
        if (!pdfUrl) {
          try {
            const standardResponse = await fetch('https://standardebooks.org/ebooks.json');
            const standardData = await standardResponse.json();
            const standardBook = standardData.find((book) =>
              book.title.toLowerCase().includes(data.volumeInfo.title.toLowerCase())
            );
            if (standardBook?.downloads['application/pdf']) {
              setPdfUrl(standardBook.downloads['application/pdf']);
            }
          } catch (error) {
            console.error('Error fetching Standard Ebooks PDF:', error);
          }
        }

        // Fallback and similar books
        if (!pdfUrl) {
          setIsFreeBook(false);
          const fallbackPdfsByGenre = {
            fiction: [
              'https://www.gutenberg.org/ebooks/1342/files/1342-pdf.pdf', // Pride and Prejudice
              'https://www.gutenberg.org/ebooks/84/files/84-pdf.pdf', // Frankenstein
              'https://www.gutenberg.org/ebooks/5200/files/5200-pdf.pdf', // Metamorphosis
            ],
            novel: [
              'https://www.gutenberg.org/ebooks/174/files/174-pdf.pdf', // The Picture of Dorian Gray
              'https://www.gutenberg.org/ebooks/11/files/11-pdf.pdf', // Alice's Adventures in Wonderland
            ],
            'middle grade': [
              'https://www.gutenberg.org/ebooks/5670/files/5670-pdf.pdf', // The Secret Garden
              'https://www.gutenberg.org/ebooks/514/files/514-pdf.pdf', // Little Women
            ],
          };
          const category = data.volumeInfo.categories?.[0]?.toLowerCase() || 'fiction';
          const fallbackPdfs = fallbackPdfsByGenre[category] || fallbackPdfsByGenre['middle grade'] || fallbackPdfsByGenre.fiction;
          setPdfUrl(fallbackPdfs[Math.floor(Math.random() * fallbackPdfs.length)]);

          // Fetch similar books from Google Books
          const similarCategory = data.volumeInfo.categories?.[0] || 'fiction';
          try {
            const similarResponse = await fetch(
              `https://www.googleapis.com/books/v1/volumes?q=subject:${encodeURIComponent(similarCategory)}&maxResults=3`
            );
            const similarData = await similarResponse.json();
            setSimilarBooks(similarData.items || []);
          } catch (error) {
            console.error('Error fetching similar books:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching book:', error);
        setLoading(false);
      }
    }
    fetchBook();
  }, [id, user, pdfUrl]);

  const toggleFavorite = async () => {
    if (!user) {
      alert('Please log in to save favorites.');
      return;
    }
    const favoriteRef = doc(db, 'favorites', `${user.uid}_${id}`);
    try {
      if (isFavorite) {
        await setDoc(favoriteRef, { exists: false }, { merge: true });
        setIsFavorite(false);
      } else {
        await setDoc(favoriteRef, { bookId: id, exists: true }, { merge: true });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const handleReadClick = () => {
    if (!user) {
      navigate(`/login?returnTo=${encodeURIComponent(location.pathname)}`);
    }
  };

  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (!book) return <p>Book not found.</p>;

  const { volumeInfo } = book;
  const title = volumeInfo.title || 'No Title';
  const authors = volumeInfo.authors?.join(', ') || 'Unknown Author';
  const description = volumeInfo.description || 'No description available.';
  const thumbnail = volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192';
  const openLibraryId = volumeInfo.industryIdentifiers?.find(
    (id) => id.type === 'ISBN_10' || id.type === 'ISBN_13'
  )?.identifier;

  return (
    <div className="book-details">
      <div className="book-header">
        <img src={thumbnail} alt={title} />
        <div className="book-info">
          <h2>{title}</h2>
          <p><strong>Author(s):</strong> {authors}</p>
          <p><strong>Description:</strong> {description.replace(/<[^>]+>/g, '')}</p>
          <button onClick={toggleFavorite}>
            {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          </button>
          {openLibraryId && (
            <a
              href={`https://openlibrary.org/isbn/${openLibraryId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="secondary-link"
            >
              View on Open Library
            </a>
          )}
        </div>
      </div>
      <h3>Read the Book</h3>
      {user ? (
        pdfUrl ? (
          <>
            {!isFreeBook && (
              <div className="pdf-warning">
                <p>
                  A free e-book for "{title}" is not available due to copyright. Try this free classic instead, or explore more below!
                </p>
                <button
                  onClick={() => navigate('/?q=subject:classics')}
                  className="explore-button"
                >
                  Explore Free Classics
                </button>
              </div>
            )}
            <PdfViewer bookId={id} pdfUrl={pdfUrl} />
          </>
        ) : (
          <div className="no-pdf">
            <p>
              Sorry, a free e-book for "{title}" is not available. Try one of these similar titles:
            </p>
            {similarBooks.length > 0 ? (
              <div className="similar-books">
                {similarBooks.map((similarBook) => (
                  <button
                    key={similarBook.id}
                    onClick={() => navigate(`/book/${similarBook.id}`)}
                    className="similar-book-button"
                  >
                    {similarBook.volumeInfo.title}
                  </button>
                ))}
              </div>
            ) : (
              <p>No similar books found. Try searching for another title.</p>
            )}
            <button
              onClick={() => navigate('/?q=subject:classics')}
              className="explore-button"
            >
              Explore Free Classics
            </button>
          </div>
        )
      ) : (
        <div className="login-prompt">
          <p>Please log in to read this book.</p>
          <button onClick={handleReadClick} className="login-button">
            Log In
          </button>
        </div>
      )}
    </div>
  );
}

export default BookDetails;