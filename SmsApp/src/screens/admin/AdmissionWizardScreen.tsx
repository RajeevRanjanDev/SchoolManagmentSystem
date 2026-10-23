import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';

import { adminService } from '@api/services/adminService';
import { transportMgrService } from '@api/services/employeeService';
import Header from '@components/common/Header';
import Card from '@components/common/Card';
import AppButton from '@components/common/AppButton';
import { Colors } from '@constants/colors';
import { Sizes } from '@constants/sizes';
import { currentAcademicYear } from '@utils/dateUtils';

const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
const RELATIONS = ['FATHER', 'MOTHER', 'GRANDPARENT', 'LEGAL_GUARDIAN', 'OTHER'];
const MOBILE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const Field = ({ label, required, ...props }: any) => (
  <View style={{ marginBottom: Sizes.sm }}>
    <Text style={styles.label}>{label}{required ? <Text style={{ color: Colors.danger }}> *</Text> : null}</Text>
    <TextInput placeholderTextColor={Colors.textMuted} style={styles.input} {...props} />
  </View>
);

const Chips = ({ options, value, onChange, labelOf }: { options: Array<string | number>; value?: string | number; onChange: (v: any) => void; labelOf?: (v: any) => string }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
    {options.map(o => {
      const active = value === o;
      return (
        <TouchableOpacity key={String(o)} onPress={() => onChange(o)} style={[styles.chip, active && styles.chipActive]}>
          <Text style={[styles.chipText, active && styles.chipTextActive]}>{labelOf ? labelOf(o) : String(o).replace(/_/g, ' ')}</Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

const AdmissionWizardScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const academicYear = currentAcademicYear();

  // Basic
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('MALE');
  const [dob, setDob] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');

  // Academic
  const [admissionDate, setAdmissionDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [classId, setClassId] = useState<number | undefined>();
  const [sectionId, setSectionId] = useState<number | undefined>();
  const [rollNumber, setRollNumber] = useState('');
  const [feeTemplateId, setFeeTemplateId] = useState<number | undefined>();

  // Guardian
  const [gRelation, setGRelation] = useState('FATHER');
  const [gFirst, setGFirst] = useState('');
  const [gLast, setGLast] = useState('');
  const [gMobile, setGMobile] = useState('');
  const [gEmail, setGEmail] = useState('');

  // Address
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Transport
  const [transportRequired, setTransportRequired] = useState(false);
  const [routeId, setRouteId] = useState<number | undefined>();
  const [stopName, setStopName] = useState('');

  const { data: classes } = useQuery({ queryKey: ['admin-classes', academicYear], queryFn: () => adminService.listClasses(academicYear) });
  const { data: sections } = useQuery({ queryKey: ['admin-sections', classId], queryFn: () => adminService.listSections(classId!), enabled: classId != null });
  const { data: templates } = useQuery({ queryKey: ['admin-fee-templates'], queryFn: () => adminService.listFeeTemplates() });
  const { data: routes } = useQuery({ queryKey: ['transport-routes'], queryFn: () => transportMgrService.listRoutes(), enabled: transportRequired });

  useEffect(() => { setSectionId(undefined); }, [classId]);

  const classOpts = useMemo(() => (classes ?? []).map(c => c.id), [classes]);
  const classLabel = (id: number) => (classes ?? []).find(c => c.id === id)?.name ?? String(id);
  const sectionOpts = useMemo(() => (sections ?? []).map(s => s.id), [sections]);
  const sectionLabel = (id: number) => (sections ?? []).find(s => s.id === id)?.name ?? String(id);
  const tplOpts = useMemo(() => (templates ?? []).map(t => t.id), [templates]);
  const tplLabel = (id: number) => (templates ?? []).find(t => t.id === id)?.name ?? String(id);
  const routeOpts = useMemo(() => (routes ?? []).map(r => r.id), [routes]);
  const routeLabel = (id: number) => (routes ?? []).find(r => r.id === id)?.routeName ?? String(id);

  const errors: string[] = [];
  if (!firstName.trim()) errors.push('First name');
  if (!lastName.trim()) errors.push('Last name');
  if (!DATE_RE.test(dob)) errors.push('Date of birth (yyyy-MM-dd)');
  if (!MOBILE_RE.test(mobile)) errors.push('Valid 10-digit mobile');
  if (!EMAIL_RE.test(email)) errors.push('Valid email');
  if (!DATE_RE.test(admissionDate)) errors.push('Admission date');
  if (classId == null) errors.push('Class');
  if (sectionId == null) errors.push('Section');
  if ((templates ?? []).length > 0 && feeTemplateId == null) errors.push('Fee template');
  if (!gFirst.trim()) errors.push('Guardian name');
  if (!line1.trim()) errors.push('Address line 1');
  if (!city.trim()) errors.push('City');
  if (!state.trim()) errors.push('State');
  const valid = errors.length === 0;

  const mutation = useMutation({
    mutationFn: () => adminService.registerStudent({
      firstName: firstName.trim(), middleName: middleName.trim() || undefined, lastName: lastName.trim(),
      gender, dateOfBirth: dob, bloodGroup: bloodGroup.trim() || undefined,
      mobile: mobile.trim(), email: email.trim(),
      institutionType: 'SCHOOL', academicSession: academicYear, admissionDate, admissionType: 'FRESH',
      feeTemplateId: feeTemplateId ?? undefined,
      classId, sectionId, rollNumber: rollNumber.trim() || undefined,
      guardians: [{
        relation: gRelation, firstName: gFirst.trim(), lastName: gLast.trim() || undefined,
        mobile: gMobile.trim() || undefined, email: gEmail.trim() || undefined, primary: true,
      }],
      currentAddress: { addressLine1: line1.trim(), city: city.trim(), state: state.trim(), country: 'India', pincode: pincode.trim() || undefined },
      permanentSameAsCurrent: true,
      transportInfo: transportRequired
        ? { transportRequired: true, routeId: routeId ?? undefined, routeName: routeId ? routeLabel(routeId) : undefined, stopName: stopName.trim() || undefined }
        : { transportRequired: false },
    }),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Student registered', text2: 'Login ID & temp password emailed' });
      qc.invalidateQueries({ queryKey: ['admin-students'] });
      navigation.goBack();
    },
    onError: (e: any) => Toast.show({ type: 'error', text1: 'Registration failed', text2: e?.response?.data?.message ?? 'Check the fields and try again' }),
  });

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="New Admission" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>

        <Card style={styles.card}>
          <Text style={styles.section}>Basic Info</Text>
          <Field label="First name" required value={firstName} onChangeText={setFirstName} />
          <Field label="Middle name" value={middleName} onChangeText={setMiddleName} />
          <Field label="Last name" required value={lastName} onChangeText={setLastName} />
          <Text style={styles.label}>Gender</Text>
          <Chips options={GENDERS} value={gender} onChange={setGender} />
          <Field label="Date of birth (yyyy-MM-dd)" required value={dob} onChangeText={setDob} placeholder="2015-06-01" />
          <Field label="Mobile (10-digit)" required value={mobile} onChangeText={setMobile} keyboardType="phone-pad" />
          <Field label="Email" required value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Field label="Blood group" value={bloodGroup} onChangeText={setBloodGroup} />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.section}>Academic</Text>
          <Text style={styles.label}>Session: {academicYear}</Text>
          <Field label="Admission date (yyyy-MM-dd)" required value={admissionDate} onChangeText={setAdmissionDate} />
          <Text style={styles.label}>Class <Text style={{ color: Colors.danger }}>*</Text></Text>
          <Chips options={classOpts} value={classId} onChange={setClassId} labelOf={classLabel} />
          {classId != null && (
            <>
              <Text style={[styles.label, { marginTop: Sizes.sm }]}>Section <Text style={{ color: Colors.danger }}>*</Text></Text>
              <Chips options={sectionOpts} value={sectionId} onChange={setSectionId} labelOf={sectionLabel} />
            </>
          )}
          <Field label="Roll number" value={rollNumber} onChangeText={setRollNumber} />
          {(templates ?? []).length > 0 && (
            <>
              <Text style={[styles.label, { marginTop: Sizes.sm }]}>Fee template <Text style={{ color: Colors.danger }}>*</Text></Text>
              <Chips options={tplOpts} value={feeTemplateId} onChange={setFeeTemplateId} labelOf={tplLabel} />
            </>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.section}>Guardian</Text>
          <Text style={styles.label}>Relation</Text>
          <Chips options={RELATIONS} value={gRelation} onChange={setGRelation} />
          <Field label="Guardian first name" required value={gFirst} onChangeText={setGFirst} />
          <Field label="Guardian last name" value={gLast} onChangeText={setGLast} />
          <Field label="Guardian mobile" value={gMobile} onChangeText={setGMobile} keyboardType="phone-pad" />
          <Field label="Guardian email" value={gEmail} onChangeText={setGEmail} keyboardType="email-address" autoCapitalize="none" />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.section}>Current Address</Text>
          <Field label="Address line 1" required value={line1} onChangeText={setLine1} />
          <Field label="City" required value={city} onChangeText={setCity} />
          <Field label="State" required value={state} onChangeText={setState} />
          <Field label="Pincode" value={pincode} onChangeText={setPincode} keyboardType="number-pad" />
          <Text style={styles.hint}>Permanent address is set the same as current.</Text>
        </Card>

        <Card style={styles.card}>
          <View style={styles.switchRow}>
            <Text style={styles.section}>Transport</Text>
            <Switch value={transportRequired} onValueChange={setTransportRequired} trackColor={{ true: Colors.primaryLight }} thumbColor={transportRequired ? Colors.primary : undefined} />
          </View>
          {transportRequired && (
            <>
              <Text style={styles.label}>Route</Text>
              <Chips options={routeOpts} value={routeId} onChange={setRouteId} labelOf={routeLabel} />
              <Field label="Stop / pickup point" value={stopName} onChangeText={setStopName} />
            </>
          )}
        </Card>

        {!valid && (
          <Text style={styles.missing}>Required: {errors.join(', ')}</Text>
        )}

        <AppButton
          title={mutation.isPending ? 'Registering…' : 'Register Student'}
          onPress={() => mutation.mutate()}
          loading={mutation.isPending}
          disabled={!valid}
          style={{ marginTop: Sizes.sm }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Sizes.md, gap: Sizes.md },
  card: { padding: Sizes.md },
  section: { fontSize: Sizes.fontLg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Sizes.sm },
  label: { fontSize: Sizes.fontSm, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: Colors.background, borderRadius: Sizes.radiusMd, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Sizes.md, paddingVertical: Platform.OS === 'ios' ? 12 : 9, fontSize: Sizes.fontMd, color: Colors.textPrimary,
  },
  chipsRow: { gap: Sizes.sm, paddingVertical: 2 },
  chip: { paddingHorizontal: Sizes.md, paddingVertical: 8, borderRadius: Sizes.radiusFull, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: Sizes.fontSm, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.white },
  hint: { fontSize: Sizes.fontXs, color: Colors.textMuted, marginTop: 4 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  missing: { fontSize: Sizes.fontXs, color: Colors.danger },
});

export default AdmissionWizardScreen;
