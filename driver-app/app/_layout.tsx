import { Provider } from 'react-redux';
import { Stack } from 'expo-router';
import store from '../src/store';

export default function Layout() {
  return (
    <Provider store={store}>
      <Stack screenOptions={{ headerShown: false }} />
    </Provider>
  );
}
