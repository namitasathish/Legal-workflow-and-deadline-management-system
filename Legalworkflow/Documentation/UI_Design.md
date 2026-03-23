# LexFlow — Master UI/UX Design Prompt for AI Code Agent

> Copy this prompt in full and pass it to your AI coding agent (Cursor, Claude Code, GitHub Copilot, etc.) when building or restyling any screen in the LexFlow Legal Workflow & CRM app. It covers the complete design system, every screen's specifications, component patterns, and implementation rules.

---

## 1. PROJECT CONTEXT

You are building **LexFlow**, a React Native (Expo) mobile application for legal professionals in India. It has two distinct user portals:

- **Lawyer Portal** — full case management, CRM, billing, scheduling, analytics
- **Client Portal** — read-only case tracking, document upload, chat, appointments

The app uses **Expo**, **React Navigation**, **SQLite (local)**, and **expo-font**. All UI must be built in React Native using `StyleSheet`, `View`, `Text`, `TouchableOpacity`, `FlatList`, `ScrollView`, and related RN primitives. Do not use any web-only CSS.

---

## 2. DESIGN PHILOSOPHY

The app must feel **premium, trustworthy, and modern** — comparable to a fintech or legaltech SaaS product. It should never look "vibe-coded" or generic.

**Core principles:**
- Every screen has a clear visual hierarchy: one dominant element, supporting elements, and muted supplementary info
- Color is used with intent — each portal has its own accent, each status has its own color
- Whitespace is generous — padding is never less than 16px on any side
- Empty states are illustrated, not just text
- Every interactive element has a visible pressed/active state
- Typography uses **Poppins** (loaded via `expo-font`) — never system default

---

## 3. TYPOGRAPHY SYSTEM

Load via `expo-font` at app root:

```js
// Load in App.js
const [fontsLoaded] = useFonts({
  'Poppins-Regular':  require('./assets/fonts/Poppins-Regular.ttf'),
  'Poppins-Medium':   require('./assets/fonts/Poppins-Medium.ttf'),
  'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
  'Poppins-Bold':     require('./assets/fonts/Poppins-Bold.ttf'),
});
```

**Type scale — use exactly these, no ad-hoc font sizes:**

| Token         | fontFamily        | fontSize | lineHeight | Usage                              |
|---------------|-------------------|----------|------------|------------------------------------|
| `heading-xl`  | Poppins-Bold      | 22       | 30         | Screen titles, hero text           |
| `heading-lg`  | Poppins-SemiBold  | 18       | 26         | Section headers                    |
| `heading-md`  | Poppins-SemiBold  | 15       | 22         | Card titles, case names            |
| `body-md`     | Poppins-Regular   | 14       | 21         | Standard body text                 |
| `body-sm`     | Poppins-Regular   | 12       | 18         | Secondary info, timestamps         |
| `label-caps`  | Poppins-Medium    | 11       | 14         | Uppercase section labels (letterSpacing: 0.8) |
| `label-sm`    | Poppins-Medium    | 11       | 15         | Tags, badges, nav labels           |
| `mono-sm`     | (system mono)     | 12       | 16         | Fee amounts, case IDs              |

---

## 4. COLOR SYSTEM

### 4.1 Lawyer Portal — Indigo/Slate

