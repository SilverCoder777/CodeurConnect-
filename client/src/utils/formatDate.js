function formatDate(date) {
  return new Intl.DateTimeFormat('fr-FR').format(new Date(date));
}

export default formatDate;
