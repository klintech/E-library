import { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import BookCard from '../components/BookCard';
import './Home.css';

function Home() {
  const [books, setBooks] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    { title: 'NY Times Bestsellers', query: 'bestsellers', image: 'https://via.placeholder.com/1200x400?text=Bestsellers' },
    { title: 'Classic Literature', query: 'subject:classics', image: 'https://via.placeholder.com/1200x400?text=Classics' },
    { title: 'New Novels', query: 'subject:novels', image: 'https://via.placeholder.com/1200x400?text=Novels' },
  ];

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

  const handleSlideChange = (index) => {
    setCurrentSlide(index);
    handleSearch(slides[index].query);
  };

  return (
    <div className="home">
      <div className="hero">
        <div className="carousel">
          <img src={slides[currentSlide].image} alt={slides[currentSlide].title} />
          <h1>{slides[currentSlide].title}</h1>
          <div className="carousel-controls">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => handleSlideChange(index)}
                className={currentSlide === index ? 'active' : ''}
              />
            ))}
          </div>
        </div>
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