```js
const LAWYER_COLORS = {
  // Primary brand
  primary:        '#4338CA',   // indigo-700 — buttons, active tabs, highlights
  primaryLight:   '#EEF2FF',   // indigo-50 — icon backgrounds, badge fills
  primaryMid:     '#6366F1',   // indigo-500 — gradients, avatar bg

  // Neutral surfaces
  background:     '#F8FAFC',   // page background
  surface:        '#FFFFFF',   // cards, modals, sheets
  surfaceAlt:     '#F1F5F9',   // alternate row backgrounds
  border:         '#E2E8F0',   // card borders, dividers
  borderLight:    '#F1F5F9',   // subtle dividers inside cards

  // Text
  textPrimary:    '#1E293B',   // headings, primary content
  textSecondary:  '#475569',   // body, descriptions
  textMuted:      '#94A3B8',   // timestamps, placeholders, labels
  textOnDark:     '#FFFFFF',
  textOnDarkMuted:'rgba(255,255,255,0.6)',

  // Header gradient (use as LinearGradient colors prop)
  headerGrad:     ['#1E1B4B', '#312E81', '#1E3A5F'],

  // Semantic
  danger:         '#EF4444',
  dangerLight:    '#FFF1F2',
  dangerText:     '#BE123C',
  warning:        '#F59E0B',
  warningLight:   '#FEF3C7',
  warningText:    '#B45309',
  success:        '#10B981',
  successLight:   '#DCFCE7',
  successText:    '#16A34A',
  info:           '#3B82F6',
  infoLight:      '#EFF6FF',
  infoText:       '#1D4ED8',

  // Stat card accent colors
  statIndigo:     { bg: '#EEF2FF', icon: '#6366F1' },
  statRose:       { bg: '#FFF1F2', icon: '#F43F5E' },
  statTeal:       { bg: '#CCFBF1', icon: '#14B8A6' },
  statAmber:      { bg: '#FEF3C7', icon: '#F59E0B' },
};
```

### 4.2 Client Portal — Teal/Emerald

```js
const CLIENT_COLORS = {
  primary:        '#0D9488',   // teal-600
  primaryLight:   '#CCFBF1',   // teal-100
  primaryMid:     '#14B8A6',   // teal-500
  background:     '#F0FDFA',   // teal-50 page bg
  surface:        '#FFFFFF',
  border:         '#99F6E4',   // teal-200
  borderLight:    '#CCFBF1',
  textPrimary:    '#134E4A',   // teal-900
  textSecondary:  '#0F766E',   // teal-700
  textMuted:      '#5EEAD4',   // teal-300
  headerGrad:     ['#0D9488', '#059669'],
};
```

### 4.3 Priority & Status Colors

```js
const PRIORITY = {
  HIGH:   { bg: 'rgba(239,68,68,0.15)',   text: '#FCA5A5',  label: 'HIGH PRIORITY'   },
  MEDIUM: { bg: 'rgba(245,158,11,0.15)',  text: '#FDE68A',  label: 'MEDIUM PRIORITY' },
  LOW:    { bg: 'rgba(16,185,129,0.15)',  text: '#6EE7B7',  label: 'LOW PRIORITY'    },
};

const CASE_STATUS = {
  ACTIVE:    { color: '#6366F1', bg: '#EEF2FF' },
  URGENT:    { color: '#EF4444', bg: '#FFF1F2' },
  CLOSED:    { color: '#94A3B8', bg: '#F1F5F9' },
  SETTLED:   { color: '#10B981', bg: '#DCFCE7' },
};
```

---

## 5. SPACING & SHAPE TOKENS

```js
const SPACING = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 28,
};

const RADIUS = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  pill: 999,
};

const SHADOW = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};
```

---

## 6. SCREEN-BY-SCREEN SPECIFICATIONS

---

### 6.1 LOGIN SCREEN

**File:** `screens/auth/LoginScreen.js`

**Layout:**
```
┌─────────────────────────────┐
│  [StatusBar transparent]    │
│  ┌─────────────────────┐    │
│  │  GRADIENT HEADER    │    │  height: 220
│  │  [Logo]  LexFlow    │    │
│  │  "Legal Workflow.." │    │
│  └─────────────────────┘    │
│                             │
│  EMAIL ADDRESS              │
│  [___________________]      │
│                             │
│  PASSWORD                   │
│  [___________________]      │
│                       Forgot Password?
│                             │
│  [      Sign In      ]      │
│                             │
│  ────── OR ──────           │
│  Don't have an account? Register
└─────────────────────────────┘
```

**Header component:**
```js
// Use expo-linear-gradient
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={['#1E1B4B', '#312E81', '#1E3A5F']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.loginHeader}
>
  {/* Radial glow overlay: two Views with borderRadius:999 and rgba fills */}
  <View style={styles.glowOrb1} />
  <View style={styles.glowOrb2} />

  {/* Logo mark: frosted glass tile */}
  <View style={styles.logoMark}>
    {/* SVG or Image asset: document grid icon */}
  </View>
  <Text style={styles.appName}>LexFlow</Text>
  <Text style={styles.tagline}>Legal Workflow & CRM Platform</Text>
</LinearGradient>
```

