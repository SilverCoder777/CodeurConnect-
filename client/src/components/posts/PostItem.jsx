import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import formatDate from '../../utils/formatDate';
import { addLike, removeLike, deletePost } from '../../actions/post';
import Avatar from '../layout/Avatar';
import Icon from '../layout/Icon';

const PostItem = ({ addLike, removeLike, deletePost, auth, post }) => {
  const { _id, text, name, avatar, user, likes, comments, date } = post;
  const liked = likes.some((like) => like.user === auth.user?._id);
  return (
    <article className="post">
      <header className="post-header">
        <Link to={`/profile/${user}`} aria-label={`Voir le profil de ${name}`}><Avatar src={avatar} name={name} /></Link>
        <div>
          <Link className="post-author" to={`/profile/${user}`}>{name}</Link>
          <p className="post-role">Membre de la communauté DevConnector</p>
          <p className="post-date">Publié le {formatDate(date)}</p>
        </div>
      </header>
      <p className="post-text">{text}</p>
      <div className="post-actions">
        <button className={`btn ${liked ? 'is-liked' : ''}`} type="button" aria-pressed={liked}
          aria-label={liked ? 'Retirer la mention J’aime' : 'J’aime cette publication'}
          onClick={() => liked ? removeLike(_id) : addLike(_id)}>
          <Icon name="like" size={20} /> J’aime {likes.length > 0 && <span>{likes.length}</span>}
        </button>
        <Link to={`/posts/${_id}`} className="btn"><Icon name="chat" size={20} /> Discussion {comments.length > 0 && <span className="comment-count">{comments.length}</span>}</Link>
        {!auth.loading && user === auth.user?._id && <button onClick={() => deletePost(_id)} aria-label="Supprimer la publication" type="button" className="btn delete-post"><Icon name="close" size={19} /></button>}
      </div>
    </article>
  );
};

export default connect((state) => ({ auth: state.auth }), { addLike, removeLike, deletePost })(PostItem);
