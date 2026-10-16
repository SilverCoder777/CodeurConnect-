import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import PostItem from './PostItem';
import PostForm from './PostForm';
import { getPosts } from '../../actions/post';

const Posts = ({ getPosts, post: { posts } }) => {
  useEffect(() => {
    getPosts();
  }, [getPosts]);

  return (
    <section className="container feed-page">
      <h1 className="large text-primary">Publications</h1>
      <p className="lead">
        <i className="fas fa-user" /> Bienvenue dans la communauté
      </p>
      <PostForm />
      {posts.length === 0 && <div className="card empty-state"><h2>La conversation commence avec vous</h2><p>Partagez une idée, une question ou une découverte avec la communauté.</p></div>}
      <div className="posts">
        {posts.map((post) => (
          <PostItem key={post._id} post={post} />
        ))}
      </div>
    </section>
  );
};

Posts.propTypes = {
  getPosts: PropTypes.func.isRequired,
  post: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  post: state.post
});

export default connect(mapStateToProps, { getPosts })(Posts);