**Logo mark styling:**
```js
logoMark: {
  width: 56, height: 56, borderRadius: 16,
  backgroundColor: 'rgba(255,255,255,0.15)',
  borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  alignItems: 'center', justifyContent: 'center',
  marginBottom: 12,
}
```

**Input field styling:**
```js
inputLabel: {
  fontFamily: 'Poppins-Medium', fontSize: 11,
  color: '#64748B', letterSpacing: 0.8,
  textTransform: 'uppercase', marginBottom: 6,
},
inputField: {
  height: 48, borderRadius: 12,
  borderWidth: 1, borderColor: '#E2E8F0',
  backgroundColor: '#F8FAFC',
  paddingHorizontal: 16,
  fontFamily: 'Poppins-Regular', fontSize: 14, color: '#1E293B',
  marginBottom: 14,
},
inputFieldFocused: {
  borderColor: '#6366F1', backgroundColor: '#FFFFFF',
},
```

**Primary button:**
```js
primaryBtn: {
  height: 50, borderRadius: 14,
  alignItems: 'center', justifyContent: 'center',
  // Use LinearGradient as wrapper
},
primaryBtnGrad: ['#4338CA', '#6366F1'],
primaryBtnText: {
  fontFamily: 'Poppins-SemiBold', fontSize: 15, color: '#fff',
  letterSpacing: 0.3,
},
```

**Rules:**
- `StatusBar` must be `translucent={true}` and `barStyle="light-content"` so gradient bleeds to edges
- "Forgot Password?" is a `TouchableOpacity` that shows a `Toast` or `Alert` saying "Feature coming soon" — do NOT omit it
- Role toggle is **NOT present** on this screen. Role is determined by the DB record on successful login
- Role selector appears only on `RegisterScreen.js` as a segmented control or two radio buttons

---

### 6.2 LAWYER DASHBOARD

**File:** `screens/lawyer/DashboardScreen.js`

**Layout:**
```
[StatusBar white]
[TopBar: Greeting + Avatar]
[StatsGrid 2×2]
[Section: Quick Access — 4×2 icon grid]
[Section: Recent Activity feed]
[BottomTabBar]
```

**Greeting card (TopBar):**
```js
// Compute greeting
const hour = new Date().getHours();
const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

// Render
<View style={styles.topBar}>
  <View>
    <Text style={styles.greetSub}>{greeting},</Text>
    <Text style={styles.greetName}>Counsel {lawyerName} 👋</Text>
  </View>
  <TouchableOpacity style={styles.avatarCircle}>
    <Text style={styles.avatarInitials}>{initials}</Text>
  </TouchableOpacity>
</View>
```
```js
avatarCircle: {
  width: 40, height: 40, borderRadius: 20,
  // LinearGradient with colors: ['#6366F1','#818CF8']
  alignItems: 'center', justifyContent: 'center',
},
```

**Stats grid — 2 columns, each card:**
```js
// Data definition
const stats = [
  { id: 'cases',    label: 'Active Cases',  value: 24, delta: '+3',  deltaType: 'up',   color: 'statIndigo' },
  { id: 'urgent',   label: 'Due This Week', value: 3,  delta: 'Urgent', deltaType: 'warn', color: 'statRose'   },
  { id: 'clients',  label: 'Total Clients', value: 18, delta: '+1',  deltaType: 'up',   color: 'statTeal'   },
  { id: 'billing',  label: 'Fees Pending',  value: '₹2.4L', delta: null, color: 'statAmber' },
];

// Card style
statCard: {
  flex: 1, backgroundColor: '#fff',
  borderRadius: RADIUS.lg, padding: 14,
  borderWidth: 0.5, borderColor: '#E2E8F0',
  ...SHADOW.card,
},
statIconBg: {
  width: 34, height: 34, borderRadius: 10,
  alignItems: 'center', justifyContent: 'center',
  marginBottom: 10,
},
statValue: {
  fontFamily: 'Poppins-Bold', fontSize: 22, color: '#1E293B',
},
statLabel: {
  fontFamily: 'Poppins-Regular', fontSize: 11, color: '#94A3B8', marginTop: 3,
},
deltaBadge: {
  position: 'absolute', top: 12, right: 12,
  paddingHorizontal: 7, paddingVertical: 2,
  borderRadius: 6,
},
```

