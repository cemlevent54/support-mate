export default function isCustomerSupporter(user) {
  if (!user) return false;
  return user.roleName === 'Customer Supporter';
}
