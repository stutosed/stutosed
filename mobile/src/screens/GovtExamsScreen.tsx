import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import { spacing, radii } from '../theme/spacing';
import { CourseCard } from '../components/CourseCard';
import { INITIAL_COURSES, isGovernmentCategory } from '../data/coursesData';
import { Landmark } from 'lucide-react-native';

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
  const { colors } = useTheme();
  const [selectedDiscipline, setSelectedDiscipline] = useState('all');

  const govtCourses = useMemo(() => {
    const list = INITIAL_COURSES.filter((c) => isGovernmentCategory(c.category));

    if (selectedDiscipline === 'all') return list;

    return list.filter((c) => {
      const name = (c.name + ' ' + c.subname + ' ' + c.subject + ' ' + c.teacher).toLowerCase();
      if (selectedDiscipline === 'parmar') return name.includes('parmar');
      if (selectedDiscipline === 'maths') return name.includes('math') || name.includes('quant');
      if (selectedDiscipline === 'reasoning') return name.includes('reasoning');
      if (selectedDiscipline === 'english') return name.includes('english') || name.includes('vocab');
      if (selectedDiscipline === 'gs')
        return name.includes('gk') || name.includes('general') || name.includes('computer');
      return true;
    });
  }, [selectedDiscipline]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={styles.header}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: `${colors.govtIndigo}18`, borderColor: `${colors.govtIndigo}40` },
          ]}
        >
          <Landmark size={20} color={colors.govtIndigo} />
        </View>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Government Exams</Text>
          <Text style={[styles.subtitle, { color: colors.textDim }]}>
            SSC CGL, CHSL, MTS, Railway & Banking batches
          </Text>
        </View>
      </View>

      <View>
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
                style={[
                  styles.pill,
                  {
                    backgroundColor: isActive ? colors.govtIndigo : colors.bgCard,
                    borderColor: isActive ? colors.govtIndigo : colors.border,
                  },
                ]}
                onPress={() => setSelectedDiscipline(d.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: isActive ? '#ffffff' : colors.textMuted },
                  ]}
                >
                  {d.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
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
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
  },
});
