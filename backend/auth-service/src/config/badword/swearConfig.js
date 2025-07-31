import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import base64json from 'base64json';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Kendi küfür filtremizi oluşturalım
class SwearFilter {
  constructor() {
    this.list = [];
    this.placeHolder = '*';
  }

  addWords(...words) {
    this.list.push(...words);
  }

  clean(text) {
    if (!text || typeof text !== 'string') {
      return text;
    }

    let result = text;
    
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

// Base64 encoded dosyaları oku ve decode et
const readBase64SwearWords = () => {
  try {
    const trFilePath = path.join(__dirname, 'tr-bad-words.txt');
    const enFilePath = path.join(__dirname, 'en-bad-words.txt');
    
    let trDataSet = [];
    let enDataSet = [];
    
    // Türkçe kelimeleri yükle
    if (fs.existsSync(trFilePath)) {
      const trContent = fs.readFileSync(trFilePath, 'utf8').trim();
      try {
        // Önce JSON olarak decode etmeyi dene
        trDataSet = base64json.parse(trContent);
      } catch (jsonError) {
        // JSON değilse, satır satır decode et
        const decodedContent = Buffer.from(trContent, 'base64').toString('utf-8');
        trDataSet = decodedContent.split('\n').map(word => word.trim()).filter(word => word);
      }
    }
    
    // İngilizce kelimeleri yükle
    if (fs.existsSync(enFilePath)) {
      const enContent = fs.readFileSync(enFilePath, 'utf8').trim();
      try {
        // Önce JSON olarak decode etmeyi dene
        enDataSet = base64json.parse(enContent);
      } catch (jsonError) {
        // JSON değilse, satır satır decode et
        const decodedContent = Buffer.from(enContent, 'base64').toString('utf-8');
        enDataSet = decodedContent.split('\n').map(word => word.trim()).filter(word => word);
      }
    }
    
    return [...trDataSet, ...enDataSet];
  } catch (error) {
    console.error('Base64 küfür kelimeleri dosyası okunamadı:', error);
    return [];
  }
};

// Bad-words filter'ı oluştur
const createSwearFilter = () => {
  const filter = new SwearFilter();
  
  // Base64'ten decode edilen kelimeleri ekle
  const swearWords = readBase64SwearWords();
  filter.addWords(...swearWords);
  
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

// Username kontrolü için özel fonksiyon
export const controlUsername = async (username) => {
  if (!username || typeof username !== 'string') {
    return false;
  }
  
  const filter = createSwearFilter();
  const usernameFilter = filter.clean(username);
  const result = usernameFilter.indexOf("*");
  
  return result === -1; // true = temiz, false = küfür var
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
