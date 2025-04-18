import { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import BookCard from '../components/BookCard';
import './Home.css';

function Home() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCuratedBooks() {
      try {
        // Fetch popular novels or trending books
        const response = await fetch(
          'https://www.googleapis.com/books/v1/volumes?q=subject:novels+fiction&maxResults=12&orderBy=relevance'
        );
        const data = await response.json();
        setBooks(data.items || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching curated books:', error);
        setLoading(false);
      }
    }
    fetchCuratedBooks();
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
      <h1>Welcome to E-Library</h1>
      <SearchBar onSearch={handleSearch} />
      <h2>Explore Popular Novels</h2>
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