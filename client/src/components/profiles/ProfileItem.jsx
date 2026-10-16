import Avatar from '../layout/Avatar';
import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { formatProfileStatus } from '../../utils/profileStatus';

const ProfileItem = ({
  profile: {
    user: { _id, name, avatar },
    status,
    company,
    location,
    skills
  }
}) => {
  return (
    <div className='profile bg-light'>
      <Avatar src={avatar} name={name} className="profile-avatar" />
      <div>
        <h2>{name}</h2>
        <p>
          {formatProfileStatus(status)} {company && <span> chez {company}</span>}
        </p>
        <p className='my-1'>{location && <span>{location}</span>}</p>
        <Link to={`/profile/${_id}`} className='btn btn-primary'>
          Voir le profil
        </Link>
      </div>
      <ul>
        {skills.slice(0, 4).map((skill, index) => (
          <li key={index} className='text-primary'>
            <i className='fas fa-check' /> {skill}
          </li>
        ))}
      </ul>
    </div>
  );
};

ProfileItem.propTypes = {
  profile: PropTypes.object.isRequired
};

export default ProfileItem;