**Animate stat values on mount:**
```js
// Use Animated.Value + timing on useFocusEffect
const animatedValue = useRef(new Animated.Value(0)).current;
useFocusEffect(useCallback(() => {
  animatedValue.setValue(0);
  Animated.timing(animatedValue, { toValue: 1, duration: 600, useNativeDriver: true }).start();
}, []));
// Apply opacity + translateY transform on each stat card
```

**Quick access shortcuts — 4 columns × 2 rows:**
```js
const shortcuts = [
  { id: 'cases',    icon: '📁', label: 'Cases',    bg: '#EEF2FF', badge: 2    },
  { id: 'clients',  icon: '👥', label: 'Clients',  bg: '#FFF7ED', badge: null },
  { id: 'calendar', icon: '📅', label: 'Calendar', bg: '#F0FDF4', badge: null },
  { id: 'messages', icon: '💬', label: 'Messages', bg: '#FDF4FF', badge: 5    },
  { id: 'docs',     icon: '📄', label: 'Docs',     bg: '#FFF1F2', badge: null },
  { id: 'billing',  icon: '💰', label: 'Billing',  bg: '#F0F9FF', badge: null },
  { id: 'bareacts', icon: '📜', label: 'Bare Acts',bg: '#FEFCE8', badge: null },
  { id: 'fir',      icon: '🚔', label: 'FIR',      bg: '#F8FAFC', badge: null },
];

// Badge dot: position absolute top-right of icon tile
// badge > 0: red circle with white count number
shortcutIcon: {
  width: 50, height: 50, borderRadius: 15,
  alignItems: 'center', justifyContent: 'center',
},
badgeDot: {
  position: 'absolute', top: -4, right: -4,
  width: 18, height: 18, borderRadius: 9,
  backgroundColor: '#EF4444',
  borderWidth: 2, borderColor: '#F8FAFC',
  alignItems: 'center', justifyContent: 'center',
},
badgeText: {
  fontFamily: 'Poppins-Bold', fontSize: 9, color: '#fff',
},
```

**Recent Activity feed — below shortcuts:**
```js
// 3 most recent activityLog entries
// Each item: colored dot + event text (bold entity name) + relative time

activityItem: {
  flexDirection: 'row', gap: 10, alignItems: 'flex-start',
  marginBottom: 10,
},
activityDot: {
  width: 8, height: 8, borderRadius: 4, marginTop: 6,
},
activityText: {
  flex: 1, fontFamily: 'Poppins-Regular', fontSize: 12, color: '#475569', lineHeight: 18,
},
activityTime: {
  fontFamily: 'Poppins-Regular', fontSize: 10, color: '#94A3B8',
},
```

**Pull-to-Refresh:** Add `RefreshControl` to the outer `ScrollView`:
```js
<ScrollView
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366F1" />
  }
>
```

---

### 6.3 CASE DETAIL SCREEN

**File:** `screens/lawyer/CaseDetailScreen.js`

**This screen replaces the current monolithic scroll with a tabbed layout.**

