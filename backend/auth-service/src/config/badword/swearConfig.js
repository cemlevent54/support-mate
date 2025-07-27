import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Kendi küfür filtremizi oluşturalım
class SwearFilter {
  constructor() {
    this.list = [];
    this.placeHolder = '*';
    this.regex = /[^a-zA-Z0-9|\$|\@]|\^/g;
  }

  addWords(...words) {
    this.list.push(...words);
  }

  clean(text) {
    if (!text || typeof text !== 'string') {
      return text;
    }

    let result = text;
    
    // Türkçe karakterleri de dahil et
    const turkishRegex = /[çğıöşüÇĞIİÖŞÜ]/g;
    
    this.list.forEach(word => {
      if (word && word.trim()) {
        // Küfür kelimesini regex ile bul ve değiştir
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedWord, 'gi');
        result = result.replace(regex, this.placeHolder.repeat(word.length));
      }
    });

    return result;
  }

  isProfane(text) {
    if (!text || typeof text !== 'string') {
      return false;
    }

    return this.list.some(word => {
      if (word && word.trim()) {
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedWord, 'gi');
        return regex.test(text);
      }
      return false;
    });
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Türkçe küfür kelimelerini dosyadan oku
const readSwearWords = () => {
  try {
    const swearWordsPath = path.join(__dirname, 'swears.txt');
    const content = fs.readFileSync(swearWordsPath, 'utf8');
    return content.split('\n')
      .map(word => word.trim())
      .filter(word => word.length > 0);
  } catch (error) {
    console.error('Küfür kelimeleri dosyası okunamadı:', error);
    return [];
  }
};

// Bad words filter'ı oluştur
const createSwearFilter = () => {
  const filter = new SwearFilter();
  
  // Türkçe kelimeleri ekle
  const turkishSwearWords = readSwearWords();
  filter.addWords(...turkishSwearWords);
  
  return filter;
};

// Küfür kontrolü yapan fonksiyon
export const checkForSwearWords = (text) => {
  if (!text || typeof text !== 'string') {
    return { hasSwearWords: false, filteredText: text };
  }
  
  const filter = createSwearFilter();
  const originalText = text;
  const filteredText = filter.clean(text);
  
  return {
    hasSwearWords: originalText !== filteredText,
    filteredText: filteredText,
    originalText: originalText
  };
};

// Küfür içeren metin için özel response oluştur
export const createSwearWordResponse = (locale = 'tr') => {
  const messages = {
    tr: {
      success: false,
      message: 'Mesajınızda uygunsuz kelimeler bulunmaktadır. Lütfen mesajınızı düzenleyin.',
      data: null
    },
    en: {
      success: false,
      message: 'Your message contains inappropriate words. Please edit your message.',
      data: null
    }
  };
  
  return messages[locale] || messages.tr;
};

export default createSwearFilter;
