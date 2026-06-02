import express from 'express';
import Match from '../models/Match.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Datos completos de los 48 equipos del Mundial 2026
// primary/secondary: colores oficiales de la selección
export const WORLD_CUP_2026_GROUPS = {
  A: [
    { name: 'México',           flag: '🇲🇽', code: 'MEX', primary: '#006847', secondary: '#CE1126' },
    { name: 'Sudáfrica',        flag: '🇿🇦', code: 'RSA', primary: '#007A4D', secondary: '#FFB612' },
    { name: 'Corea del Sur',    flag: '🇰🇷', code: 'KOR', primary: '#CD2E3A', secondary: '#003478' },
    { name: 'República Checa',  flag: '🇨🇿', code: 'CZE', primary: '#D7141A', secondary: '#11457E' },
  ],
  B: [
    { name: 'Canadá',               flag: '🇨🇦', code: 'CAN', primary: '#FF0000', secondary: '#FFFFFF' },
    { name: 'Bosnia y Herzegovina', flag: '🇧🇦', code: 'BIH', primary: '#002395', secondary: '#FFCD00' },
    { name: 'Catar',                flag: '🇶🇦', code: 'QAT', primary: '#8D1B3D', secondary: '#FFFFFF' },
    { name: 'Suiza',                flag: '🇨🇭', code: 'SUI', primary: '#FF0000', secondary: '#FFFFFF' },
  ],
  C: [
    { name: 'Brasil',    flag: '🇧🇷', code: 'BRA', primary: '#009C3B', secondary: '#FFDF00' },
    { name: 'Marruecos', flag: '🇲🇦', code: 'MAR', primary: '#C1272D', secondary: '#006233' },
    { name: 'Haití',     flag: '🇭🇹', code: 'HAI', primary: '#00209F', secondary: '#D21034' },
    { name: 'Escocia',   flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', code: 'SCO', primary: '#003F87', secondary: '#FFFFFF' },
  ],
  D: [
    { name: 'Estados Unidos', flag: '🇺🇸', code: 'USA', primary: '#002868', secondary: '#BF0A30' },
    { name: 'Paraguay',       flag: '🇵🇾', code: 'PAR', primary: '#D52B1E', secondary: '#FFFFFF' },
    { name: 'Australia',      flag: '🇦🇺', code: 'AUS', primary: '#00843D', secondary: '#FFD700' },
    { name: 'Turquía',        flag: '🇹🇷', code: 'TUR', primary: '#E30A17', secondary: '#FFFFFF' },
  ],
  E: [
    { name: 'Alemania',         flag: '🇩🇪', code: 'GER', primary: '#000000', secondary: '#DD0000' },
    { name: 'Curazao',          flag: '🇨🇼', code: 'CUW', primary: '#002B7F', secondary: '#F9E300' },
    { name: 'Costa de Marfil',  flag: '🇨🇮', code: 'CIV', primary: '#F77F00', secondary: '#009A44' },
    { name: 'Ecuador',          flag: '🇪🇨', code: 'ECU', primary: '#FFD100', secondary: '#003DA5' },
  ],
  F: [
    { name: 'Países Bajos', flag: '🇳🇱', code: 'NED', primary: '#FF4F00', secondary: '#FFFFFF' },
    { name: 'Japón',        flag: '🇯🇵', code: 'JPN', primary: '#003087', secondary: '#FFFFFF' },
    { name: 'Suecia',       flag: '🇸🇪', code: 'SWE', primary: '#006AA7', secondary: '#FECC02' },
    { name: 'Túnez',        flag: '🇹🇳', code: 'TUN', primary: '#E70013', secondary: '#FFFFFF' },
  ],
  G: [
    { name: 'Bélgica',       flag: '🇧🇪', code: 'BEL', primary: '#ED2939', secondary: '#000000' },
    { name: 'Egipto',        flag: '🇪🇬', code: 'EGY', primary: '#CC1A2B', secondary: '#FFFFFF' },
    { name: 'Irán',          flag: '🇮🇷', code: 'IRN', primary: '#239F40', secondary: '#FFFFFF' },
    { name: 'Nueva Zelanda', flag: '🇳🇿', code: 'NZL', primary: '#00247D', secondary: '#CC142B' },
  ],
  H: [
    { name: 'España',        flag: '🇪🇸', code: 'ESP', primary: '#AA151B', secondary: '#F1BF00' },
    { name: 'Cabo Verde',    flag: '🇨🇻', code: 'CPV', primary: '#003893', secondary: '#CF2027' },
    { name: 'Arabia Saudita',flag: '🇸🇦', code: 'KSA', primary: '#006C35', secondary: '#FFFFFF' },
    { name: 'Uruguay',       flag: '🇺🇾', code: 'URU', primary: '#5EB6E4', secondary: '#FFFFFF' },
  ],
  I: [
    { name: 'Francia',  flag: '🇫🇷', code: 'FRA', primary: '#002395', secondary: '#ED2939' },
    { name: 'Senegal',  flag: '🇸🇳', code: 'SEN', primary: '#00853F', secondary: '#FDEF42' },
    { name: 'Irak',     flag: '🇮🇶', code: 'IRQ', primary: '#CE1126', secondary: '#007A3D' },
    { name: 'Noruega',  flag: '🇳🇴', code: 'NOR', primary: '#EF2B2D', secondary: '#003087' },
  ],
  J: [
    { name: 'Argentina', flag: '🇦🇷', code: 'ARG', primary: '#74ACDF', secondary: '#FFFFFF' },
    { name: 'Argelia',   flag: '🇩🇿', code: 'ALG', primary: '#006233', secondary: '#FFFFFF' },
    { name: 'Austria',   flag: '🇦🇹', code: 'AUT', primary: '#ED2939', secondary: '#FFFFFF' },
    { name: 'Jordania',  flag: '🇯🇴', code: 'JOR', primary: '#007A3D', secondary: '#FFFFFF' },
  ],
  K: [
    { name: 'Portugal',            flag: '🇵🇹', code: 'POR', primary: '#006600', secondary: '#FF0000' },
    { name: 'Rep. Dem. del Congo', flag: '🇨🇩', code: 'COD', primary: '#007FFF', secondary: '#F7D618' },
    { name: 'Colombia',            flag: '🇨🇴', code: 'COL', primary: '#FCD116', secondary: '#003087' },
    { name: 'Uzbekistán',          flag: '🇺🇿', code: 'UZB', primary: '#1EB53A', secondary: '#FFFFFF' },
  ],
  L: [
    { name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', code: 'ENG', primary: '#FFFFFF', secondary: '#CF142B' },
    { name: 'Croacia',    flag: '🇭🇷', code: 'CRO', primary: '#FF0000', secondary: '#FFFFFF' },
    { name: 'Ghana',      flag: '🇬🇭', code: 'GHA', primary: '#006B3F', secondary: '#FCD116' },
    { name: 'Panamá',     flag: '🇵🇦', code: 'PAN', primary: '#D21034', secondary: '#FFFFFF' },
  ],
};

// GET /api/groups — devuelve los grupos con resultados si existen
router.get('/', protect, async (req, res) => {
  try {
    const { GroupResult } = await import('../models/GroupResult.js');
    const results = await GroupResult.find();
    const resultMap = {};
    results.forEach(r => { resultMap[r.group] = r; });

    const groups = Object.entries(WORLD_CUP_2026_GROUPS).map(([letter, teams]) => ({
      letter,
      teams,
      result: resultMap[letter] || null,
    }));

    res.json({ groups });
  } catch (err) {
    // Si no existe el modelo aún, devolver solo los grupos
    const groups = Object.entries(WORLD_CUP_2026_GROUPS).map(([letter, teams]) => ({
      letter, teams, result: null,
    }));
    res.json({ groups });
  }
});

// GET /api/groups/teams — lista plana de todos los equipos (para SpecialPage)
router.get('/teams', protect, (req, res) => {
  const teams = Object.values(WORLD_CUP_2026_GROUPS).flat();
  res.json({ teams });
});

export default router;
