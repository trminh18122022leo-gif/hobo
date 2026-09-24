const fs = require('fs');
const csvPath = 'C:\\Users\\Admin\\Documents\\Default Project\\admission_internship_scholarship_websites.csv';
const content = fs.readFileSync(csvPath, 'utf-8');

function parseCSV(text) {
  const p = [];
  let row = [''];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i+1];
    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push('');
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      p.push(row);
      row = [''];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== '') p.push(row);
  return p;
}

const rows = parseCSV(content);
console.log('Total parsed rows:', rows.length);

const header = rows[0];
console.log('Header:', header);

const categories = new Set();
const countries = new Set();
const websites = [];

for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  if (r.length >= 4 && r[2] && r[3]) {
    const country = r[0].trim();
    const category = r[1].trim();
    const name = r[2].trim();
    let url = r[3].trim();
    // remove trailing slash if needed or keep standard
    const features = r[4] ? r[4].trim() : '';
    const language = r[5] ? r[5].trim() : '';
    const appFee = r[6] ? r[6].trim() : '';
    const deadline = r[7] ? r[7].trim() : '';
    const notes = r[8] ? r[8].trim() : '';

    countries.add(country);
    categories.add(category);
    websites.push({
      country,
      category,
      name,
      url,
      features,
      language,
      appFee,
      deadline,
      notes
    });
  }
}

console.log('Valid websites:', websites.length);
console.log('Categories:', Array.from(categories));
console.log('Countries (' + countries.size + '):', Array.from(countries));
console.log('Sample 3 items:', JSON.stringify(websites.slice(0, 3), null, 2));
