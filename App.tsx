import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { computeGrindChange, grindHeadline } from './src/engine';

// Temporary test screen: proves the build pipeline works and the engine runs on device.
// Will be replaced by the real Material Design 3 screens.
const demo = grindHeadline(
  'CLICKS',
  computeGrindChange({ archetype: 'CLICKS', finerDirection: 'DECREASE', currentSetting: 14 }, 'FINER'),
);

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dial-In</Text>
      <Text style={styles.sub}>Test-Build läuft ✅</Text>
      <Text style={styles.demo}>Engine sagt: „{demo}"</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { fontSize: 32, fontWeight: '700' },
  sub: { fontSize: 16 },
  demo: { fontSize: 18, fontWeight: '600' },
});
