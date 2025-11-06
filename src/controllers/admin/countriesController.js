// Lista de países con sus banderas
const countries = [
  { name: "Argentina", flag: "https://flagcdn.com/ar.svg" },
  { name: "Brasil", flag: "https://flagcdn.com/br.svg" },
  { name: "Chile", flag: "https://flagcdn.com/cl.svg" },
  { name: "Colombia", flag: "https://flagcdn.com/co.svg" },
  { name: "Uruguay", flag: "https://flagcdn.com/uy.svg" },
  { name: "Paraguay", flag: "https://flagcdn.com/py.svg" },
  { name: "Perú", flag: "https://flagcdn.com/pe.svg" },
  { name: "Ecuador", flag: "https://flagcdn.com/ec.svg" },
  { name: "Bolivia", flag: "https://flagcdn.com/bo.svg" },
  { name: "Venezuela", flag: "https://flagcdn.com/ve.svg" },
  { name: "México", flag: "https://flagcdn.com/mx.svg" },
  { name: "España", flag: "https://flagcdn.com/es.svg" },
  { name: "Italia", flag: "https://flagcdn.com/it.svg" },
  { name: "Francia", flag: "https://flagcdn.com/fr.svg" },
  { name: "Alemania", flag: "https://flagcdn.com/de.svg" },
  { name: "Inglaterra", flag: "https://flagcdn.com/gb-eng.svg" },
  { name: "Portugal", flag: "https://flagcdn.com/pt.svg" },
  { name: "Países Bajos", flag: "https://flagcdn.com/nl.svg" },
  { name: "Eslovenia", flag: "https://flagcdn.com/si.svg" },
];

// Get all countries
export const getAllCountries = (req, res) => {
  res.json(countries);
};
