import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { login } from '../../actions/auth';

const Login = ({ login, isAuthenticated }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const { email, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    login(email, password);
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <section className="container auth-card">
      <h1 className="large text-primary">Connexion</h1>
      <p className="lead">
        <i className="fas fa-user" /> Connectez-vous à votre compte
      </p>
      <form className="form" onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="login-email">Adresse e-mail</label>
          <input
            type="email"
            placeholder="Adresse e-mail"
            id="login-email"
            autoComplete="email"
            name="email"
            value={email}
            onChange={onChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="login-password">Mot de passe</label>
          <input
            type="password"
            placeholder="Mot de passe"
            id="login-password"
            autoComplete="current-password"
            name="password"
            value={password}
            onChange={onChange}
            minLength="6"
          />
        </div>
        <input type="submit" className="btn btn-primary" value="Se connecter" />
      </form>
      <p className="my-1">
        Vous n’avez pas de compte ? <Link to="/register">Inscription</Link>
      </p>
    </section>
  );
};

Login.propTypes = {
  login: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool
};

const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated
});

export default connect(mapStateToProps, { login })(Login);
