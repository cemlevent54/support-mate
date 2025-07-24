export default function isEmployee(user) {
  if (!user) return false;
  return user.roleName === 'Employee';
}
