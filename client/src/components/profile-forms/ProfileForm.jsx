import React, { Fragment, useState, useEffect } from 'react';
import { Link, useMatch, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createProfile, getCurrentProfile } from '../../actions/profile';
import { professionalStatuses } from '../../utils/profileStatus';

/*
  NOTE: declare initialState outside of component
  so that it doesn't trigger a useEffect
  we can then safely use this to construct our profileData
 */
const initialState = {
  company: '',
  website: '',
  location: '',
  status: '',
  skills: '',
  githubusername: '',
  bio: '',
  twitter: '',
  facebook: '',
  linkedin: '',
  youtube: '',
  instagram: ''
};

const ProfileForm = ({
  profile: { profile, loading },
  createProfile,
  getCurrentProfile
}) => {
  const [formData, setFormData] = useState(initialState);

  const creatingProfile = useMatch('/create-profile');

  const [displaySocialInputs, toggleSocialInputs] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // if there is no profile, attempt to fetch one
    if (!profile) getCurrentProfile();

    // if we finished loading and we do have a profile
    // then build our profileData
    if (!loading && profile) {
      const profileData = { ...initialState };
      for (const key in profile) {
        if (key in profileData) profileData[key] = profile[key];
      }
      for (const key in profile.social) {
        if (key in profileData) profileData[key] = profile.social[key];
      }
      // the skills may be an array from our API response
      if (Array.isArray(profileData.skills))
        profileData.skills = profileData.skills.join(', ');
      // set local state with the profileData
      setFormData(profileData);
    }
  }, [loading, getCurrentProfile, profile]);

  const {
    company,
    website,
    location,
    status,
    skills,
    githubusername,
    bio,
    twitter,
    facebook,
    linkedin,
    youtube,
    instagram
  } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    const editing = profile ? true : false;
    e.preventDefault();
    createProfile(formData, editing).then(() => {
      if (!editing) navigate('/dashboard');
    });
  };

  return (
    <section className="container editor-card">
      <h1 className="large text-primary">
        {creatingProfile ? 'Créer votre profil' : 'Modifier votre profil'}
      </h1>
      <p className="lead">
        <i className="fas fa-user" />
        {creatingProfile
          ? ` Renseignez les informations de votre profil`
          : ' Mettez à jour les informations de votre profil'}
      </p>
      <small>* = champ obligatoire</small>
      <form className="form" onSubmit={onSubmit}>
        <div className="form-group">
          <select name="status" value={status} onChange={onChange}>
            <option value="">* Sélectionnez votre statut professionnel</option>
            {Object.entries(professionalStatuses).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <small className="form-text">
            Indiquez votre situation professionnelle actuelle
          </small>
        </div>
        <div className="form-group">
          <input
            type="text"
            placeholder="Entreprise"
            name="company"
            value={company}
            onChange={onChange}
          />
          <small className="form-text">
            Votre entreprise ou celle pour laquelle vous travaillez
          </small>
        </div>
        <div className="form-group">
          <input
            type="text"
            placeholder="Site web"
            name="website"
            value={website}
            onChange={onChange}
          />
          <small className="form-text">
            Votre site personnel ou celui de votre entreprise
          </small>
        </div>
        <div className="form-group">
          <input
            type="text"
            placeholder="Localisation"
            name="location"
            value={location}
            onChange={onChange}
          />
          <small className="form-text">
            Indiquez votre ville et votre région (ex. : Lyon, Auvergne-Rhône-Alpes)
          </small>
        </div>
        <div className="form-group">
          <input
            type="text"
            placeholder="* Compétences"
            name="skills"
            value={skills}
            onChange={onChange}
          />
          <small className="form-text">
            Séparez les compétences par des virgules (ex. : HTML, CSS, JavaScript, PHP)
          </small>
        </div>
        <div className="form-group">
          <input
            type="text"
            placeholder="Nom d’utilisateur GitHub"
            name="githubusername"
            value={githubusername}
            onChange={onChange}
          />
          <small className="form-text">
            Indiquez votre nom d’utilisateur GitHub pour afficher vos derniers dépôts
            et un lien vers votre profil
          </small>
        </div>
        <div className="form-group">
          <textarea
            placeholder="Une courte présentation de vous"
            name="bio"
            value={bio}
            onChange={onChange}
          />
          <small className="form-text">Présentez-vous en quelques mots</small>
        </div>

        <div className="my-2">
          <button
            onClick={() => toggleSocialInputs(!displaySocialInputs)}
            type="button"
            className="btn btn-light"
          >
            Ajouter des liens vers vos réseaux sociaux
          </button>
          <span>Facultatif</span>
        </div>

        {displaySocialInputs && (
          <Fragment>
            <div className="form-group social-input">
              <i className="fab fa-twitter fa-2x" />
              <input
                type="text"
                placeholder="Lien Twitter"
                name="twitter"
                value={twitter}
                onChange={onChange}
              />
            </div>

            <div className="form-group social-input">
              <i className="fab fa-facebook fa-2x" />
              <input
                type="text"
                placeholder="Lien Facebook"
                name="facebook"
                value={facebook}
                onChange={onChange}
              />
            </div>

            <div className="form-group social-input">
              <i className="fab fa-youtube fa-2x" />
              <input
                type="text"
                placeholder="Lien YouTube"
                name="youtube"
                value={youtube}
                onChange={onChange}
              />
            </div>

            <div className="form-group social-input">
              <i className="fab fa-linkedin fa-2x" />
              <input
                type="text"
                placeholder="Lien LinkedIn"
                name="linkedin"
                value={linkedin}
                onChange={onChange}
              />
            </div>

            <div className="form-group social-input">
              <i className="fab fa-instagram fa-2x" />
              <input
                type="text"
                placeholder="Lien Instagram"
                name="instagram"
                value={instagram}
                onChange={onChange}
              />
            </div>
          </Fragment>
        )}

        <input type="submit" className="btn btn-primary my-1" value="Enregistrer" />
        <Link className="btn btn-light my-1" to="/dashboard">
          Retour
        </Link>
      </form>
    </section>
  );
};

ProfileForm.propTypes = {
  createProfile: PropTypes.func.isRequired,
  getCurrentProfile: PropTypes.func.isRequired,
  profile: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  profile: state.profile
});

export default connect(mapStateToProps, { createProfile, getCurrentProfile })(
  ProfileForm
);
