/**
 * Datos completos de las 48 selecciones del Mundial 2026
 * flag: emoji (fallback), code: FIFA, iso: código ISO 3166-1 alpha-2 para flagcdn.com
 */
export const TEAMS = {
  'México':              { flag: '🇲🇽', code: 'MEX', iso: 'mx', primary: '#006847', secondary: '#CE1126' },
  'Sudáfrica':           { flag: '🇿🇦', code: 'RSA', iso: 'za', primary: '#007A4D', secondary: '#FFB612' },
  'Corea del Sur':       { flag: '🇰🇷', code: 'KOR', iso: 'kr', primary: '#CD2E3A', secondary: '#003478' },
  'República Checa':     { flag: '🇨🇿', code: 'CZE', iso: 'cz', primary: '#D7141A', secondary: '#11457E' },
  'Canadá':              { flag: '🇨🇦', code: 'CAN', iso: 'ca', primary: '#FF0000', secondary: '#FFFFFF' },
  'Bosnia y Herzegovina':{ flag: '🇧🇦', code: 'BIH', iso: 'ba', primary: '#002395', secondary: '#FFCD00' },
  'Catar':               { flag: '🇶🇦', code: 'QAT', iso: 'qa', primary: '#8D1B3D', secondary: '#FFFFFF' },
  'Suiza':               { flag: '🇨🇭', code: 'SUI', iso: 'ch', primary: '#FF0000', secondary: '#FFFFFF' },
  'Brasil':              { flag: '🇧🇷', code: 'BRA', iso: 'br', primary: '#009C3B', secondary: '#FFDF00' },
  'Marruecos':           { flag: '🇲🇦', code: 'MAR', iso: 'ma', primary: '#C1272D', secondary: '#006233' },
  'Haití':               { flag: '🇭🇹', code: 'HAI', iso: 'ht', primary: '#00209F', secondary: '#D21034' },
  'Escocia':             { flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', code: 'SCO', iso: 'gb-sct', primary: '#003F87', secondary: '#FFFFFF' },
  'Estados Unidos':      { flag: '🇺🇸', code: 'USA', iso: 'us', primary: '#002868', secondary: '#BF0A30' },
  'Paraguay':            { flag: '🇵🇾', code: 'PAR', iso: 'py', primary: '#D52B1E', secondary: '#FFFFFF' },
  'Australia':           { flag: '🇦🇺', code: 'AUS', iso: 'au', primary: '#00843D', secondary: '#FFD700' },
  'Turquía':             { flag: '🇹🇷', code: 'TUR', iso: 'tr', primary: '#E30A17', secondary: '#FFFFFF' },
  'Alemania':            { flag: '🇩🇪', code: 'GER', iso: 'de', primary: '#000000', secondary: '#DD0000' },
  'Curazao':             { flag: '🇨🇼', code: 'CUW', iso: 'cw', primary: '#002B7F', secondary: '#F9E300' },
  'Costa de Marfil':     { flag: '🇨🇮', code: 'CIV', iso: 'ci', primary: '#F77F00', secondary: '#009A44' },
  'Ecuador':             { flag: '🇪🇨', code: 'ECU', iso: 'ec', primary: '#FFD100', secondary: '#003DA5' },
  'Países Bajos':        { flag: '🇳🇱', code: 'NED', iso: 'nl', primary: '#FF4F00', secondary: '#FFFFFF' },
  'Japón':               { flag: '🇯🇵', code: 'JPN', iso: 'jp', primary: '#003087', secondary: '#FFFFFF' },
  'Suecia':              { flag: '🇸🇪', code: 'SWE', iso: 'se', primary: '#006AA7', secondary: '#FECC02' },
  'Túnez':               { flag: '🇹🇳', code: 'TUN', iso: 'tn', primary: '#E70013', secondary: '#FFFFFF' },
  'Bélgica':             { flag: '🇧🇪', code: 'BEL', iso: 'be', primary: '#ED2939', secondary: '#000000' },
  'Egipto':              { flag: '🇪🇬', code: 'EGY', iso: 'eg', primary: '#CC1A2B', secondary: '#FFFFFF' },
  'Irán':                { flag: '🇮🇷', code: 'IRN', iso: 'ir', primary: '#239F40', secondary: '#FFFFFF' },
  'Nueva Zelanda':       { flag: '🇳🇿', code: 'NZL', iso: 'nz', primary: '#00247D', secondary: '#CC142B' },
  'España':              { flag: '🇪🇸', code: 'ESP', iso: 'es', primary: '#AA151B', secondary: '#F1BF00' },
  'Cabo Verde':          { flag: '🇨🇻', code: 'CPV', iso: 'cv', primary: '#003893', secondary: '#CF2027' },
  'Arabia Saudita':      { flag: '🇸🇦', code: 'KSA', iso: 'sa', primary: '#006C35', secondary: '#FFFFFF' },
  'Uruguay':             { flag: '🇺🇾', code: 'URU', iso: 'uy', primary: '#5EB6E4', secondary: '#FFFFFF' },
  'Francia':             { flag: '🇫🇷', code: 'FRA', iso: 'fr', primary: '#002395', secondary: '#ED2939' },
  'Senegal':             { flag: '🇸🇳', code: 'SEN', iso: 'sn', primary: '#00853F', secondary: '#FDEF42' },
  'Irak':                { flag: '🇮🇶', code: 'IRQ', iso: 'iq', primary: '#CE1126', secondary: '#007A3D' },
  'Noruega':             { flag: '🇳🇴', code: 'NOR', iso: 'no', primary: '#EF2B2D', secondary: '#003087' },
  'Argentina':           { flag: '🇦🇷', code: 'ARG', iso: 'ar', primary: '#74ACDF', secondary: '#FFFFFF' },
  'Argelia':             { flag: '🇩🇿', code: 'ALG', iso: 'dz', primary: '#006233', secondary: '#FFFFFF' },
  'Austria':             { flag: '🇦🇹', code: 'AUT', iso: 'at', primary: '#ED2939', secondary: '#FFFFFF' },
  'Jordania':            { flag: '🇯🇴', code: 'JOR', iso: 'jo', primary: '#007A3D', secondary: '#FFFFFF' },
  'Portugal':            { flag: '🇵🇹', code: 'POR', iso: 'pt', primary: '#006600', secondary: '#FF0000' },
  'Rep. Dem. del Congo': { flag: '🇨🇩', code: 'COD', iso: 'cd', primary: '#007FFF', secondary: '#F7D618' },
  'Colombia':            { flag: '🇨🇴', code: 'COL', iso: 'co', primary: '#FCD116', secondary: '#003087' },
  'Uzbekistán':          { flag: '🇺🇿', code: 'UZB', iso: 'uz', primary: '#1EB53A', secondary: '#FFFFFF' },
  'Inglaterra':          { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', code: 'ENG', iso: 'gb-eng', primary: '#FFFFFF', secondary: '#CF142B' },
  'Croacia':             { flag: '🇭🇷', code: 'CRO', iso: 'hr', primary: '#FF0000', secondary: '#FFFFFF' },
  'Ghana':               { flag: '🇬🇭', code: 'GHA', iso: 'gh', primary: '#006B3F', secondary: '#FCD116' },
  'Panamá':              { flag: '🇵🇦', code: 'PAN', iso: 'pa', primary: '#D21034', secondary: '#FFFFFF' },
};

/** URL de la bandera como imagen (flagcdn.com) */
export function getFlagUrl(teamName, size = 'w40') {
  const iso = TEAMS[teamName]?.iso;
  if (!iso) return null;
  return `https://flagcdn.com/${size}/${iso}.png`;
}

export function getFlag(teamName) { return TEAMS[teamName]?.flag ?? '🏳️'; }
export function getPrimaryColor(teamName) { return TEAMS[teamName]?.primary ?? '#475569'; }
export function getSecondaryColor(teamName) { return TEAMS[teamName]?.secondary ?? '#94a3b8'; }
export function getTeam(teamName) {
  return TEAMS[teamName] ?? { flag: '🏳️', code: '???', iso: '', primary: '#475569', secondary: '#94a3b8' };
}

export const GROUPS_DATA = Object.fromEntries(
  Object.entries({
    A: ['México','Sudáfrica','Corea del Sur','República Checa'],
    B: ['Canadá','Bosnia y Herzegovina','Catar','Suiza'],
    C: ['Brasil','Marruecos','Haití','Escocia'],
    D: ['Estados Unidos','Paraguay','Australia','Turquía'],
    E: ['Alemania','Curazao','Costa de Marfil','Ecuador'],
    F: ['Países Bajos','Japón','Suecia','Túnez'],
    G: ['Bélgica','Egipto','Irán','Nueva Zelanda'],
    H: ['España','Cabo Verde','Arabia Saudita','Uruguay'],
    I: ['Francia','Senegal','Irak','Noruega'],
    J: ['Argentina','Argelia','Austria','Jordania'],
    K: ['Portugal','Rep. Dem. del Congo','Colombia','Uzbekistán'],
    L: ['Inglaterra','Croacia','Ghana','Panamá'],
  }).map(([letter, names]) => [
    letter,
    names.map(name => ({ name, ...getTeam(name) })),
  ])
);

export const ALL_TEAMS = Object.values(GROUPS_DATA).flat();
