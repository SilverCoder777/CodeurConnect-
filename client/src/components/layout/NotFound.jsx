import React from 'react';

const NotFound = () => {
  return (
    <section className="container">
      <h1 className="x-large text-primary">
        <i className="fas fa-exclamation-triangle" /> Page introuvable
      </h1>
      <p className="large">Cette page n’existe pas.</p>
    </section>
  );
};

export default NotFound;
