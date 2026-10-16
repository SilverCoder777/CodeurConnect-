import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import formatDate from '../../utils/formatDate';
import { deleteComment } from '../../actions/post';
import Avatar from '../layout/Avatar';
import Icon from '../layout/Icon';

const CommentItem = ({ postId, comment: { _id, text, name, avatar, user, date }, auth, deleteComment }) => (
  <article className="post comment-card">
    <header className="post-header">
      <Link to={`/profile/${user}`} aria-label={`Voir le profil de ${name}`}><Avatar src={avatar} name={name} /></Link>
      <div>
        <Link className="post-author" to={`/profile/${user}`}>{name}</Link>
        <p className="post-date">Publié le {formatDate(date)}</p>
      </div>
      {!auth.loading && user === auth.user?._id && <button onClick={() => deleteComment(postId, _id)} aria-label="Supprimer le commentaire" type="button" className="btn btn-danger"><Icon name="close" size={17} /></button>}
    </header>
    <p className="post-text">{text}</p>
  </article>
);

export default connect((state) => ({ auth: state.auth }), { deleteComment })(CommentItem);
