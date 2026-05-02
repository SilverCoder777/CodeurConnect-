import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import formatDate from '../../utils/formatDate';
import { deleteComment, updateComment } from '../../actions/post';

const CommentItem = ({
  postId,
  comment: { _id, text, name, avatar, user, date },
  auth,
  deleteComment,
  updateComment
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text);

  const handleUpdate = (e) => {
    e.preventDefault();
    if (editText.trim()) {
      updateComment(postId, _id, { text: editText });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
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
          <form onSubmit={handleUpdate} className="form my-1">
            <textarea
              name="text"
              cols="30"
              rows="5"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              required
            />
            <div className="edit-actions">
              <button type="submit" className="btn btn-dark">
                Save
              </button>
              <button
                type="button"
                className="btn btn-light"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="my-1">{text}</p>
            <p className="post-date">Posted on {formatDate(date)}</p>
            {!auth.loading && user === auth.user._id && (
              <div className="comment-actions" style={{ display: 'inline-block' }}>
                <button
                  onClick={() => setIsEditing(true)}
                  type="button"
                  className="btn btn-light"
                  style={{ marginRight: '0.5rem' }}
                >
                  <i className="fas fa-edit" /> Edit
                </button>
                <button
                  onClick={() => deleteComment(postId, _id)}
                  type="button"
                  className="btn btn-danger"
                >
                  <i className="fas fa-times" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

CommentItem.propTypes = {
  postId: PropTypes.string.isRequired,
  comment: PropTypes.object.isRequired,
  auth: PropTypes.object.isRequired,
  deleteComment: PropTypes.func.isRequired,
  updateComment: PropTypes.func.isRequired
};

const mapStateToProps = (state) => ({
  auth: state.auth
});

export default connect(mapStateToProps, { deleteComment, updateComment })(
  CommentItem
);