**Header (dark gradient):**
```js
<LinearGradient
  colors={['#1E293B', '#0F172A']}
  start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 1 }}
  style={styles.caseHeader}
>
  {/* Back navigation */}
  <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
    <Ionicons name="chevron-back" size={16} color="rgba(255,255,255,0.5)" />
    <Text style={styles.backText}>My Cases</Text>
  </TouchableOpacity>

  {/* Priority badge */}
  <View style={[styles.priorityBadge, { backgroundColor: PRIORITY[case.priority].bg }]}>
    <Text style={[styles.priorityText, { color: PRIORITY[case.priority].text }]}>
      {PRIORITY[case.priority].label}
    </Text>
  </View>

  <Text style={styles.caseTitle}>{case.title}</Text>
  <Text style={styles.caseMeta}>{case.court} · Filed {formatDate(case.filingDate)}</Text>

  {/* Hearing card */}
  <View style={styles.hearingCard}>
    <View>
      <Text style={styles.hearingLabel}>NEXT HEARING</Text>
      <Text style={styles.hearingDate}>{formatDate(case.nextHearingDate)}</Text>
    </View>
    {daysUntil <= 7 && (
      <View style={styles.urgencyPill}>
        <Text style={styles.urgencyText}>{daysUntil} days away</Text>
      </View>
    )}
  </View>
</LinearGradient>
```
```js
hearingCard: {
  marginTop: 14,
  backgroundColor: 'rgba(255,255,255,0.08)',
  borderRadius: 12, padding: 14,
  borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
},
urgencyPill: {
  backgroundColor: 'rgba(239,68,68,0.25)',
  paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
},
urgencyText: {
  fontFamily: 'Poppins-SemiBold', fontSize: 11, color: '#FCA5A5',
},
```

**Tab bar (horizontal):**
```js
const TABS = ['Overview', 'Tasks', 'Documents', 'Payments', 'Chat'];

// Render as ScrollView horizontal with individual tab buttons
// Active tab: color: '#4338CA', borderBottomWidth: 2, borderBottomColor: '#4338CA'
// Inactive tab: color: '#94A3B8', borderBottomWidth: 2, borderBottomColor: 'transparent'

tabBar: {
  flexDirection: 'row', backgroundColor: '#fff',
  borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
},
tab: {
  paddingHorizontal: 16, paddingVertical: 12,
},
tabText: {
  fontFamily: 'Poppins-Medium', fontSize: 13,
},
```

**Overview tab — collapsible sections:**

Each section is a `CollapsibleCard` component:
```js
// CollapsibleCard.js
const CollapsibleCard = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  const rotation = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  const toggle = () => {
    Animated.timing(rotation, {
      toValue: open ? 0 : 1, duration: 200, useNativeDriver: true,
    }).start();
    setOpen(!open);
  };

  const rotate = rotation.interpolate({ inputRange: [0,1], outputRange: ['0deg','180deg'] });

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHead} onPress={toggle} activeOpacity={0.7}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={16} color="#6366F1" />
        </Animated.View>
      </TouchableOpacity>
      {open && <View style={styles.cardBody}>{children}</View>}
    </View>
  );
};
```

**Timeline component (inside Overview tab):**
```js
// Each milestone rendered as a timeline item
// Dot colors: done='#6366F1' (with ✓), current='#F59E0B', upcoming='#E2E8F0'
// Connecting line: absolute positioned 1px #E2E8F0 line between dots

timelineItem: {
  flexDirection: 'row', gap: 12, marginBottom: 14, position: 'relative',
},
tlDot: {
  width: 20, height: 20, borderRadius: 10,
  alignItems: 'center', justifyContent: 'center',
  borderWidth: 2, borderColor: '#fff',
  zIndex: 1,
},
tlConnector: {
  position: 'absolute', left: 9, top: 20,
  width: 1, height: 26, backgroundColor: '#E2E8F0',
},
```

**Tasks tab:**
```js
// Checklist items with animated checkbox
// Checked: indigo filled square with white checkmark
// Press: expo-haptics.impactAsync(ImpactFeedbackStyle.Light)

taskItem: {
  flexDirection: 'row', gap: 12, alignItems: 'center',
  padding: 14, borderBottomWidth: 0.5, borderBottomColor: '#F8FAFC',
},
checkbox: {
  width: 20, height: 20, borderRadius: 6,
  borderWidth: 1.5, borderColor: '#CBD5E1',
  alignItems: 'center', justifyContent: 'center',
},
checkboxDone: {
  backgroundColor: '#6366F1', borderColor: '#6366F1',
},
taskTextDone: {
  textDecorationLine: 'line-through', color: '#94A3B8',
},
```

