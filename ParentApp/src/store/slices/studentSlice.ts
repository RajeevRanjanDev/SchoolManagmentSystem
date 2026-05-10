import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Student } from '@app-types/index';

interface StudentState {
  students: Student[];
  selectedStudent: Student | null;
}

const initialState: StudentState = {
  students: [],
  selectedStudent: null,
};

const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
    setStudents: (state, action: PayloadAction<Student[]>) => {
      state.students = action.payload;
      // Auto-select first student if none selected
      if (!state.selectedStudent && action.payload.length > 0) {
        state.selectedStudent = action.payload[0];
      }
    },
    selectStudent: (state, action: PayloadAction<Student>) => {
      state.selectedStudent = action.payload;
    },
    clearStudents: state => {
      state.students = [];
      state.selectedStudent = null;
    },
  },
});

export const { setStudents, selectStudent, clearStudents } = studentSlice.actions;
export default studentSlice.reducer;
