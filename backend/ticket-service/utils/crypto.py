from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import base64

# AES anahtarı 16, 24 veya 32 byte olmalı. IV ise tam 16 byte olmalı!
AES_KEY = b"thisisasecretkey"  # 16 byte
AES_IV = b"thisisaninitvect"  # 16 byte
BLOCK_SIZE = 16

def encrypt_message(plain_text: str) -> str:
    cipher = AES.new(AES_KEY, AES.MODE_CBC, AES_IV)
    ct_bytes = cipher.encrypt(pad(plain_text.encode('utf-8'), BLOCK_SIZE))
    return base64.b64encode(ct_bytes).decode('utf-8')

def decrypt_message(cipher_text: str) -> str:
    cipher = AES.new(AES_KEY, AES.MODE_CBC, AES_IV)
    pt = unpad(cipher.decrypt(base64.b64decode(cipher_text)), BLOCK_SIZE)
    return pt.decode('utf-8') 