**Chat tab:**
```js
// Message bubbles
// Lawyer messages: left-aligned, indigo-50 bg, indigo-800 text, border-bottom-left-radius: 4
// Client messages: right-aligned, indigo-600 bg, white text, border-bottom-right-radius: 4

bubbleLawyer: {
  maxWidth: '78%', alignSelf: 'flex-start',
  backgroundColor: '#EEF2FF', borderRadius: 16, borderBottomLeftRadius: 4,
  padding: 10, marginBottom: 2,
},
bubbleClient: {
  maxWidth: '78%', alignSelf: 'flex-end',
  backgroundColor: '#6366F1', borderRadius: 16, borderBottomRightRadius: 4,
  padding: 10, marginBottom: 2,
},
```

---

### 6.4 CLIENT PORTAL SCREENS

**All client screens use `CLIENT_COLORS` (teal) — never the indigo lawyer palette.**

**Client Dashboard (`screens/client/ClientDashboardScreen.js`):**

```js
// Header gradient
<LinearGradient colors={['#0D9488', '#059669']} style={styles.clientHeader}>
  {/* Decorative orbs (non-interactive Views) */}
  <View style={styles.orbTopRight} />
  <View style={styles.orbBottomLeft} />

  <Text style={styles.clientGreet}>Welcome back</Text>
  <Text style={styles.clientName}>{clientName}</Text>

  {/* Active case card — glassmorphism */}
  <View style={styles.glassCaseCard}>
    <Text style={styles.courtLabel}>{caseData.court.toUpperCase()}</Text>
    <Text style={styles.caseNameClient}>{caseData.title}</Text>
    <View style={styles.pillsRow}>
      <View style={styles.cPill}><Text style={styles.cPillText}>Hearing: {formatDate(caseData.nextHearingDate)}</Text></View>
      {caseData.priority === 'HIGH' && (
        <View style={[styles.cPill, { backgroundColor: 'rgba(239,68,68,0.3)' }]}>
          <Text style={styles.cPillText}>High Priority</Text>
        </View>
      )}
    </View>
  </View>
</LinearGradient>

glassCaseCard: {
  backgroundColor: 'rgba(255,255,255,0.15)',
  borderRadius: 16, padding: 16,
  borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
  marginTop: 16,
},
```

**Quick action tiles (3 columns):**
```js
// Message | Appointment | Pay Fee
// Each: white card, teal border, emoji icon, teal label text
// Press: haptic + navigate

qaCard: {
  flex: 1, backgroundColor: '#fff',
  borderRadius: 16, padding: 14,
  alignItems: 'center',
  borderWidth: 0.5, borderColor: '#CCFBF1',
  ...SHADOW.card,
},
qaIcon: { fontSize: 24, marginBottom: 6 },
qaLabel: { fontFamily: 'Poppins-Medium', fontSize: 11, color: '#0F766E' },
```

**Document requests card:**
```js
// Section header: teal-50 bg, "2 Pending" amber badge
// Each row: doc name + sub-label + teal "Upload" button
// Uploaded items: show green ✓ "Accepted" instead of Upload button

docSection: {
  backgroundColor: '#fff', borderRadius: 16,
  borderWidth: 0.5, borderColor: '#E2E8F0',
  overflow: 'hidden', marginBottom: 12,
},
docHeader: {
  backgroundColor: '#ECFDF5', padding: 12,
  borderBottomWidth: 1, borderBottomColor: '#D1FAE5',
  flexDirection: 'row', justifyContent: 'space-between',
},
pendingBadge: {
  backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2,
  borderRadius: 10,
},
pendingBadgeText: {
  fontFamily: 'Poppins-SemiBold', fontSize: 10, color: '#92400E',
},
uploadBtn: {
  backgroundColor: '#0D9488', paddingHorizontal: 14, paddingVertical: 6,
  borderRadius: 8,
},
uploadBtnText: {
  fontFamily: 'Poppins-Medium', fontSize: 11, color: '#fff',
},
```

**Bottom tab bar — client (4 tabs, teal active):**
```js
// Home | My Case | Chat | Profile
// Active icon+label color: '#0D9488' (teal-600)
// Inactive: '#94A3B8'
```

---

## 7. NAVIGATION & TRANSITIONS

