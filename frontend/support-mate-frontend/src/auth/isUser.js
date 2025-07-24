export default function isUser(user) {
  if (!user) return false;
  return user.roleName === 'User';
}
