import { Redirect } from 'expo-router';

export default function DirectoryScreen() {
  return <Redirect href="/(resident)/(community)?tab=directory" />;
}
