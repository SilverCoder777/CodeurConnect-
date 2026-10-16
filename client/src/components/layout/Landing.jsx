import { Link, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Icon from './Icon';

export default function Landing() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  if (isAuthenticated) return <Navigate to="/dashboard" />;
  return (
    <section className="landing">
      <div className="landing-copy">
        <span className="eyebrow">VOTRE PROCHAINE RENCONTRE COMMENCE ICI</span>
        <h1>Le réseau des développeurs</h1>
        <p>Des idées à partager. Des parcours à découvrir. Des liens qui font la différence.</p>
        <div className="landing-actions">
          <Link to="/register" className="btn btn-primary">Inscription <Icon name="arrow" size={19} /></Link>
          <Link to="/login" className="btn btn-outline">Se connecter</Link>
        </div>
        <p className="landing-note">Un espace pour apprendre, échanger et avancer ensemble.</p>
      </div>
      <div className="landing-visual" aria-hidden="true">
        <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
        <div className="visual-code"><Icon name="code" size={58} /><span>Les idées prennent vie<br />quand on les partage.</span></div>
        <div className="visual-note note-top"><span className="visual-icon"><Icon name="users" /></span><div><strong>Un réseau qui vous ressemble</strong><span>Des développeurs, comme vous.</span></div></div>
        <div className="visual-note note-bottom"><span className="visual-icon"><Icon name="chat" /></span><div><strong>Une conversation peut tout changer</strong><span>Faites le premier pas.</span></div></div>
        <span className="visual-dot dot-one" /><span className="visual-dot dot-two" />
      </div>
      <div className="landing-features">
        <div><Icon name="user" /><span><strong>Votre savoir-faire, à votre image</strong>Valorisez votre parcours et vos compétences.</span></div>
        <div><Icon name="users" /><span><strong>De nouvelles perspectives</strong>Rencontrez une communauté qui partage vos intérêts.</span></div>
        <div><Icon name="chat" /><span><strong>Le plaisir d’échanger</strong>Partagez vos idées et apprenez des autres.</span></div>
      </div>
    </section>
  );
}
