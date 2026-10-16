// Keep stored values stable so existing profiles remain editable.
export const professionalStatuses = {
  Developer: 'Développeur',
  'Junior Developer': 'Développeur junior',
  'Senior Developer': 'Développeur senior',
  Manager: 'Responsable',
  'Student or Learning': 'Étudiant ou en apprentissage',
  Instructor: 'Formateur ou enseignant',
  Intern: 'Stagiaire',
  Other: 'Autre'
};

export const formatProfileStatus = (status) =>
  Object.hasOwn(professionalStatuses, status) ? professionalStatuses[status] : status;
