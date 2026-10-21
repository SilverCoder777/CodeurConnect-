import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../actions/auth';
import Avatar from './Avatar';
import Icon from './Icon';

export default function Navbar() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const search = (event) => {
    event.preventDefault();
    navigate(`/profiles${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`);
  };
  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">Aller au contenu principal</a>
      <nav className={`navbar ${isAuthenticated ? 'navbar-authenticated' : ''}`} aria-label="Navigation principale">
        <Link to={isAuthenticated ? '/posts' : '/'} className="brand" aria-label="DevConnector — Accueil">
          <span className="brand-mark"><Icon name="code" size={27} /></span>
          <span className="brand-name">Dev<span>Connector</span></span>
        </Link>
        <form className="nav-search" role="search" onSubmit={search}>
          <Icon name="search" size={18} />
          <input type="search" aria-label="Rechercher des développeurs" placeholder="Rechercher" value={query} onChange={(event) => setQuery(event.target.value)} />
        </form>
        <ul className="nav-links">
          {isAuthenticated && <li><NavLink to="/posts"><Icon name="home" /><span>Publications</span></NavLink></li>}
          <li><NavLink to="/profiles"><Icon name="users" /><span>Développeurs</span></NavLink></li>
          {isAuthenticated ? <>
            <li><NavLink to="/snake"><Icon name="game" /><span>Serpent</span></NavLink></li>
            <li><NavLink to="/tetris"><Icon name="blocks" /><span>Tetris</span></NavLink></li>
            <li><NavLink to="/dashboard" aria-label="Tableau de bord"><Avatar src={user?.avatar} name={user?.name} /><span>Vous</span></NavLink></li>
            <li className="nav-divider"><button type="button" onClick={() => dispatch(logout())}><Icon name="logout" /><span>Se déconnecter</span></button></li>
          </> : <>
            <li><NavLink className="nav-register" to="/register">S’inscrire</NavLink></li>
            <li><NavLink className="nav-login" to="/login">Se connecter</NavLink></li>
          </>}
        </ul>
      </nav>
    </header>
  );
}
