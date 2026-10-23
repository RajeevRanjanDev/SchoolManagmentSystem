# React Native Deep Dive — For Java Developers
### How the SMS Parent App Was Built, Explained From First Principles

> **Who this is for:** You know Java, Spring Boot, OOP, REST APIs. You've never written React Native.  
> **Goal:** After reading this, you can read, modify, and extend every file in this app.

---

## Table of Contents

1. [Mental Model — Java vs React Native](#1-mental-model--java-vs-react-native)
2. [Project Setup & Toolchain](#2-project-setup--toolchain)
3. [TypeScript for Java Developers](#3-typescript-for-java-developers)
4. [React Fundamentals](#4-react-fundamentals)
5. [Styling — No CSS, Just JS Objects](#5-styling--no-css-just-js-objects)
6. [Navigation — Moving Between Screens](#6-navigation--moving-between-screens)
7. [State Management with Redux Toolkit](#7-state-management-with-redux-toolkit)
8. [Data Fetching with React Query + Axios](#8-data-fetching-with-react-query--axios)
9. [JWT Auth — Interceptors & Secure Storage](#9-jwt-auth--interceptors--secure-storage)
10. [Screen-by-Screen Walkthrough](#10-screen-by-screen-walkthrough)
11. [Reusable Components](#11-reusable-components)
12. [Hooks — Custom Logic Reuse](#12-hooks--custom-logic-reuse)
13. [The Full App Flow Diagram](#13-the-full-app-flow-diagram)
14. [How to Add a New Feature](#14-how-to-add-a-new-feature)
15. [Common Errors & Fixes](#15-common-errors--fixes)

---

## 1. Mental Model — Java vs React Native

### The biggest mindset shift

In Java/Spring Boot you think in **classes, beans, and request-response cycles**.  
In React Native you think in **components, state, and re-renders**.

| Java / Spring Boot | React Native |
|---|---|
| `@RestController` class | A Screen component (function) |
| `@Service` class | A custom Hook or API service |
| `@Entity` / DTO | TypeScript interface |
| Spring Bean (singleton) | Redux slice (global state) |
| HTTP request comes in → response goes out | User interaction → state changes → UI re-renders |
| XML / YAML config | JS/TS config files |
| Maven `pom.xml` | `package.json` |
| `mvn spring-boot:run` | `npx react-native start` |
| JVM | JavaScript Engine (Hermes) |

### How React Native Actually Works

```
Your TypeScript/JSX Code
        │
        ▼
  Metro Bundler             ← like Maven, compiles your code into a JS bundle
        │
        ▼
  Hermes JS Engine          ← runs inside the Android/iOS app (like JVM but for JS)
        │
  JS Bridge / JSI           ← thin layer that communicates with native code
        │
        ▼
  Native Android/iOS        ← actual Android Views, actual iOS UIViews
```

**Key insight:** You write JavaScript but the user sees real native buttons, lists, and maps — not a web page.

### Component = Class with render()

If you're used to Java classes, think of a React component as a class that has one job: **return UI**.

```tsx
// Java mental model (what you're used to)
public class AttendanceScreen {
    private Student student;
    private List<AttendanceRecord> records;

    public View render() {
        return new ListView(records);
    }
}

// React Native reality (what you actually write)
const AttendanceScreen = () => {
    const student = useAppSelector(s => s.student.selectedStudent);
    const { data: records } = useQuery({ queryFn: fetchAttendance });

    return (
        <FlatList data={records} renderItem={...} />
    );
};
```

The function IS the class. The `return` IS `render()`. State variables replace instance fields.

---

## 2. Project Setup & Toolchain

### Files in the root directory

```
ParentApp/
├── package.json          ← like pom.xml (dependencies, scripts)
├── tsconfig.json         ← TypeScript compiler config
├── babel.config.js       ← code transformer config (handles path aliases)
├── metro.config.js       ← Metro bundler config
├── app.json              ← app name, version
├── index.js              ← entry point (like main() in Java)
├── App.tsx               ← root component
├── android/              ← native Android project (Java/Kotlin)
├── ios/                  ← native iOS project (Swift/ObjC)
└── src/                  ← all your TypeScript code lives here
```

### package.json — Your pom.xml

```json
{
  "name": "SMSParentApp",
  "scripts": {
    "android": "react-native run-android",   // like mvn spring-boot:run
    "ios": "react-native run-ios",
    "start": "react-native start",           // starts Metro bundler
    "test": "jest"
  },
  "dependencies": {
    "react": "18.2.0",                       // the core library
    "react-native": "0.73.6",               // the mobile bridge
    "@reduxjs/toolkit": "^2.2.1",           // state management
    "@tanstack/react-query": "^5.28.4",     // data fetching
    "axios": "^1.6.7"                        // HTTP client
  },
  "devDependencies": {
    "typescript": "5.0.4",                  // type checking
    "babel-plugin-module-resolver": "..."   // path alias support
  }
}
```

### Path Aliases — Like Spring's @ComponentScan packages

Instead of writing `../../components/common/Card` everywhere, we configured short aliases:

```typescript
// Without alias (ugly)
import Card from '../../../components/common/Card';

// With alias (clean)
import Card from '@components/common/Card';
```

Configured in two places:

**tsconfig.json** (tells TypeScript where to find the files):
```json
{
  "compilerOptions": {
    "paths": {
      "@components/*": ["src/components/*"],
      "@screens/*":    ["src/screens/*"],
      "@store/*":      ["src/store/*"],
      "@api/*":        ["src/api/*"],
      "@hooks/*":      ["src/hooks/*"],
      "@utils/*":      ["src/utils/*"],
      "@constants/*":  ["src/constants/*"],
      "@app-types/*":  ["src/types/*"]
    }
  }
}
```

**babel.config.js** (tells Metro bundler where to find the files at runtime):
```javascript
module.exports = {
  plugins: [
    ['module-resolver', {
      alias: {
        '@components': './src/components',
        '@store':      './src/store',
        // ... same as tsconfig
      }
    }]
  ]
};
```

> **Why two places?** TypeScript only does type-checking. Babel/Metro actually bundles the code. Both need to know the aliases.

---

## 3. TypeScript for Java Developers

TypeScript = JavaScript + Java-style type safety. You'll feel right at home.

### Interfaces — Like Java Interfaces/DTOs

```typescript
// Java DTO
public class Student {
    private Long id;
    private String firstName;
    private String lastName;
    private String admissionNumber;
    private String className;      // nullable
}

// TypeScript interface (same thing)
interface Student {
    id: number;
    firstName: string;
    lastName: string;
    admissionNumber: string;
    className?: string;    // ? means nullable/optional
}
```

### Generics — Same as Java

```typescript
// Java
public class ApiResponse<T> {
    private boolean success;
    private T data;
    private String message;
}

// TypeScript
interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

// Usage
const response: ApiResponse<Student[]> = await api.get('/students');
```

### Enums

```typescript
// Java
public enum AttendanceStatus { PRESENT, ABSENT, LATE, HALF_DAY }

// TypeScript (string enum)
type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';

// Or full enum
enum AttendanceStatus {
    PRESENT = 'PRESENT',
    ABSENT  = 'ABSENT',
}
```

### All Types Used in This App

Located in `src/types/index.ts`:

```typescript
// Auth
export interface AuthUser {
    id: number;
    email: string;
    fullName: string;
    role: string;
    schoolId: number;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
}

// Student
export interface Student {
    id: number;
    firstName: string;
    lastName: string;
    admissionNumber: string;
    rollNumber?: string;
    className?: string;
    sectionName?: string;
    dateOfBirth?: string;
    gender?: string;
    photoUrl?: string;
}

// Attendance
export interface AttendanceRecord {
    id: number;
    studentId: number;
    attendanceDate: string;   // "2024-01-15"
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'HOLIDAY';
    remarks?: string;
}

// Fee
export interface FeeRecord {
    id: number;
    feeType: string;
    amount: number;
    paidAmount: number;
    dueDate: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL' | 'WAIVED';
}

// Bus
export interface BusLocation {
    vehicleId: number;
    vehicleNumber: string;
    latitude: number;
    longitude: number;
    speedKmh: number;
    driverName: string;
    driverPhone: string;
    timestamp: string;
}
```

---

## 4. React Fundamentals

### JSX — HTML inside TypeScript

React uses JSX: a syntax that lets you write UI inline with logic.

```tsx
// This looks like XML but it's actually TypeScript function calls
const MyComponent = () => {
    return (
        <View style={{ flex: 1 }}>
            <Text>Hello World</Text>
        </View>
    );
};

// Babel compiles this to:
const MyComponent = () => {
    return React.createElement(View, { style: { flex: 1 } },
        React.createElement(Text, null, "Hello World")
    );
};
```

### The Core RN Components (Your UI Toolkit)

| Component | Java/Android Equivalent | Use Case |
|---|---|---|
| `<View>` | `ViewGroup` / `ConstraintLayout` | Container, layout |
| `<Text>` | `TextView` | Display text |
| `<Image>` | `ImageView` | Display images |
| `<ScrollView>` | `ScrollView` | Scrollable content |
| `<FlatList>` | `RecyclerView` | Long scrollable lists (efficient) |
| `<TouchableOpacity>` | `Button` with click listener | Tappable anything |
| `<TextInput>` | `EditText` | Text input field |
| `<Modal>` | `Dialog` / `BottomSheet` | Overlays |
| `<ActivityIndicator>` | `ProgressBar` | Loading spinner |

### useState — Instance Variables That Trigger Re-render

```tsx
// Java: you change a field, nothing happens to the UI automatically
private boolean isLoading = false;

// React: when you call setIsLoading(), the component re-renders automatically
const [isLoading, setIsLoading] = useState(false);
const [email, setEmail]         = useState('');
const [month, setMonth]         = useState(new Date());
```

**Rule:** Never mutate state directly. Always use the setter:
```tsx
// WRONG — UI won't update
isLoading = true;

// CORRECT — triggers re-render
setIsLoading(true);
```

### useEffect — Lifecycle Methods

```tsx
// Java Spring: @PostConstruct
// React: useEffect with empty []
useEffect(() => {
    console.log('Component mounted — runs once');
    return () => {
        console.log('Component unmounted — cleanup');
    };
}, []); // empty array = run once on mount

// Java: watching a variable
// React: useEffect with dependencies
useEffect(() => {
    console.log('student changed!', student);
    // fetch data for new student
}, [student]); // runs every time `student` changes

// No dependency array = runs after EVERY render (avoid usually)
useEffect(() => {
    console.log('runs after every render');
});
```

### Props — Method Parameters for Components

```tsx
// Defining a component that accepts props
interface CardProps {
    title: string;
    value: number;
    color?: string;   // optional
}

const StatCard = ({ title, value, color = '#000' }: CardProps) => (
    <View>
        <Text style={{ color }}>{title}</Text>
        <Text>{value}</Text>
    </View>
);

// Using it
<StatCard title="Present" value={22} color="#10B981" />
<StatCard title="Absent"  value={3} />  // color uses default '#000'
```

### Conditional Rendering — Ternary and &&

```tsx
// If/else rendering
{isLoading ? (
    <ActivityIndicator />          // show if loading
) : (
    <FlatList data={records} />    // show when done
)}

// Show only if condition is true
{student && (
    <Text>{student.firstName}</Text>
)}

// Show nothing for false condition (common pattern)
{records.length > 0 && <Text>Found {records.length} records</Text>}
```

### Lists with FlatList

FlatList is like RecyclerView — it only renders visible items, very efficient.

```tsx
<FlatList
    data={records}                              // your array
    keyExtractor={item => String(item.id)}      // unique key (like RecyclerView ID)
    renderItem={({ item }) => (                 // renders each item
        <View>
            <Text>{item.attendanceDate}</Text>
            <Text>{item.status}</Text>
        </View>
    )}
    ListHeaderComponent={<Text>Header</Text>}   // top of list
    ListEmptyComponent={<Text>No data</Text>}   // when array is empty
    contentContainerStyle={{ padding: 16 }}
/>
```

---

## 5. Styling — No CSS, Just JS Objects

React Native has no CSS files. Styles are JavaScript objects.

### StyleSheet.create()

```tsx
import { StyleSheet } from 'react-native';

// Define styles — like Android's styles.xml but in JS
const styles = StyleSheet.create({
    container: {
        flex: 1,                        // like layout_weight="1"
        backgroundColor: '#f5f5f5',
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',              // '400'=normal, '700'=bold
        color: '#1E293B',
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',           // horizontal layout (default is vertical/column)
        alignItems: 'center',           // center vertically
        justifyContent: 'space-between', // like LinearLayout weightSum
    },
});

// Use in component
<View style={styles.container}>
    <Text style={styles.title}>Hello</Text>
</View>
```

### Flexbox — The Layout System

React Native uses Flexbox for all layouts. Default direction is **column** (vertical).

```
flexDirection: 'column'     flexDirection: 'row'
┌──────────┐                ┌──────┬──────┬──────┐
│  item 1  │                │  1   │  2   │  3   │
├──────────┤                └──────┴──────┴──────┘
│  item 2  │
├──────────┤
│  item 3  │
└──────────┘
```

```tsx
// Vertical stack (default)
<View style={{ flexDirection: 'column' }}>
    <Text>Top</Text>
    <Text>Middle</Text>
    <Text>Bottom</Text>
</View>

// Horizontal row
<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    <Text>Left</Text>
    <Text>Right</Text>
</View>

// Fill remaining space
<View style={{ flex: 1 }}>   {/* takes all available space */}
    <Text>Full height</Text>
</View>
```

### Color Constants — `src/constants/colors.ts`

All colors are centralized so you never hardcode hex values in screens:

```typescript
export const Colors = {
    primary:     '#4F46E5',   // indigo
    primaryDark: '#3730A3',
    secondary:   '#06B6D4',   // cyan
    success:     '#10B981',   // green
    warning:     '#F59E0B',   // amber
    danger:      '#EF4444',   // red
    
    // Text
    textPrimary:   '#1E293B',
    textSecondary: '#475569',
    textMuted:     '#94A3B8',
    
    // Backgrounds
    background: '#F1F5F9',
    surface:    '#FFFFFF',
    white:      '#FFFFFF',
    
    // Attendance
    present: '#10B981',
    absent:  '#EF4444',
    late:    '#F59E0B',
    
    // Gradients
    gradientPrimary: ['#4F46E5', '#7C3AED'],
};
```

### Size Constants — `src/constants/sizes.ts`

```typescript
export const Sizes = {
    // Spacing
    xs: 4,   sm: 8,   md: 16,  lg: 24,  xl: 32,  xxl: 48,

    // Typography
    fontXs: 11,  fontSm: 13,  fontMd: 15,  fontLg: 17,
    fontXl: 20,  fontXxl: 26,

    // Border radius
    radiusSm: 8,   radiusMd: 12,  radiusLg: 16,
    radiusXl: 24,  radiusFull: 999,

    // Shadow (spread on View)
    shadowSm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,   // Android shadow
    },
    shadowMd: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },
};
```

Usage:
```tsx
<View style={{
    padding: Sizes.md,           // 16
    borderRadius: Sizes.radiusMd, // 12
    ...Sizes.shadowMd,           // spread shadow properties
}}>
```

---

## 6. Navigation — Moving Between Screens

### The Navigation Stack

Like Android's Activity back stack, React Navigation maintains a stack of screens.

```
App starts
    │
AppNavigator      ← decides: show Login or show Main tabs?
    │
    ├── AuthStack  (if not logged in)
    │     └── LoginScreen
    │
    └── MainStack  (if logged in)
          ├── TabNavigator  (bottom tabs)
          │     ├── Tab: Dashboard
          │     ├── Tab: Attendance
          │     ├── Tab: Fees
          │     ├── Tab: Notifications
          │     └── Tab: Profile
          │
          └── Modals/Detail screens (pushed on top)
                ├── Homework
                ├── Timetable
                ├── Circulars
                ├── EventGallery
                ├── Results
                ├── BusTracking
                ├── Library
                └── FeePayment
```

### AppNavigator — The Auth Guard

```tsx
// src/navigation/AppNavigator.tsx
const AppNavigator = () => {
    const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);

    // On app start, try to restore saved token
    useEffect(() => {
        dispatch(restoreSession());
    }, []);

    return (
        <NavigationContainer>
            {isAuthenticated ? <MainStack /> : <AuthStack />}
        </NavigationContainer>
    );
};
```

This is like Spring Security — if not authenticated, redirect to login.  
When `isAuthenticated` changes in Redux, the entire navigator switches automatically.

### Defining Screens

```tsx
// src/navigation/types.ts — like defining @PathVariable types
export type RootStackParams = {
    Login:        undefined;              // no params
    Dashboard:    undefined;
    Attendance:   undefined;
    FeePayment:   { feeIds: number[]; totalAmount: number };  // with params
    BusTracking:  { vehicleId?: number };
};
```

### Navigating Between Screens

```tsx
// Inside any screen component
const navigation = useNavigation<any>();

// Go to a screen (push onto stack)
navigation.navigate('Attendance');

// Go to screen with params
navigation.navigate('FeePayment', { feeIds: [1, 2, 3], totalAmount: 5000 });

// Go back (pop from stack)
navigation.goBack();
```

### Reading Params in Destination Screen

```tsx
// In FeePaymentScreen
import { useRoute, RouteProp } from '@react-navigation/native';
type RouteType = RouteProp<RootStackParams, 'FeePayment'>;

const FeePaymentScreen = () => {
    const route = useRoute<RouteType>();
    const { feeIds, totalAmount } = route.params;
    // ...
};
```

### Tab Navigator

```tsx
// src/navigation/TabNavigator.tsx
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
    const unreadCount = useAppSelector(s => s.notification.unreadCount);

    return (
        <Tab.Navigator>
            <Tab.Screen name="Dashboard"  component={DashboardScreen} />
            <Tab.Screen name="Attendance" component={AttendanceScreen} />
            <Tab.Screen name="Fees"       component={FeeHistoryScreen} />
            <Tab.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{
                    tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
                }}
            />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};
```

---

## 7. State Management with Redux Toolkit

### Why Redux? (The Problem It Solves)

Without Redux, if LoginScreen sets the user and DashboardScreen needs it, you'd have to **pass it through every screen in between** (called "prop drilling"). Redux is a **global store** — any component can read or write to it.

Think of Redux as a **Spring singleton service** that any component can inject.

### The Three Slices in This App

```
src/store/slices/
├── authSlice.ts           ← who is logged in, JWT tokens
├── studentSlice.ts        ← which children, which one is selected
└── notificationSlice.ts   ← unread notification count
```

### authSlice — How It Works

```typescript
// src/store/slices/authSlice.ts

interface AuthState {
    isAuthenticated: boolean;
    user: AuthUser | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;
}

const authSlice = createSlice({
    name: 'auth',
    initialState: { isAuthenticated: false, user: null, token: null, ... },
    reducers: {
        // Simple synchronous actions (like setter methods)
        logout: (state) => {
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
        },
    },
    // Async actions (API calls)
    extraReducers: (builder) => {
        builder
            .addCase(loginThunk.pending,   (state) => { state.isLoading = true; })
            .addCase(loginThunk.fulfilled, (state, action) => {
                state.isAuthenticated = true;
                state.user  = action.payload.user;
                state.token = action.payload.accessToken;
                state.isLoading = false;
            })
            .addCase(loginThunk.rejected,  (state, action) => {
                state.error = action.payload as string;
                state.isLoading = false;
            });
    },
});
```

### loginThunk — Async Action (like a @Service method)

```typescript
export const loginThunk = createAsyncThunk(
    'auth/login',
    async (credentials: LoginRequest, { rejectWithValue }) => {
        try {
            // 1. Call API
            const response = await authService.login(credentials);
            
            // 2. Save tokens to encrypted storage
            await storage.saveTokens(response.accessToken, response.refreshToken);
            
            // 3. Update Axios default header
            apiClient.defaults.headers.common['Authorization'] =
                `Bearer ${response.accessToken}`;
            
            // 4. Return data → goes to fulfilled case above
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message ?? 'Login failed');
        }
    }
);
```

### Reading and Writing State in Components

```tsx
// Reading state (like @Autowired + getter)
const user    = useAppSelector(s => s.auth.user);
const student = useAppSelector(s => s.student.selectedStudent);
const unread  = useAppSelector(s => s.notification.unreadCount);

// Writing state (like calling a service method)
const dispatch = useAppDispatch();

dispatch(logout());                              // synchronous action
dispatch(loginThunk({ email, password }));       // async thunk
dispatch(selectStudent(student));                // select a child
dispatch(setUnreadCount(5));                     // set badge count
```

### studentSlice — Selecting Active Child

```typescript
// src/store/slices/studentSlice.ts
const studentSlice = createSlice({
    name: 'student',
    initialState: {
        students: [] as Student[],
        selectedStudent: null as Student | null,
    },
    reducers: {
        setStudents: (state, action: PayloadAction<Student[]>) => {
            state.students = action.payload;
            // Auto-select first child if none selected
            if (!state.selectedStudent && action.payload.length > 0) {
                state.selectedStudent = action.payload[0];
            }
        },
        selectStudent: (state, action: PayloadAction<Student>) => {
            state.selectedStudent = action.payload;
        },
    },
});
```

---

## 8. Data Fetching with React Query + Axios

### Why React Query? (The Problem It Solves)

Every screen needs to:
1. Show a loading spinner while fetching
2. Show an error message if it fails
3. Show data when it arrives
4. Cache data so it doesn't refetch every time you navigate back
5. Refetch when the user pulls to refresh

React Query handles ALL of this for free.

### Basic useQuery Pattern

```tsx
// This single hook replaces: useState(isLoading) + useState(error) + useEffect(fetch)
const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['attendance', studentId, from, to],  // cache key (like a Map key)
    queryFn: () => attendanceService.getStudentAttendance(studentId, from, to),
    enabled: !!studentId,   // only run if studentId exists
    staleTime: 5 * 60 * 1000,  // cache for 5 minutes
});

// Use in JSX
if (isLoading) return <LoadingSpinner />;
if (isError)   return <ErrorView onRetry={refetch} />;
return <FlatList data={data} ... />;
```

### Query Keys — Like Cache Keys in Redis

```tsx
// Different keys = different cached responses
['attendance', 1, '2024-01-01', '2024-01-31']  // Student 1, January
['attendance', 1, '2024-02-01', '2024-02-28']  // Student 1, February
['attendance', 2, '2024-01-01', '2024-01-31']  // Student 2, January
```

When you navigate away and come back, if the cache is fresh (within `staleTime`), it shows cached data instantly — no loading spinner.

### useMutation — For POST/PUT/DELETE

```tsx
const mutation = useMutation({
    mutationFn: (data: FeePaymentRequest) => feeService.payFee(data),
    onSuccess: () => {
        Toast.show({ type: 'success', text1: 'Payment successful!' });
        navigation.goBack();
    },
    onError: (error) => {
        Toast.show({ type: 'error', text1: 'Payment failed' });
    },
});

// Trigger it
<AppButton
    title="Pay Now"
    loading={mutation.isPending}
    onPress={() => mutation.mutate({ feeIds, method: 'UPI' })}
/>
```

### API Services — One File Per Domain

Each file in `src/api/services/` maps directly to a backend controller.

```typescript
// src/api/services/attendanceService.ts
import apiClient from '@api/client';
import { ApiResponse, AttendanceRecord } from '@app-types/index';
import { API_ENDPOINTS } from '@constants/api';

export const attendanceService = {
    // GET /api/v1/attendance/student/{id}?from=...&to=...
    getStudentAttendance: async (
        studentId: number,
        from: string,
        to: string
    ): Promise<AttendanceRecord[]> => {
        const response = await apiClient.get<ApiResponse<AttendanceRecord[]>>(
            API_ENDPOINTS.ATTENDANCE.STUDENT(studentId),
            { params: { from, to } }
        );
        return response.data.data;  // unwrap the ApiResponse wrapper
    },

    // GET /api/v1/attendance/student/{id}/percentage
    getAttendancePercentage: async (
        studentId: number,
        from: string,
        to: string
    ): Promise<number> => {
        const response = await apiClient.get<ApiResponse<number>>(
            API_ENDPOINTS.ATTENDANCE.PERCENTAGE(studentId),
            { params: { from, to } }
        );
        return response.data.data;
    },
};
```

### API Endpoints Constants — `src/constants/api.ts`

```typescript
// All endpoint paths in one place (like @RequestMapping paths)
export const WS_URL = process.env.WS_URL ?? 'ws://10.0.2.2:8080';
export const API_BASE_URL = process.env.API_BASE_URL ?? 'http://10.0.2.2:8080';

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN:   '/api/v1/auth/login',
        REFRESH: '/api/v1/auth/refresh',
        LOGOUT:  '/api/v1/auth/logout',
    },
    STUDENT: {
        MY_STUDENTS: '/api/v1/students/my-children',
        DASHBOARD:   '/api/v1/students/dashboard',
    },
    ATTENDANCE: {
        STUDENT:    (id: number) => `/api/v1/attendance/student/${id}`,
        PERCENTAGE: (id: number) => `/api/v1/attendance/student/${id}/percentage`,
    },
    FEE: {
        STUDENT: (id: number) => `/api/v1/fees/student/${id}`,
        PAY:     '/api/v1/fees/pay',
    },
    // ... etc
};
```

---

## 9. JWT Auth — Interceptors & Secure Storage

### The Axios Client — `src/api/client.ts`

This is the heart of the API layer. Like a Spring `RestTemplate` with interceptors.

```typescript
import axios from 'axios';
import { storage } from '@utils/storage';
import { API_BASE_URL, API_ENDPOINTS } from '@constants/api';

// Create Axios instance with base URL
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

// ── REQUEST INTERCEPTOR ──────────────────────────────────────────────
// Runs before EVERY request — attaches the Bearer token
apiClient.interceptors.request.use(async (config) => {
    const token = await storage.getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── RESPONSE INTERCEPTOR ─────────────────────────────────────────────
// Token refresh queue (prevents multiple simultaneous refresh calls)
let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

apiClient.interceptors.response.use(
    (response) => response,   // success — pass through
    async (error) => {
        const originalRequest = error.config;

        // If 401 and we haven't already retried this request
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Another refresh is in progress — queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Get saved refresh token
                const refreshToken = await storage.getRefreshToken();

                // Call refresh endpoint
                const { data } = await axios.post(
                    `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
                    { refreshToken }
                );

                // Save new tokens
                await storage.saveTokens(data.data.accessToken, data.data.refreshToken);
                apiClient.defaults.headers.common['Authorization'] =
                    `Bearer ${data.data.accessToken}`;

                // Retry queued requests with new token
                failedQueue.forEach(({ resolve }) => resolve(data.data.accessToken));
                failedQueue = [];

                // Retry the original failed request
                return apiClient(originalRequest);

            } catch (refreshError) {
                // Refresh failed — clear everything, redirect to login
                failedQueue.forEach(({ reject }) => reject(refreshError));
                failedQueue = [];
                await storage.clearTokens();
                // Redux dispatch logout (handled elsewhere)
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
```

### Secure Storage — `src/utils/storage.ts`

Tokens are stored in the device's **encrypted keychain** (not plain SharedPreferences).

```typescript
import EncryptedStorage from 'react-native-encrypted-storage';

const KEYS = {
    ACCESS_TOKEN:  'sms_access_token',
    REFRESH_TOKEN: 'sms_refresh_token',
};

export const storage = {
    saveTokens: async (accessToken: string, refreshToken: string) => {
        await EncryptedStorage.setItem(KEYS.ACCESS_TOKEN,  accessToken);
        await EncryptedStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken);
    },

    getAccessToken:  () => EncryptedStorage.getItem(KEYS.ACCESS_TOKEN),
    getRefreshToken: () => EncryptedStorage.getItem(KEYS.REFRESH_TOKEN),

    clearTokens: async () => {
        await EncryptedStorage.removeItem(KEYS.ACCESS_TOKEN);
        await EncryptedStorage.removeItem(KEYS.REFRESH_TOKEN);
    },
};
```

On Android this uses the **Android Keystore**. On iOS it uses the **iOS Keychain**. Much more secure than AsyncStorage (which is plain text).

---

## 10. Screen-by-Screen Walkthrough

### LoginScreen — `src/screens/auth/LoginScreen.tsx`

**What it does:** Form validation → dispatch loginThunk → token saved → navigate to Dashboard

```tsx
const LoginScreen = () => {
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const dispatch   = useAppDispatch();
    const isLoading  = useAppSelector(s => s.auth.isLoading);
    const error      = useAppSelector(s => s.auth.error);
    const navigation = useNavigation<any>();

    const handleLogin = async () => {
        if (!email || !password) return;
        const result = await dispatch(loginThunk({ email, password }));
        // If login succeeded, AppNavigator automatically switches to MainStack
        // because isAuthenticated in Redux becomes true
    };

    return (
        <View>
            <AppInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                keyboardType="email-address"
            />
            <AppInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry
            />
            {error && <Text style={{ color: 'red' }}>{error}</Text>}
            <AppButton
                title="Sign In"
                onPress={handleLogin}
                loading={isLoading}
            />
        </View>
    );
};
```

**Flow:**
```
User fills form → tap "Sign In"
→ loginThunk dispatched
→ POST /api/v1/auth/login called
→ JWT saved to encrypted storage
→ Redux: isAuthenticated = true
→ AppNavigator re-renders
→ MainStack shown (tabs appear)
```

---

### DashboardScreen — `src/screens/dashboard/DashboardScreen.tsx`

**What it does:** Shows student switcher chips + feature grid + stats

```tsx
const DashboardScreen = () => {
    const dispatch = useAppDispatch();
    const { selectedStudent, students } = useAppSelector(s => s.student);
    const user = useAppSelector(s => s.auth.user);

    // Fetch the parent's children
    const { data: studentsData } = useQuery({
        queryKey: ['my-students'],
        queryFn: studentService.getMyStudents,  // GET /api/v1/students/my-children
    });

    // When students arrive, save to Redux
    useEffect(() => {
        if (studentsData) dispatch(setStudents(studentsData));
    }, [studentsData, dispatch]);

    // Fetch dashboard stats
    const { data: stats } = useQuery({
        queryKey: ['dashboard'],
        queryFn: studentService.getDashboard,   // GET /api/v1/students/dashboard
    });

    return (
        <ScrollView>
            {/* Student switcher — horizontal chips */}
            <ScrollView horizontal>
                {students.map(s => (
                    <TouchableOpacity
                        key={s.id}
                        onPress={() => dispatch(selectStudent(s))}>
                        <Text>{s.firstName}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Stats row */}
            <StatCard label="Fees Due" value={formatCurrency(stats?.totalFeesPendingThisMonth)} />

            {/* Feature grid — 10 menu items */}
            {MENU_ITEMS.map(item => (
                <TouchableOpacity
                    key={item.screen}
                    onPress={() => navigation.navigate(item.screen)}>
                    <Icon name={item.icon} />
                    <Text>{item.label}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};
```

---

### AttendanceScreen — `src/screens/attendance/AttendanceScreen.tsx`

**What it does:** Month picker → fetches records + percentage → renders daily list

Key pattern — **month state drives query**:
```tsx
const [month, setMonth] = useState(new Date());

// Derived values from state
const from = format(startOfMonth(month), 'yyyy-MM-dd');  // "2024-01-01"
const to   = format(endOfMonth(month),   'yyyy-MM-dd');  // "2024-01-31"

// Query re-runs whenever from/to changes (i.e., when month changes)
const { data: records } = useQuery({
    queryKey: ['attendance', student?.id, from, to],
    queryFn: () => attendanceService.getStudentAttendance(student!.id, from, to),
});

// Navigate months
const prevMonth = () => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
const nextMonth = () => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));
```

---

### FeeHistoryScreen — `src/screens/fees/FeeHistoryScreen.tsx`

**What it does:** Multi-select pending fees → calculate total → navigate to payment

```tsx
const [selectedIds, setSelectedIds] = useState<number[]>([]);

// Toggle selection
const toggleFee = (id: number) => {
    setSelectedIds(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
};

// Total of selected
const total = fees
    ?.filter(f => selectedIds.includes(f.id))
    .reduce((sum, f) => sum + (f.amount - f.paidAmount), 0) ?? 0;

// Pay button
<AppButton
    title={`Pay ₹${total.toLocaleString()}`}
    onPress={() => navigation.navigate('FeePayment', {
        feeIds: selectedIds,
        totalAmount: total,
    })}
    disabled={selectedIds.length === 0}
/>
```

---

### BusTrackingScreen — `src/screens/bus/BusTrackingScreen.tsx`

**What it does:** Google Maps + Socket.IO WebSocket for live bus GPS

```tsx
const mapRef   = useRef<MapView>(null);         // reference to the map
const socketRef = useRef<Socket | null>(null);  // reference to socket

const [busLocation, setBusLocation] = useState<BusLocation | null>(null);

// Fetch initial route info
const { data: busRoute } = useQuery({
    queryKey: ['bus-route', student?.id],
    queryFn: () => busService.getStudentBus(student!.id),
});

// When route loaded, fetch current location
useEffect(() => {
    if (!busRoute) return;
    busService.getBusLocation(busRoute.vehicleId)
        .then(loc => setBusLocation(loc))
        .catch(() => {});
}, [busRoute]);

// WebSocket for live updates
useEffect(() => {
    if (!vehicleId) return;

    const socket = io(WS_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    // Listen for bus location updates
    socket.on(`bus/${vehicleId}`, (data: BusLocation) => {
        setBusLocation(data);
        // Smoothly animate map to new position
        mapRef.current?.animateToRegion({
            latitude: data.latitude,
            longitude: data.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        }, 500);
    });

    return () => socket.disconnect();  // cleanup on unmount
}, [vehicleId]);

return (
    <MapView ref={mapRef} provider={PROVIDER_GOOGLE} style={{ flex: 1 }}>
        {busLocation && (
            <Marker coordinate={{ latitude: busLocation.latitude, longitude: busLocation.longitude }}>
                <Icon name="bus" size={22} />
            </Marker>
        )}
        {/* Route polyline */}
        <Polyline
            coordinates={busRoute?.stops.map(s => ({ latitude: s.latitude, longitude: s.longitude }))}
            strokeColor="#4F46E5"
            strokeWidth={3}
        />
    </MapView>
);
```

---

## 11. Reusable Components

Located in `src/components/common/`. These are your UI building blocks.

### AppButton — `src/components/common/AppButton.tsx`

```tsx
interface Props {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: 'primary' | 'outline' | 'ghost';
}

const AppButton: React.FC<Props> = ({
    title, onPress, loading = false, disabled = false, variant = 'primary'
}) => {
    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isDisabled}
            style={[styles.base, styles[variant], isDisabled && styles.disabled]}>

            {loading ? (
                <ActivityIndicator color={variant === 'primary' ? '#fff' : Colors.primary} />
            ) : (
                <Text style={[styles.text, variant !== 'primary' && styles.textDark]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};
```

### Card — `src/components/common/Card.tsx`

```tsx
const Card = ({ children, style, padding = 16 }) => (
    <View style={[styles.card, { padding }, style]}>
        {children}
    </View>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        ...Sizes.shadowMd,  // shadow on both Android (elevation) and iOS
    },
});
```

### Header — `src/components/common/Header.tsx`

```tsx
const Header = ({ title, subtitle, onBack }) => (
    <LinearGradient colors={Colors.gradientPrimary} style={styles.header}>
        {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                <Icon name="arrow-left" size={22} color={Colors.white} />
            </TouchableOpacity>
        )}
        <View>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
    </LinearGradient>
);
```

### LoadingSpinner — `src/components/common/LoadingSpinner.tsx`

```tsx
const LoadingSpinner = ({ message, fullScreen = false }) => {
    const content = (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={Colors.primary} />
            {message && <Text style={styles.message}>{message}</Text>}
        </View>
    );

    return fullScreen ? (
        <View style={[styles.container, { flex: 1 }]}>{content}</View>
    ) : content;
};
```

### EmptyState — `src/components/common/EmptyState.tsx`

```tsx
const EmptyState = ({ icon, title, subtitle, onAction, actionLabel }) => (
    <View style={styles.container}>
        <Icon name={icon} size={64} color={Colors.border} />
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {onAction && (
            <AppButton title={actionLabel!} onPress={onAction} variant="outline" />
        )}
    </View>
);
```

---

## 12. Hooks — Custom Logic Reuse

Hooks are functions that start with `use` and can hold state and effects. Like a Spring `@Service` that can also hold component state.

### useBusTracking — `src/hooks/useBusTracking.ts`

If multiple screens needed the bus WebSocket, they'd all use this hook:

```typescript
export const useBusTracking = (vehicleId: number | undefined) => {
    const [location, setLocation] = useState<BusLocation | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!vehicleId) return;

        const socket = io(WS_URL, { transports: ['websocket'] });

        socket.on('connect',    () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));
        socket.on(`bus/${vehicleId}`, (data: BusLocation) => setLocation(data));

        return () => socket.disconnect();
    }, [vehicleId]);

    return { location, connected };
};

// Usage in any screen:
const { location, connected } = useBusTracking(vehicleId);
```

### useNotifications — `src/hooks/useNotifications.ts`

```typescript
export const useNotifications = (isAuthenticated: boolean) => {
    const dispatch = useAppDispatch();

    // Poll unread count every 30 seconds
    useEffect(() => {
        if (!isAuthenticated) return;
        const fetchCount = async () => {
            const count = await notificationService.getUnreadCount();
            dispatch(setUnreadCount(count));
        };
        fetchCount();
        const interval = setInterval(fetchCount, 30_000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    // Firebase push notification setup (optional)
    useEffect(() => {
        if (!isAuthenticated) return;
        const setupFCM = async () => {
            try {
                let messaging: any;
                try { messaging = require('@react-native-firebase/messaging').default; }
                catch { return; }

                const permission = await messaging().requestPermission();
                if (permission) {
                    const token = await messaging().getToken();
                    await notificationService.registerFcmToken(token, 'ANDROID', 'SMS Parent');
                }
                messaging().onMessage(async () => {
                    dispatch(incrementUnread());
                });
            } catch { /* Firebase not configured */ }
        };
        setupFCM();
    }, [isAuthenticated]);
};
```

---

## 13. The Full App Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          App.tsx                                 │
│   Redux Provider → QueryClient Provider → SafeArea Provider     │
│                    AppNavigator                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
           ┌─────────────┴─────────────┐
           │ isAuthenticated in Redux?  │
           └──────┬────────────────────┘
                  │
        NO ───────┤──────── YES
        │                   │
   AuthStack           MainStack (Tabs)
        │                   │
  LoginScreen     ┌─────────┼─────────┬─────────┬──────────┐
                  │         │         │         │          │
              Dashboard  Attendance  Fees   Notifications Profile
                  │
           (tap menu item)
                  │
        ┌─────────┼──────────────────┐
        │         │                  │
    Homework  Timetable         BusTracking
                               (WebSocket)
```

### JWT Token Lifecycle

```
App Start
    │
    ▼
restoreSession() — read token from EncryptedStorage
    │
    ├── Token found + valid → isAuthenticated = true → show tabs
    │
    └── No token → show Login

API Call Made (any screen)
    │
    ▼
Axios request interceptor adds: Authorization: Bearer <token>
    │
    ▼
Backend validates token
    │
    ├── Valid → 200 OK → data returned to useQuery
    │
    └── Expired → 401
              │
              ▼
         Response interceptor intercepts 401
              │
              ▼
         POST /auth/refresh with refresh token
              │
              ├── Success → save new token → retry original request
              │
              └── Fail → clearTokens() → dispatch(logout()) → Login screen
```

---

## 14. How to Add a New Feature

Let's say you want to add a **Homework Submission** screen.

### Step 1 — Add the Type

```typescript
// src/types/index.ts
export interface HomeworkSubmission {
    id: number;
    homeworkId: number;
    studentId: number;
    submittedAt: string;
    fileUrl?: string;
    remarks?: string;
    status: 'SUBMITTED' | 'LATE' | 'GRADED';
    grade?: number;
}
```

### Step 2 — Add the API Service

```typescript
// src/api/services/homeworkService.ts (add to existing file)
submitHomework: async (
    homeworkId: number,
    studentId: number,
    fileUrl: string,
): Promise<HomeworkSubmission> => {
    const response = await apiClient.post<ApiResponse<HomeworkSubmission>>(
        `/api/v1/homework/${homeworkId}/submit`,
        { studentId, fileUrl }
    );
    return response.data.data;
},
```

### Step 3 — Add to Navigation Types

```typescript
// src/navigation/types.ts
export type RootStackParams = {
    // ... existing screens
    HomeworkSubmission: { homeworkId: number; homeworkTitle: string };
};
```

### Step 4 — Create the Screen

```tsx
// src/screens/homework/HomeworkSubmissionScreen.tsx
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { homeworkService } from '@api/services/homeworkService';
import AppButton from '@components/common/AppButton';

const HomeworkSubmissionScreen = () => {
    const route = useRoute<any>();
    const { homeworkId, homeworkTitle } = route.params;
    const [fileUrl, setFileUrl] = useState('');

    const mutation = useMutation({
        mutationFn: () => homeworkService.submitHomework(homeworkId, studentId, fileUrl),
        onSuccess: () => {
            Toast.show({ type: 'success', text1: 'Submitted!' });
            navigation.goBack();
        },
    });

    return (
        <View>
            <Text>{homeworkTitle}</Text>
            <AppButton
                title="Submit"
                onPress={() => mutation.mutate()}
                loading={mutation.isPending}
            />
        </View>
    );
};

export default HomeworkSubmissionScreen;
```

### Step 5 — Register in Navigator

```tsx
// src/navigation/AppNavigator.tsx (inside MainStack.Navigator)
import HomeworkSubmissionScreen from '@screens/homework/HomeworkSubmissionScreen';

<Stack.Screen name="HomeworkSubmission" component={HomeworkSubmissionScreen} />
```

### Step 6 — Navigate to it

```tsx
// From HomeworkScreen, add a button:
<AppButton
    title="Submit"
    onPress={() => navigation.navigate('HomeworkSubmission', {
        homeworkId: item.id,
        homeworkTitle: item.title,
    })}
/>
```

---

## 15. Common Errors & Fixes

### Error: "useSelector called outside of Provider"
```
Cause:  A component tried to use Redux before the Redux Provider was set up.
Fix:    Make sure App.tsx wraps everything in <Provider store={store}>.
```

### Error: "Cannot read properties of undefined (reading 'id')"
```
Cause:  student is null (no child selected) and you accessed student.id
Fix:    Guard with: if (!student) return <EmptyState ... />;
        Or use optional chaining: student?.id
```

### Error: "Maximum update depth exceeded"
```
Cause:  useEffect dependency causes infinite re-render loop
Example: useEffect(() => { dispatch(setData(x)); }, [dispatch, data]);
         → dispatch(setData) changes data → effect runs again → infinite loop
Fix:    Check your dependency array. If dispatch is stable, it's usually
        the data variable causing the loop. Remove it from deps if
        you don't want to react to data changes.
```

### Error: "Network request failed"
```
Cause:  Android emulator can't reach localhost (your machine's IP is 10.0.2.2 not localhost)
Fix:    In .env: API_BASE_URL=http://10.0.2.2:8080
        For physical device: API_BASE_URL=http://YOUR_LOCAL_IP:8080
```

### Error: "Invariant Violation: Text strings must be rendered within a <Text> component"
```
Cause:  You put a plain string directly in JSX without <Text>
Bad:    <View>{someNumber}</View>
Fix:    <View><Text>{String(someNumber)}</Text></View>
```

### Error: "Cannot find module 'babel-plugin-module-resolver'"
```
Cause:  The babel plugin for path aliases is not installed
Fix:    npm install --save-dev babel-plugin-module-resolver --legacy-peer-deps
```

### Error: TypeScript "onSuccess does not exist in type UseQueryOptions" (React Query v5)
```
Cause:  React Query v5 removed onSuccess from useQuery options
Fix:    Use useEffect watching the data:
        const { data } = useQuery({ ... });
        useEffect(() => { if (data) doSomething(data); }, [data]);
```

### Error: "StyleSheet: inset is not a valid style property"
```
Cause:  CSS shorthand 'inset: 0' is not supported in React Native
Fix:    Use: top: 0, left: 0, right: 0, bottom: 0
```

### Warning: "Each child in a list should have a unique 'key' prop"
```
Cause:  FlatList or .map() without keyExtractor or key prop
Fix:    In FlatList:  keyExtractor={item => String(item.id)}
        In .map():    {items.map(item => <View key={item.id}>...)}
```

---

## Quick Reference Cheatsheet

### Hooks Summary

| Hook | What it does | Java equivalent |
|---|---|---|
| `useState(val)` | Local mutable state | Instance field + setter |
| `useEffect(fn, [deps])` | Side effects on mount/change | `@PostConstruct` / property change listener |
| `useRef(val)` | Mutable ref, doesn't re-render | Non-reactive field |
| `useMemo(fn, [deps])` | Computed/cached value | Cached computation |
| `useCallback(fn, [deps])` | Memoized function | — |
| `useNavigation()` | Access navigator | — |
| `useRoute()` | Access route params | `@PathVariable` |
| `useQuery(...)` | Fetch + cache data | `@Service.findAll()` |
| `useMutation(...)` | POST/PUT/DELETE | `@Service.save()` |
| `useAppSelector(...)` | Read Redux state | `@Autowired Service.getData()` |
| `useAppDispatch()` | Write Redux state | `@Autowired Service.update()` |

### Component Lifecycle (when things run)

```
Component created
    → useState initial values set
    → Component renders (JSX returned)
    → useEffect with [] runs (one-time setup)

State changes / Props change
    → Component re-renders
    → useEffect with matching deps runs

Component removed
    → useEffect cleanup functions run (return () => ...)
```

### The 10 Files You'll Touch Most

| File | What you change |
|---|---|
| `src/types/index.ts` | Add a new data type/interface |
| `src/constants/api.ts` | Add a new API endpoint path |
| `src/api/services/xService.ts` | Add a new API call |
| `src/screens/x/XScreen.tsx` | Build/modify a screen |
| `src/navigation/types.ts` | Add a new screen's params |
| `src/navigation/AppNavigator.tsx` | Register a new screen |
| `src/store/slices/xSlice.ts` | Add new global state |
| `src/components/common/` | Add/modify a shared component |
| `src/constants/colors.ts` | Change colors |
| `.env` | Change API URL |

---

## 16. App Startup — First Screen & Full Boot Flow

This is the most important section if you want to understand how everything connects from the moment the user taps the app icon.

---

### What happens the instant the user opens the app?

```
User taps app icon
       │
       ▼
Android loads the native activity (MainActivity.java)
       │
       ▼
Hermes JS engine starts
       │
       ▼
index.js runs          ← entry point, like main() in Java
       │
       ▼
App.tsx renders        ← all providers set up here
       │
       ▼
AppNavigator renders   ← isLoading = true at this point
       │
       ▼
SplashScreen shown     ← first screen the user ALWAYS sees
       │
       ▼  (async: reads EncryptedStorage)
bootstrap() runs
       │
       ├── token found? → restoreSession() → isAuthenticated = true
       │                                           │
       │                                           ▼
       │                                      setIsLoading(false)
       │                                           │
       │                                           ▼
       │                                    Dashboard (Tab Home)
       │
       └── no token?   → setIsLoading(false)
                                  │
                                  ▼
                             Login Screen
```

---

### Step 1 — `index.js` (The true entry point)

```javascript
// index.js — this is what Android/iOS calls first
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';  // "SMSParentApp"

// Like SpringApplication.run(App.class) — registers the root component
AppRegistry.registerComponent(appName, () => App);
```

This is the `main()` of the app. It tells the native layer: "when you need a UI, render `App`."

---

### Step 2 — `App.tsx` (Providers setup)

```tsx
// App.tsx — wraps everything in infrastructure providers
const App = () => (
  <GestureHandlerRootView style={{ flex: 1 }}>

    {/* Redux store — global state available everywhere */}
    <Provider store={store}>

      {/* React Query client — caching and data fetching */}
      <QueryClientProvider client={queryClient}>

        {/* Safe area — handles notch/home bar on all devices */}
        <SafeAreaProvider>

          {/* Status bar color */}
          <StatusBar barStyle="light-content" backgroundColor="#3730A3" translucent />

          {/* THE NAVIGATOR — decides which screen to show */}
          <AppNavigator />

          {/* Toast messages (success/error popups) */}
          <Toast />

        </SafeAreaProvider>
      </QueryClientProvider>
    </Provider>
  </GestureHandlerRootView>
);
```

Think of this like Spring Boot's application context startup — all infrastructure is wired before any business logic runs.

---

### Step 3 — `AppNavigator.tsx` (The auth guard + splash logic)

This is the most critical file for understanding the startup flow.

```tsx
// src/navigation/AppNavigator.tsx

const AppNavigator = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector(s => s.auth);

  // isLoading = true initially → shows SplashScreen
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    // This runs ONCE when the navigator mounts (app start)
    const bootstrap = async () => {
      try {
        // Read token from encrypted device storage
        const token = await getAccessToken();

        if (token) {
          // Token exists — also read saved user profile
          const user = await getUser<AuthUser>();
          if (user) {
            // Restore session in Redux — sets isAuthenticated = true
            dispatch(restoreSession(user));
          }
        }
        // If no token: do nothing, isAuthenticated stays false
      } catch {
        // Storage read failed — treat as logged out
      } finally {
        // Always hide splash screen when done
        setIsLoading(false);
      }
    };

    bootstrap();
  }, [dispatch]);

  // ── WHAT THE USER SEES ───────────────────────────────────────────
  // Phase 1: isLoading = true  → SplashScreen (always, first)
  if (isLoading) return <SplashScreen />;

  // Phase 2: isLoading = false → NavigationContainer decides
  return (
    <NavigationContainer>
      {isAuthenticated ? (
        // Has valid session → jump straight to home tabs
        <RootNavigator />
      ) : (
        // No session → show Login
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
};
```

---

### Step 4 — `SplashScreen.tsx` (First visual the user sees)

```tsx
// src/screens/splash/SplashScreen.tsx

const SplashScreen = () => {
  // Animation values — start small and invisible
  const scaleAnim   = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Run both animations together the moment screen mounts
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,          // grow from 0.5 to full size
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,          // fade in over 600ms
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    // Full screen indigo-to-purple gradient
    <LinearGradient colors={['#4F46E5', '#7C3AED']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>

      {/* Animated logo — springs in from center */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
        <View style={/* white circle */ {}}>
          <Icon name="school" size={52} color="#4F46E5" />
        </View>
        <Text style={/* white text */ {}}>SMS Parent</Text>
        <Text>School Management System</Text>
      </Animated.View>

      <Text style={/* bottom */ {}}>v1.0.0</Text>
    </LinearGradient>
  );
};
```

**UI result:** User sees a purple gradient full screen, with a white circle containing a school icon, animated springing in from center, fading in over 600ms. Version number at the bottom.

---

### Step 5A — If token found: Dashboard shown

When `bootstrap()` finds a saved token, `restoreSession()` sets `isAuthenticated = true` in Redux, `setIsLoading(false)` hides the splash, and `RootNavigator` renders with `TabNavigator` as the first screen — which means **Dashboard tab is shown by default**.

```
SplashScreen (600ms animation)
       │
       ▼  (bootstrap reads token from EncryptedStorage — async)
       │
       ▼  token found
Dashboard (Home tab) ← user lands here directly, no login needed
```

---

### Step 5B — If no token: Login screen shown

```
SplashScreen (animation plays while checking storage)
       │
       ▼  no token found
Login Screen
```

---

### Step 6 — `LoginScreen.tsx` (Detailed)

**What the user sees:**
- Top half: indigo-to-purple gradient hero with school logo, "Welcome Back" text
- Bottom half: white card (overlapping the gradient by -32px margin-top) with:
  - "Sign In" heading
  - Email input with mail icon
  - Password input with lock icon + show/hide toggle
  - "Forgot Password?" link (right aligned)
  - "Sign In" button (full width, gradient)
  - Demo credentials hint: `parent@dpsdemo.edu / Parent@1234`

**What the code does step by step:**

```tsx
const LoginScreen = () => {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors]   = useState<{ email?: string; password?: string }>({});

  const dispatch   = useAppDispatch();
  const { isLoading } = useAppSelector(s => s.auth);

  // ── VALIDATION ───────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email.trim())
      newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = 'Enter a valid email address';
    if (!password)
      newErrors.password = 'Password is required';
    else if (password.length < 6)
      newErrors.password = 'Minimum 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── LOGIN HANDLER ────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!validate()) return;   // shows red error messages under inputs

    // Dispatch async thunk — this does:
    //   1. POST /api/v1/auth/login
    //   2. Saves JWT tokens to EncryptedStorage
    //   3. Saves user profile to EncryptedStorage
    //   4. Redux: isAuthenticated = true
    const result = await dispatch(loginThunk({ email: email.trim(), password }));

    if (loginThunk.rejected.match(result)) {
      // Server said invalid credentials
      Alert.alert('Login Failed', result.payload as string);
    }
    // If fulfilled: AppNavigator auto-switches to RootNavigator (tabs)
    // No explicit navigation.navigate() needed!
  };
```

**Key insight for Java devs:** There is **no `navigation.navigate('Dashboard')`** after login. Instead, when `isAuthenticated` becomes `true` in Redux, `AppNavigator` re-renders and switches the entire tree from `AuthStack` to `RootNavigator`. React's reactive rendering handles the transition automatically.

---

### Step 7 — After login: `loginThunk` internals

```typescript
// src/store/slices/authSlice.ts
export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      // 1. HTTP POST to backend
      const data = await authService.login(credentials);
      // data = { accessToken, refreshToken, userId, email, fullName, roles, schoolId }

      // 2. Save both tokens encrypted on device
      await saveTokens(data.accessToken, data.refreshToken);

      // 3. Build user object and save to storage (for next app start)
      const user: AuthUser = {
        userId: data.userId,
        schoolId: data.schoolId,
        email: data.email,
        fullName: data.fullName,
        roles: data.roles,
      };
      await saveUser(user);

      // 4. Return user → goes to loginThunk.fulfilled case in reducer
      return user;
    } catch (err: any) {
      const message = err.response?.data?.message ?? 'Login failed. Please try again.';
      return rejectWithValue(message);   // → goes to loginThunk.rejected
    }
  },
);

// In the slice reducer:
.addCase(loginThunk.fulfilled, (state, action) => {
  state.isLoading = false;
  state.user = action.payload;          // ← user object stored
  state.isAuthenticated = true;         // ← THIS triggers AppNavigator to switch
})
```

---

### Step 8 — `TabNavigator.tsx` (Home screen after login)

Once authenticated, the first thing shown is the bottom tab navigator with 5 tabs:

```
┌──────────────────────────────────────────────┐
│              Dashboard Content                │
│                                               │
│  [Student chips] [Stats] [Menu Grid]         │
│                                               │
│                                               │
│                                               │
├──────┬──────────┬──────┬───────────┬─────────┤
│ 🏠   │  📅      │  💰  │  🔔       │  👤     │
│ Home │Attendance│ Fees │ Alerts[3] │ Profile │
└──────┴──────────┴──────┴───────────┴─────────┘
```

- Active tab icon is **filled** (e.g., `view-dashboard` vs `view-dashboard-outline`)
- Notification tab shows a **red badge** with unread count if > 0
- Default tab is **Dashboard** (first registered tab)

```tsx
// TabNavigator registers 5 tabs in order
<Tab.Screen name="Dashboard"     component={DashboardScreen}     options={{ title: 'Home' }} />
<Tab.Screen name="Attendance"    component={AttendanceScreen}    options={{ title: 'Attendance' }} />
<Tab.Screen name="Fees"          component={FeesScreen}          options={{ title: 'Fees' }} />
<Tab.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Alerts' }} />
<Tab.Screen name="Profile"       component={ProfileScreen}       options={{ title: 'Profile' }} />
```

The first screen in `Tab.Navigator` is always the default. So after login → **Dashboard is the first tab shown**.

---

### Complete Visual Flow — Both Scenarios

#### Scenario A: First time install / logged out

```
App icon tapped
       │
       ▼
┌──────────────────────────────┐
│  SPLASH SCREEN               │  ← purple gradient, logo springs in
│  (while checking storage)    │     ~200-500ms depending on device
└──────────────┬───────────────┘
               │ no token found
               ▼
┌──────────────────────────────┐
│  LOGIN SCREEN                │  ← gradient hero top, white card bottom
│  ┌────────────────────────┐  │
│  │  📧 Email              │  │  ← email input
│  │  🔒 Password           │  │  ← password input
│  │  [    Sign In    ]     │  │  ← button (shows spinner when loading)
│  │  Demo: parent@...      │  │  ← hint text
│  └────────────────────────┘  │
└──────────────┬───────────────┘
               │ user enters credentials + taps Sign In
               │
               │ POST /api/v1/auth/login  ← network call
               │
               ▼
┌──────────────────────────────┐
│  DASHBOARD (Tab: Home)       │  ← tabs appear at bottom
│  ┌──────────────────────┐    │
│  │ Good Morning 👋       │    │  ← gradient header
│  │ [Aarav] [Priya]      │    │  ← student switcher chips
│  ├──────────────────────┤    │
│  │ Attendance Homework  │    │  ← 2-column menu grid
│  │ Fees       Bus Track │    │
│  │ Results    Library   │    │
│  ├──────────────────────┤    │
│  │ Stats: ₹5,000 due    │    │
│  └──────────────────────┘    │
└──────────────────────────────┘
```

#### Scenario B: Returning user (has saved token)

```
App icon tapped
       │
       ▼
┌──────────────────────────────┐
│  SPLASH SCREEN               │  ← plays animation simultaneously
│  (reading token from         │     while storage is being read
│   EncryptedStorage)          │
└──────────────┬───────────────┘
               │ token + user found in storage
               ▼
┌──────────────────────────────┐
│  DASHBOARD (Tab: Home)       │  ← goes directly here, no login!
│  [already authenticated]     │
└──────────────────────────────┘
```

---

### Complete Startup Code Call Chain

```
index.js
  └── AppRegistry.registerComponent('SMSParentApp', () => App)

App.tsx renders
  └── <Provider store={store}>           // Redux ready
        └── <QueryClientProvider>        // React Query ready
              └── <AppNavigator />       // navigation starts

AppNavigator.tsx mounts
  ├── useState: isLoading = true
  ├── returns <SplashScreen />           // USER SEES THIS FIRST
  │
  └── useEffect runs: bootstrap()
        ├── getAccessToken()             // reads EncryptedStorage (async)
        │
        ├── IF token exists:
        │     getUser()                  // reads saved user profile
        │     dispatch(restoreSession(user))
        │     → authSlice: isAuthenticated = true
        │
        └── finally: setIsLoading(false)
              → re-renders AppNavigator
              → isLoading = false, isAuthenticated = true/false
              → shows RootNavigator (tabs) OR LoginScreen

RootNavigator (if authenticated)
  └── <TabNavigator /> as first screen
        └── Dashboard tab shown by default

LoginScreen (if not authenticated)
  └── user fills form → handleLogin()
        └── dispatch(loginThunk({email, password}))
              ├── authService.login()   // POST /api/v1/auth/login
              ├── saveTokens()          // EncryptedStorage
              ├── saveUser()            // EncryptedStorage
              └── Redux: isAuthenticated = true
                    → AppNavigator re-renders
                    → RootNavigator shown (tabs appear)
```

---

### Redux State at Each Stage

| Stage | `isAuthenticated` | `isLoading` (AppNavigator) | Screen shown |
|---|---|---|---|
| App just opened | `false` | `true` | SplashScreen |
| Token check in progress | `false` | `true` | SplashScreen |
| Token not found | `false` | `false` | LoginScreen |
| Token found, session restored | `true` | `false` | Dashboard |
| Login button pressed | `false` | `false` (auth.isLoading=true) | LoginScreen (button spinner) |
| Login API success | `true` | `false` | Dashboard |
| Login API failure | `false` | `false` | LoginScreen (error alert) |
| Logout tapped | `false` | `false` | LoginScreen |

---

### Why `isLoading` and `isAuthenticated` are separate

```typescript
// AppNavigator local state
const [isLoading, setIsLoading] = useState(true);

// Redux auth state
const { isAuthenticated } = useAppSelector(s => s.auth);
```

- `isLoading` (local) = "have we finished checking storage yet?" — controls whether to show splash
- `isAuthenticated` (Redux) = "does the user have a valid session?" — controls which stack to show

If you merged them into one variable, you couldn't distinguish between:
- "loading, don't know yet" (→ show splash)
- "done loading, not authenticated" (→ show login)
- "done loading, authenticated" (→ show tabs)

---

### Logout Flow

```
User taps "Sign Out" on ProfileScreen
       │
       ▼
Alert.alert('Sign Out?', 'Are you sure?', [{ text: 'Sign Out', onPress: handleLogout }])
       │
       ▼
dispatch(logoutThunk())
  ├── authService.logout()       // POST /api/v1/auth/logout (server-side token revoke)
  └── clearAllStorage()          // wipes EncryptedStorage (tokens + user)
       │
       ▼
logoutThunk.fulfilled case in reducer:
  state.isAuthenticated = false   ← THIS triggers AppNavigator
  state.user = null
       │
       ▼
AppNavigator re-renders
  → isAuthenticated = false → AuthStack shown → LoginScreen
```

No `navigation.navigate('Login')` anywhere. The auth state change drives the navigation automatically.

---

*Built with React Native 0.73 · TypeScript · Redux Toolkit · TanStack Query v5 · React Navigation v6*  
*SMS School Management System — Parent Mobile App*
