export default function isLeader(user) {
    if (!user) return false;
    return user.roleName === 'Leader';
}
  