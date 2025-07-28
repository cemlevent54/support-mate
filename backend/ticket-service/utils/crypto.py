from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import base64

# AES anahtarı 16, 24 veya 32 byte olmalı. IV ise tam 16 byte olmalı!
AES_KEY = b"thisisasecretkey"  # 16 byte
AES_IV = b"thisisaninitvect"  # 16 byte
BLOCK_SIZE = 16

def encrypt_message(plain_text: str) -> str:
    if not plain_text or plain_text.strip() == "":
        return plain_text or ""
    try:
        cipher = AES.new(AES_KEY, AES.MODE_CBC, AES_IV)
        ct_bytes = cipher.encrypt(pad(plain_text.encode('utf-8'), BLOCK_SIZE))
        return base64.b64encode(ct_bytes).decode('utf-8')
    except Exception as e:
        # Eğer şifreleme hatası varsa, orijinal metni döndür
        print(f"Encryption error: {e}, returning original text")
        return plain_text

def decrypt_message(cipher_text: str) -> str:
    if not cipher_text or cipher_text.strip() == "":
        return cipher_text or ""
    try:
        cipher = AES.new(AES_KEY, AES.MODE_CBC, AES_IV)
        pt = unpad(cipher.decrypt(base64.b64decode(cipher_text)), BLOCK_SIZE)
        return pt.decode('utf-8')
    except Exception as e:
        # Eğer şifreleme hatası varsa, orijinal metni döndür
        print(f"Decryption error: {e}, returning original text")
        return cipher_text 