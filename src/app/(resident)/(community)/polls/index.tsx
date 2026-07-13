import { Redirect } from 'expo-router';

export default function PollsScreen() {
  return <Redirect href="/(resident)/(community)?tab=polls" />;
}
