import { COUNTRIES } from '../data/referenceData';
import { NewsItem, StudentProfile } from '../types';

const normalize = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const isEuropean = (profile: StudentProfile) =>
  profile.visaType === 'Passeport européen / citoyen UE'
  || COUNTRIES.some(country => country.name === profile.nationality && country.isEU);

const profileRelevance = (item: NewsItem, profile: StudentProfile) => {
  const status = profile.studentStatus;
  const goals = profile.employmentGoals || [];
  const text = normalize(`${item.title} ${item.summary}`);
  let score = 0;

  if (item.applicableStatuses?.length && !item.applicableStatuses.includes(status)) return null;
  if (
    item.applicableNationalities?.length
    && !item.applicableNationalities.some(nationality => normalize(nationality) === normalize(profile.nationality))
  ) return null;
  if (item.category === 'titre_de_sejour' && isEuropean(profile)) return null;

  if (profile.city && text.includes(normalize(profile.city))) score += 5;
  if (profile.nationality && text.includes(normalize(profile.nationality))) score += 4;

  switch (item.category) {
    case 'titre_de_sejour':
      score += profile.visaType && profile.visaType !== 'Je ne sais pas' ? 4 : 2;
      break;
    case 'travail':
      score += goals.some(goal => ['job_etudiant', 'alternance', 'cdi', 'cdd'].includes(goal))
        || status === 'job_hunting'
        ? 4
        : 1;
      break;
    case 'caf':
    case 'logement':
      score += profile.housingStatus || profile.city ? 4 : 1;
      break;
    case 'sante':
      score += profile.healthInsuranceStatus ? 3 : 1;
      break;
    case 'etudes':
      score += profile.school || profile.studyLevel !== 'Autre' || profile.studyYear ? 3 : 1;
      break;
    default:
      score += 1;
  }
  return score;
};

export const rankNewsForProfile = (items: NewsItem[], profile: StudentProfile) =>
  items
    .map(item => ({ item, relevance: profileRelevance(item, profile) }))
    .filter((entry): entry is { item: NewsItem; relevance: number } => entry.relevance !== null)
    .sort((left, right) =>
      right.relevance - left.relevance || Date.parse(right.item.date) - Date.parse(left.item.date),
    )
    .map(entry => entry.item);
