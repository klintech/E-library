import { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import BookCard from '../components/BookCard';
import './Home.css';

function Home() {
  const [books, setBooks] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCuratedBooks() {
      try {
        const response = await fetch(
          'https://www.googleapis.com/books/v1/volumes?q=subject:novels+fiction&maxResults=12&orderBy=relevance'
        );
        const data = await response.json();
        setBooks(data.items || []);
      } catch (error) {
        console.error('Error fetching curated books:', error);
      }
    }

    async function fetchBestsellers() {
      try {
        const response = await fetch(
          'https://api.nytimes.com/svc/books/v3/lists/current/hardcover-fiction.json?api-key=YOUR_API_KEY'
        );
        const data = await response.json();
        const bestsellerBooks = await Promise.all(
          data.results.books.map(async (book) => {
            const googleResponse = await fetch(
              `https://www.googleapis.com/books/v1/volumes?q=isbn:${book.primary_isbn13}`
            );
            const googleData = await googleResponse.json();
            return googleData.items?.[0];
          })
        );
        setBestsellers(bestsellerBooks.filter(Boolean));
      } catch (error) {
        console.error('Error fetching NY Times bestsellers:', error);
      }
      setLoading(false);
    }

    fetchCuratedBooks();
    fetchBestsellers();
  }, []);

  const handleSearch = async (query) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=12`
      );
      const data = await response.json();
      setBooks(data.items || []);
      setLoading(false);
    } catch (error) {
      console.error('Error searching books:', error);
      setLoading(false);
    }
  };

  return (
    <div className="home">
      <div className="hero">
        <h1>Discover Your Next Great Read</h1>
        <p>Explore thousands of books, novels, and more!</p>
        <SearchBar onSearch={handleSearch} />
      </div>
      <h2>NY Times Bestsellers</h2>
      {loading ? (
        <p>Loading...</p>
      ) : bestsellers.length > 0 ? (
        <div className="book-grid">
          {bestsellers.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <p>No bestsellers available. Try searching for a title!</p>
      )}
      <h2>Popular Novels</h2>
      {loading ? (
        <p>Loading...</p>
      ) : books.length > 0 ? (
        <div className="book-grid">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <p>No books found. Try searching for a title!</p>
      )}
    </div>
  );
}

export default Home;