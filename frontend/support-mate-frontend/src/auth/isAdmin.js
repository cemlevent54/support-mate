export default function isAdmin(user) {
  if (!user) return false;
  return user.roleName === 'Admin';
}
