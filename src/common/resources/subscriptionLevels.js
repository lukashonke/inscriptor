export const SubscriptionLevels = {
  Basic: 0,
  Premium: 1,
};

export function getLevelName(level) {
  switch(level) {
    case SubscriptionLevels.Basic:
      return 'Basic';
    case SubscriptionLevels.Premium:
      return 'Premium';
    default:
      return 'Unknown';
  }
}
