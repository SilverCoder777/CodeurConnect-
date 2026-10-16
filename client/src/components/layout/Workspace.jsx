import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import Avatar from './Avatar';
import Icon from './Icon';

export default function Workspace({ children }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { pathname } = useLocation();
  if (['/', '/login', '/register'].includes(pathname)) {
    return <main id="main-content" className="simple-layout">{children}</main>;
  }
  return (
    <main id="main-content" className={`workspace ${isAuthenticated ? 'with-sidebar' : 'public-workspace'}`}>
      {isAuthenticated && <aside className="workspace-left" aria-label="Mon espace professionnel">
        <section className="card identity-card">
          <div className="identity-cover" />
          <Avatar src={user?.avatar} name={user?.name} />
          <h2>{user?.name || 'Mon espace'}</h2>
          <p>Votre place dans la communauté des développeurs.</p>
          <Link to="/dashboard" className="identity-link">Voir mon espace <Icon name="arrow" size={16} /></Link>
        </section>
        <nav className="card side-navigation" aria-label="Raccourcis">
          <Link to="/posts"><Icon name="home" size={19} /> Mon fil d’actualité</Link>
          <Link to="/profiles"><Icon name="users" size={19} /> Mon réseau</Link>
          <Link to="/dashboard"><Icon name="briefcase" size={19} /> Mon parcours</Link>
          <Link to="/snake"><Icon name="game" size={19} /> Une pause jeu</Link>
        </nav>
      </aside>}
      <div className="workspace-content">{children}</div>
      <aside className="workspace-right" aria-label="La communauté">
        <section className="card community-card">
          <span className="eyebrow">LE RÉSEAU DEVCONNECTOR</span>
          <h2>Les bonnes rencontres font avancer.</h2>
          <p>Un projet, une question, une nouvelle perspective : tout commence par un échange.</p>
          <Link to="/profiles" className="text-link">Découvrir les profils <Icon name="arrow" size={17} /></Link>
        </section>
        <section className="card community-card tips-card">
          <Icon name="book" size={26} />
          <h2>Faites vivre votre parcours</h2>
          <p>Partagez vos compétences et vos expériences pour aider les autres à vous découvrir.</p>
          <Link to={isAuthenticated ? '/dashboard' : '/register'} className="text-link">Enrichir mon parcours <Icon name="arrow" size={17} /></Link>
        </section>
        <footer className="workspace-footer">DevConnector · Le réseau des développeurs<br />Apprendre. Échanger. Avancer ensemble.</footer>
      </aside>
    </main>
  );
}
