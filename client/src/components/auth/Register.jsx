import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import { setAlert } from '../../actions/alert';
import { register } from '../../actions/auth';
import PropTypes from 'prop-types';

const Register = ({ setAlert, register, isAuthenticated }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: ''
  });

  const { name, email, password, password2 } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password !== password2) {
      setAlert('Les mots de passe ne correspondent pas', 'danger');
    } else {
      register({ name, email, password });
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <section className="container auth-card">
      <h1 className="large text-primary">Inscription</h1>
      <p className="lead">
        <i className="fas fa-user" /> Créez votre compte
      </p>
      <form className="form" onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="register-name">Nom complet</label>
          <input
            type="text"
            placeholder="Nom"
            id="register-name"
            autoComplete="name"
            name="name"
            value={name}
            onChange={onChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="register-email">Adresse e-mail</label>
          <input
            type="email"
            placeholder="Adresse e-mail"
            id="register-email"
            autoComplete="email"
            name="email"
            value={email}
            onChange={onChange}
          />
          <small className="form-text">
            Pour afficher votre photo de profil, utilisez une adresse e-mail
            associée à un compte Gravatar
          </small>
        </div>
        <div className="form-group">
          <label htmlFor="register-password">Mot de passe</label>
          <input
            type="password"
            placeholder="Mot de passe"
            id="register-password"
            autoComplete="new-password"
            name="password"
            value={password}
            onChange={onChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="register-password2">Confirmer le mot de passe</label>
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            id="register-password2"
            autoComplete="new-password"
            name="password2"
            value={password2}
            onChange={onChange}
          />
        </div>
        <input type="submit" className="btn btn-primary" value="S’inscrire" />
      </form>
      <p className="my-1">
        Vous avez déjà un compte ? <Link to="/login">Connexion</Link>
      </p>
    </section>
  );
};

Register.propTypes = {
  setAlert: PropTypes.func.isRequired,
  register: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool
};

const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated
});

export default connect(mapStateToProps, { setAlert, register })(Register);