```js
// In App.js / navigator
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Apply slide animation to all screens
const Stack = createNativeStackNavigator();

<Stack.Navigator
  screenOptions={{
    animation: 'slide_from_right',       // standard push
    headerShown: false,                   // custom headers on each screen
    contentStyle: { backgroundColor: '#F8FAFC' },
  }}
>
```

**Modal screens (appointments, fee request forms):**
```js
// Use animation: 'slide_from_bottom'
<Stack.Screen
  name="NewAppointment"
  component={NewAppointmentScreen}
  options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
/>
```

---

## 8. HAPTIC FEEDBACK

Install: `expo install expo-haptics`

Apply on **every** interactive button press:
```js
import * as Haptics from 'expo-haptics';

// Primary actions (create, save, send)
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Secondary actions (toggle checkbox, mark done, tab switch)
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Destructive actions (delete, cancel)
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
```

---

## 9. EMPTY STATE COMPONENT

Create a reusable `EmptyState.js` component:

```js
// EmptyState.js
const EMPTY_CONFIGS = {
  cases:       { icon: '⚖️',  title: 'No Cases Yet',      desc: 'Start by adding your first case to track hearings and deadlines.',    ctaLabel: '+ New Case',    ctaColor: '#EEF2FF', ctaText: '#4338CA' },
  clients:     { icon: '👥',  title: 'No Clients Yet',    desc: 'Add your first client to link them to cases and manage interactions.',  ctaLabel: '+ Add Client',  ctaColor: '#FFF7ED', ctaText: '#C2410C' },
  chat:        { icon: '💬',  title: 'No Messages',       desc: 'Send your first message to begin communicating about this case.',       ctaLabel: 'Say Hello →',   ctaColor: '#F0FDF4', ctaText: '#059669' },
  documents:   { icon: '🗂️', title: 'Vault is Empty',    desc: 'Upload documents to keep them securely organised and accessible.',      ctaLabel: 'Upload File',   ctaColor: '#FFF7ED', ctaText: '#C2410C' },
  billing:     { icon: '🧾',  title: 'No Invoices',       desc: 'Fee requests you create for clients will appear here.',                 ctaLabel: 'Request Fee',   ctaColor: '#F0F9FF', ctaText: '#0369A1' },
  appointments:{ icon: '📅',  title: 'No Appointments',   desc: 'Your scheduled meetings with clients will appear here.',                ctaLabel: 'Schedule',      ctaColor: '#EEF2FF', ctaText: '#4338CA' },
  activity:    { icon: '📋',  title: 'No Activity Yet',   desc: 'Actions across cases, clients, and documents will be logged here.',     ctaLabel: null,            ctaColor: null,      ctaText: null      },
};

const EmptyState = ({ type, onCta }) => {
  const config = EMPTY_CONFIGS[type];
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{config.icon}</Text>
      <Text style={styles.title}>{config.title}</Text>
      <Text style={styles.desc}>{config.desc}</Text>
      {config.ctaLabel && (
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: config.ctaColor }]}
          onPress={onCta}
          activeOpacity={0.8}
        >
          <Text style={[styles.ctaText, { color: config.ctaText }]}>{config.ctaLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  icon:      { fontSize: 48, marginBottom: 16 },
  title:     { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: '#475569', marginBottom: 8, textAlign: 'center' },
  desc:      { fontFamily: 'Poppins-Regular', fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  ctaBtn:    { paddingHorizontal: 22, paddingVertical: 10, borderRadius: 12 },
  ctaText:   { fontFamily: 'Poppins-SemiBold', fontSize: 13 },
});
```

Usage: `{cases.length === 0 && <EmptyState type="cases" onCta={() => navigation.navigate('NewCase')} />}`

---

## 10. REUSABLE COMPONENTS CHECKLIST

Build these as isolated components before building screens:

