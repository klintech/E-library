import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase'; // Changed from ../../firebase
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      // Fetch favorites
      const favoritesQuery = query(
        collection(db, 'favorites'),
        where('exists', '==', true)
      );
      const favoritesSnap = await getDocs(favoritesQuery);
      const favoriteBooks = [];
      for (const doc of favoritesSnap.docs) {
        if (doc.id.startsWith(user.uid)) {
          const bookId = doc.data().bookId;
          const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes/${bookId}`
          );
          const bookData = await response.json();
          favoriteBooks.push(bookData);
        }
      }
      setFavorites(favoriteBooks);

      // Fetch progress
      const progressQuery = query(collection(db, 'progress'));
      const progressSnap = await getDocs(progressQuery);
      const progressBooks = [];
      for (const doc of progressSnap.docs) {
        if (doc.id.startsWith(user.uid)) {
          const { bookId, page } = doc.data();
          const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes/${bookId}`
          );
          const bookData = await response.json();
          progressBooks.push({ ...bookData, currentPage: page });
        }
      }
      setProgress(progressBooks);

      setLoading(false);
    }
    fetchData();
  }, [user]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="dashboard">
      <h1>Welcome, {user.email}</h1>
      <h2>Your Favorites</h2>
      <div className="book-list">
        {favorites.length ? (
          favorites.map((book) => (
            <Link to={`/book/${book.id}`} key={book.id} className="book-card">
              <img
                src={book.volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192'}
                alt={book.volumeInfo.title}
              />
              <div>
                <h3>{book.volumeInfo.title}</h3>
                <p>{book.volumeInfo.authors?.join(', ') || 'Unknown Author'}</p>
              </div>
            </Link>
          ))
        ) : (
          <p>No favorites yet.</p>
        )}
      </div>
      <h2>Reading Progress</h2>
      <div className="book-list">
        {progress.length ? (
          progress.map((book) => (
            <Link to={`/book/${book.id}`} key={book.id} className="book-card">
              <img
                src={book.volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192'}
                alt={book.volumeInfo.title}
              />
              <div>
                <h3>{book.volumeInfo.title}</h3>
                <p>{book.volumeInfo.authors?.join(', ') || 'Unknown Author'}</p>
                <p>Current Page: {book.currentPage}</p>
              </div>
            </Link>
          ))
        ) : (
          <p>No reading progress yet.</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;