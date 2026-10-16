import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { formatProfileStatus } from '../../utils/profileStatus';
import Spinner from '../layout/Spinner';
import ProfileItem from './ProfileItem';
import { getProfiles } from '../../actions/profile';

const Profiles = ({ getProfiles, profile: { profiles, loading } }) => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q')?.trim() || '';
  const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
  const visibleProfiles = profiles.filter((profile) => normalize([profile.user?.name, profile.company, profile.location, formatProfileStatus(profile.status), ...(profile.skills || [])].join(' ')).includes(normalize(query)));
  useEffect(() => {
    getProfiles();
  }, [getProfiles]);

  return (
    <section className="container">
      {loading ? (
        <Spinner />
      ) : (
        <Fragment>
          <h1 className="large text-primary">Développeurs</h1>
          <p className="lead">
            <i className="fab fa-connectdevelop" /> Découvrez les profils et échangez avec
            les développeurs
          </p>
          {query && <p className="search-summary" role="status">{visibleProfiles.length} résultat{visibleProfiles.length > 1 ? 's' : ''} pour « {query} »</p>}
          <div className="profiles">
            {visibleProfiles.length > 0 ? (
              visibleProfiles.map((profile) => (
                <ProfileItem key={profile._id} profile={profile} />
              ))
            ) : (
              <h4>Aucun profil trouvé…</h4>
            )}
          </div>
        </Fragment>
      )}
    </section>
  );
};

Profiles.propTypes = {
  getProfiles: PropTypes.func.isRequired,
  profile: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  profile: state.profile
});

export default connect(mapStateToProps, { getProfiles })(Profiles);
