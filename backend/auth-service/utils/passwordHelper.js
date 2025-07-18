class PasswordHelper {
  static async hashPassword(password) {
    const bcrypt = await import('bcrypt');
    return bcrypt.default.hash(password, 10);
  }

  static async comparePassword(password, hash) {
    const bcrypt = await import('bcrypt');
    return bcrypt.default.compare(password, hash);
  }
}

export default PasswordHelper;