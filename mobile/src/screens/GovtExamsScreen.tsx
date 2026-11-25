import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { colors } from '../theme/colors';
import { spacing, radii } from '../theme/spacing';
import { CourseCard } from '../components/CourseCard';
import { INITIAL_COURSES } from '../data/coursesData';
import { Landmark, Layers } from 'lucide-react-native';

const DISCIPLINES = [
  { id: 'all', label: 'All Govt' },
  { id: 'parmar', label: 'Parmar GK' },
  { id: 'maths', label: 'Maths' },
  { id: 'reasoning', label: 'Reasoning' },
  { id: 'english', label: 'English' },
  { id: 'gs', label: 'General Studies' },
];

export const GovtExamsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedDiscipline, setSelectedDiscipline] = useState('all');

  const govtCourses = useMemo(() => {
    const list = INITIAL_COURSES.filter(
      (c) => (c.category || '').toLowerCase() === 'government'
    );

    if (selectedDiscipline === 'all') return list;

    return list.filter((c) => {
      const name = (c.name + ' ' + c.subname + ' ' + c.subject + ' ' + c.teacher).toLowerCase();
      if (selectedDiscipline === 'parmar') return name.includes('parmar');
      if (selectedDiscipline === 'maths') return name.includes('math');
      if (selectedDiscipline === 'reasoning') return name.includes('reasoning');
      if (selectedDiscipline === 'english') return name.includes('english');
      if (selectedDiscipline === 'gs') return name.includes('gk') || name.includes('general') || name.includes('science');
      return true;
    });
  }, [selectedDiscipline]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Landmark size={20} color={colors.govtIndigo} />
        </View>
        <View>
          <Text style={styles.title}>Government Exams</Text>
          <Text style={styles.subtitle}>SSC CGL, CHSL, MTS, Railway & State batches</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {DISCIPLINES.map((d) => {
          const isActive = selectedDiscipline === d.id;
          return (
            <TouchableOpacity
              key={d.id}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => setSelectedDiscipline(d.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={govtCourses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <CourseCard
            course={item}
            onPress={() =>
              navigation.navigate('CourseDetail', {
                courseId: item.id,
                title: item.name,
              })
            }
          />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: `${colors.govtIndigo}18`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${colors.govtIndigo}40`,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textDim,
    marginTop: 2,
  },
  filterRow: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.govtIndigo,
    borderColor: colors.govtIndigo,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  pillTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
  },
});