| Component               | Props                                     | Notes                                              |
|-------------------------|-------------------------------------------|----------------------------------------------------|
| `GradientHeader`        | `colors, children, style`                 | Wraps LinearGradient + StatusBar                   |
| `StatCard`              | `label, value, delta, deltaType, colorKey`| Used in lawyer dashboard 2×2 grid                  |
| `ShortcutIcon`          | `icon, label, bg, badge, onPress`         | 4-per-row grid item with optional red badge dot    |
| `CollapsibleCard`       | `title, defaultOpen, children`            | Animated chevron, used in Case Detail              |
| `TimelineItem`          | `event, date, status`                     | status: 'done' / 'current' / 'upcoming'            |
| `TaskItem`              | `text, done, onToggle`                    | Haptic on toggle, animated checkbox                |
| `PriorityBadge`         | `priority`                                | 'HIGH' / 'MEDIUM' / 'LOW', color-mapped            |
| `ChatBubble`            | `message, isLawyer, timestamp`            | Two visual styles based on `isLawyer`              |
| `DocumentRow`           | `name, status, onUpload, onAccept`        | status: 'pending' / 'uploaded' / 'accepted'        |
| `EmptyState`            | `type, onCta`                             | See Section 9 above                                |
| `SectionHeader`         | `title, actionLabel, onAction`            | Row with bold title + right-aligned teal link      |
| `ActivityFeedItem`      | `event, entityName, time, dotColor`       | Used in dashboard recent activity                  |

---

## 11. GLOBAL RULES FOR THE AGENT

1. **Never use `fontFamily: 'System'` or leave `fontFamily` undefined.** Every `Text` must use one of the four Poppins variants.
2. **Never hardcode colors** outside the color constants defined in Section 4. Always reference `LAWYER_COLORS.X` or `CLIENT_COLORS.X`.
3. **All `TouchableOpacity` must have `activeOpacity={0.75}`** unless specified otherwise.
4. **Add `useFocusEffect` to every list screen** to re-query SQLite on focus — this keeps badges and counts in sync.
5. **Add `RefreshControl` to every `ScrollView` or `FlatList`** that shows live data.
6. **Haptics on every user-initiated action** — see Section 8.
7. **Never use `alert()`** — use a styled in-app `Toast` or `Snackbar` component.
8. **Screen background is always `#F8FAFC`** for lawyer screens and `#F0FDFA` for client screens — never plain white at the page level.
9. **Card borders are `borderWidth: 0.5, borderColor: '#E2E8F0'`** — not `1px` and not pure black.
10. **Status bar:** `translucent={true}` with `barStyle="light-content"` on dark gradient headers; `barStyle="dark-content"` on white/light headers.
11. **All list items must have press feedback** — either `TouchableOpacity` or `Pressable` with `android_ripple`.
12. **Empty `FlatList` uses `ListEmptyComponent`** — always `<EmptyState type="..." />`, never a raw `<Text>No data</Text>`.

---

## 12. FILE & FOLDER CONVENTIONS

```
/screens
  /auth
    LoginScreen.js
    RegisterScreen.js
  /lawyer
    DashboardScreen.js
    CaseListScreen.js
    CaseDetailScreen.js
    ClientListScreen.js
    ClientDetailScreen.js
    BillingScreen.js
    AppointmentsScreen.js
    VaultScreen.js
    AnalyticsScreen.js
    ActivityLogScreen.js
  /client
    ClientDashboardScreen.js
    ClientCaseScreen.js
    ClientChatScreen.js
    ClientDocumentsScreen.js
    ClientAppointmentScreen.js
    ClientInvoiceScreen.js
/components
  GradientHeader.js
  StatCard.js
  ShortcutIcon.js
  CollapsibleCard.js
  TimelineItem.js
  TaskItem.js
  PriorityBadge.js
  ChatBubble.js
  DocumentRow.js
  EmptyState.js
  SectionHeader.js
  ActivityFeedItem.js
/constants
  colors.js        ← LAWYER_COLORS, CLIENT_COLORS, PRIORITY, CASE_STATUS
  spacing.js       ← SPACING, RADIUS, SHADOW tokens
  typography.js    ← font scale definitions
/assets/fonts
  Poppins-Regular.ttf
  Poppins-Medium.ttf
  Poppins-SemiBold.ttf
  Poppins-Bold.ttf
```

---

*End of LexFlow UI/UX Design Prompt. Pass this document in full to your AI code agent before generating any screen or component.*
