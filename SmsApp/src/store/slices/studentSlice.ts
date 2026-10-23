import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChildSummary } from '@api/services/studentService';

interface StudentState {
  students: ChildSummary[];
  selectedStudent: ChildSummary | null;
}

const initialState: StudentState = {
  students: [],
  selectedStudent: null,
};

const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
    setStudents: (state, action: PayloadAction<ChildSummary[]>) => {
      state.students = action.payload;
      // Auto-select first student if none selected yet
      if (!state.selectedStudent && action.payload.length > 0) {
        state.selectedStudent = action.payload[0];
      }
    },
    selectStudent: (state, action: PayloadAction<ChildSummary>) => {
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
