import i18n from 'i18n';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDirectory = path.resolve(__dirname, '../locales');

i18n.configure({
  locales: ['tr', 'en'],
  directory: localesDirectory,
  defaultLocale: 'tr',
  objectNotation: true,
  autoReload: true,
  updateFiles: false,
  syncFiles: false,
  cookie: 'lang',
  queryParameter: 'lang',
});

export default i18n; 