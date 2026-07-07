import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import formatDate from '../../utils/formatDate';
import { connect } from 'react-redux';
import { addLike, removeLike, deletePost, updatePost } from '../../actions/post';

const PostItem = ({
  addLike,
  removeLike,
  deletePost,
  updatePost,
  auth,
  post: { _id, text, name, avatar, user, likes, comments, date },
  showActions = true
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text);

  const onEditSubmit = (e) => {
    e.preventDefault();
    updatePost(_id, { text: editText });
    setIsEditing(false);
  };

  const onCancelEdit = () => {
    setEditText(text);
    setIsEditing(false);
  };

  return (
    <div className="post bg-white p-1 my-1">
      <div>
        <Link to={`/profile/${user}`}>
          <img className="round-img" src={avatar} alt="" />
          <h4>{name}</h4>
        </Link>
      </div>
      <div>
        {isEditing ? (
          <form className="form my-1" onSubmit={onEditSubmit}>
            <textarea
              name="text"
              cols="30"
              rows="5"
              placeholder="Update your post"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              required
            />
            <input type="submit" className="btn btn-dark my-1" value="Save" />
            <button
              type="button"
              className="btn btn-light my-1"
              onClick={onCancelEdit}
            >
              Cancel
            </button>
          </form>
        ) : (
          <p className="my-1">{text}</p>
        )}
        <p className="post-date">Posted on {formatDate(date)}</p>

        {showActions && (
          <>
            <button
              onClick={() => addLike(_id)}
              type="button"
              className="btn btn-light"
            >
              <i className="fas fa-thumbs-up" />{' '}
              <span>{likes.length > 0 && <span>{likes.length}</span>}</span>
            </button>
            <button
              onClick={() => removeLike(_id)}
              type="button"
              className="btn btn-light"
            >
              <i className="fas fa-thumbs-down" />
            </button>
            <Link to={`/posts/${_id}`} className="btn btn-primary">
              Discussion{' '}
              {comments.length > 0 && (
                <span className="comment-count">{comments.length}</span>
              )}
            </Link>
          </>
        )}
        {!auth.loading && user === auth.user._id && (
          <>
            {!isEditing && (
              <button
                onClick={() => {
                  setEditText(text);
                  setIsEditing(true);
                }}
                type="button"
                className="btn btn-light"
              >
                <i className="fas fa-edit" />
              </button>
            )}
            <button
              onClick={() => deletePost(_id)}
              type="button"
              className="btn btn-danger"
            >
              <i className="fas fa-times" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

PostItem.propTypes = {
  post: PropTypes.object.isRequired,
  auth: PropTypes.object.isRequired,
  addLike: PropTypes.func.isRequired,
  removeLike: PropTypes.func.isRequired,
  deletePost: PropTypes.func.isRequired,
  updatePost: PropTypes.func.isRequired,
  showActions: PropTypes.bool
};

const mapStateToProps = (state) => ({
  auth: state.auth
});

export default connect(mapStateToProps, {
  addLike,
  removeLike,
  deletePost,
  updatePost
})(PostItem);
