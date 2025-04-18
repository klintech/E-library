import { Link } from 'react-router-dom';
import './BookCard.css';

function BookCard({ book }) {
  const { volumeInfo } = book;
  const title = volumeInfo.title || 'No Title';
  const authors = volumeInfo.authors?.join(', ') || 'Unknown Author';
  const thumbnail = volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192';

  return (
    <Link to={`/book/${book.id}`} className="book-card">
      <img src={thumbnail} alt={title} />
      <div className="book-info">
        <h3>{title}</h3>
        <p>{authors}</p>
      </div>
    </Link>
  );
}

export default BookCard;