import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import { useTheme } from '../context/ThemeContext';
import { theme, buildTypography } from '../constants/theme';
import LoadingState from '../components/LoadingState';
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

function safeParseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function monthKeyFromDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function PriorityPieChart({ counts, colors, size = 150, strokeWidth = 18 }) {
  const total = (counts?.High || 0) + (counts?.Medium || 0) + (counts?.Low || 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const segments = [
    { key: 'High', value: counts?.High || 0, color: colors.error },
    { key: 'Medium', value: counts?.Medium || 0, color: colors.warning },
    { key: 'Low', value: counts?.Low || 0, color: colors.success },
  ];

  let accumulated = 0;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.slate100}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {segments.map((seg) => {
          const ratio = total > 0 ? seg.value / total : 0;
          const segmentLength = circumference * ratio;
          const dashArray = `${segmentLength} ${circumference - segmentLength}`;
          const dashOffset = -accumulated;
          accumulated += segmentLength;

          return (
            <Circle
              key={seg.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={seg.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
              rotation="-90"
              originX={size / 2}
              originY={size / 2}
            />
          );
        })}
      </Svg>
      <Text style={{ fontSize: 12, fontWeight: '900', color: colors.slate600, marginTop: 8 }}>
        {total} total cases
      </Text>
    </View>
  );
}

export default function AnalyticsScreen() {
    const navigation = useNavigation();
    const { getClosedCaseStats, cases, tasks, getActivityLog, user, clientsById, getPayments } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

    const [stats, setStats] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    const priorityCounts = useMemo(() => {
      const counts = { High: 0, Medium: 0, Low: 0 };
      for (const c of cases) {
        const p = (c.priority || 'Medium').toLowerCase();
        if (p === 'high') counts.High++;
        else if (p === 'low') counts.Low++;
        else counts.Medium++;
      }
      return counts;
    }, [cases]);

    const monthlyFilingTrend = useMemo(() => {
      const now = new Date();
      const monthsToShow = 6;
      const map = {};

      for (let i = 0; i < monthsToShow; i++) {
        const d = new Date(now);
        d.setMonth(now.getMonth() - (monthsToShow - 1 - i));
        const key = monthKeyFromDate(d);
        map[key] = 0;
      }

      for (const c of cases) {
        const d = safeParseDate(c.filing_date);
        if (!d) continue;
        const key = monthKeyFromDate(d);
        if (key in map) map[key]++;
      }

      const entries = Object.entries(map);
      return entries.map(([key, count]) => {
        const d = safeParseDate(key + '-01T00:00:00.000Z') || new Date(key + '-01');
        const label = d.toLocaleString('en-IN', { month: 'short' });
        return { key, label, count };
      });
    }, [cases]);

    const clientWiseCaseCounts = useMemo(() => {
      const counts = new Map();
      for (const c of cases) {
        const cid = c.client_id || 'unassigned';
        counts.set(cid, (counts.get(cid) || 0) + 1);
      }

      const list = Array.from(counts.entries())
        .map(([clientId, count]) => ({
          clientId,
          count,
          name:
            clientId === 'unassigned'
              ? 'Unassigned'
              : clientsById.get(clientId)?.name || 'Unknown Client',
        }))
        .sort((a, b) => b.count - a.count);

      return list.slice(0, 5);
    }, [cases, clientsById]);

    const [paymentTotals, setPaymentTotals] = useState({
      pendingAmount: 0,
      pendingCount: 0,
      paidAmount: 0,
      paidCount: 0,
    });

    useEffect(() => {
        (async () => {
            setLoading(true);
            let pendingAmount = 0;
            let pendingCount = 0;
            let paidAmount = 0;
            let paidCount = 0;

            try {
              const s = await getClosedCaseStats();
              setStats(s);

              const log = await getActivityLog(100);
              setRecentActivity(log);

              for (const c of cases) {
                const ps = await getPayments(c.id);
                for (const p of ps || []) {
                  const amount = Number(p.amount || 0);
                  if (p.status === 'Pending') {
                    pendingAmount += amount;
                    pendingCount++;
                  } else if (p.status === 'Paid') {
                    paidAmount += amount;
                    paidCount++;
                  }
                }
              }

              setPaymentTotals({ pendingAmount, pendingCount, paidAmount, paidCount });
            } catch (e) {
              // Keep analytics resilient
              // eslint-disable-next-line no-console
              console.warn('Analytics enhancement error', e);
            } finally {
              setLoading(false);
            }
        })();
    }, [getClosedCaseStats, getActivityLog, getPayments, cases]);

    const productivity = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        return {
            total,
            completed,
            rate: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }, [tasks]);

    const activeCases = useMemo(() => cases.filter(c => c.status !== 'Closed').length, [cases]);

    if (loading) {
        return <LoadingState message="Aggregating data..." />;
    }

    return (
        <View style={styles.container}>
            <Header title="Practice Analytics" showBack onBack={() => navigation.goBack()} />
            <ScrollView contentContainerStyle={styles.content}>

                {/* Core KPIs */}
                <View style={styles.kpiRow}>
                    <View style={[styles.kpiCard, { backgroundColor: colors.indigo50 }]}>
                        <Text style={styles.kpiValue}>{activeCases}</Text>
                        <Text style={styles.kpiLabel}>Active Cases</Text>
                    </View>
                    <View style={[styles.kpiCard, { backgroundColor: colors.slate50 }]}>
                        <Text style={styles.kpiValue}>{stats?.totalClosed || 0}</Text>
                        <Text style={styles.kpiLabel}>Closed This Year</Text>
                    </View>
                </View>

                {/* Productivity Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Task Productivity</Text>
                    <View style={styles.card}>
                        <View style={styles.progressContainer}>
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressTitle}>Completion Rate</Text>
                                <Text style={styles.progressValue}>{productivity.rate}%</Text>
                            </View>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${productivity.rate}%` }]} />
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statDetailRow}>
                            <View style={styles.statDetail}>
                                <Text style={styles.statDetailNum}>{productivity.completed}</Text>
                                <Text style={styles.statDetailLabel}>Resolved</Text>
                            </View>
                            <View style={styles.verticalDivider} />
                            <View style={styles.statDetail}>
                                <Text style={styles.statDetailNum}>{productivity.total - productivity.completed}</Text>
                                <Text style={styles.statDetailLabel}>Pending</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Lifecycle Analytics */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Case Lifecycle</Text>
                    <View style={styles.card}>
                        <View style={styles.lifecycleRow}>
                            <View style={styles.lifecycleItem}>
                                <Text style={styles.lifecycleValue}>{stats?.avgDuration || 0}</Text>
                                <Text style={styles.lifecycleLabel}>Avg. Days to Close</Text>
                            </View>
                            <View style={styles.lifecycleItem}>
                                <Text style={styles.lifecycleValue}>
                                    {stats?.rows?.[0]?.outcome || 'N/A'}
                                </Text>
                                <Text style={styles.lifecycleLabel}>Last Outcome</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Practice Distribution (Courts) */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Practice Distribution (Courts)</Text>
                    <View style={styles.card}>
                        {Object.entries(stats?.byCourt || {}).map(([court, data]) => (
                            <View key={court} style={styles.courtRow}>
                                <View style={styles.courtHeader}>
                                    <Text style={styles.courtName} numberOfLines={1}>{court}</Text>
                                    <Text style={styles.courtCount}>{data.count} cases</Text>
                                </View>
                                <View style={styles.courtBarBg}>
                                    <View
                                        style={[
                                            styles.courtBarFill,
                                            { width: `${Math.min(100, (data.count / (stats?.totalClosed || 1)) * 100)}%` }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.courtHint}>Avg. resolution: {data.avgDays} days</Text>
                            </View>
                        ))}
                        {Object.keys(stats?.byCourt || {}).length === 0 && (
                            <Text style={styles.emptyHint}>Insufficient historical data for court analysis.</Text>
                        )}
                    </View>
                </View>

                {/* Priority Distribution */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Priority Distribution</Text>
                    <View style={styles.card}>
                        <View style={styles.priorityRow}>
                            <PriorityPieChart counts={priorityCounts} colors={colors} />
                            <View style={styles.legend}>
                                {[
                                    { label: 'High', value: priorityCounts.High, color: colors.error },
                                    { label: 'Medium', value: priorityCounts.Medium, color: colors.warning },
                                    { label: 'Low', value: priorityCounts.Low, color: colors.success },
                                ].map((item) => {
                                    const total =
                                        priorityCounts.High + priorityCounts.Medium + priorityCounts.Low;
                                    const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                                    return (
                                        <View key={item.label} style={styles.legendRow}>
                                            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                                            <Text style={styles.legendLabel}>{item.label}</Text>
                                            <Text style={styles.legendValue}>
                                                {item.value} ({pct}%)
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Monthly Case Filing Trend */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Monthly Case Filing Trend</Text>
                    <View style={styles.card}>
                        <View style={styles.barChartRow}>
                            {monthlyFilingTrend.map((m) => (
                                <View key={m.key} style={styles.barCol}>
                                    <View
                                        style={[
                                            styles.bar,
                                            {
                                                height:
                                                    m.count === 0
                                                        ? 8
                                                        : Math.round(
                                                            (m.count /
                                                                Math.max(
                                                                    1,
                                                                    ...monthlyFilingTrend.map((x) => x.count)
                                                                )) *
                                                                120
                                                        ),
                                                backgroundColor: colors.primary,
                                            },
                                        ]}
                                    />
                                    <Text style={styles.barLabel}>{m.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Client-wise case count */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Client-wise Case Count</Text>
                    <View style={styles.card}>
                        {clientWiseCaseCounts.length === 0 ? (
                            <Text style={styles.emptyHint}>No client case data found.</Text>
                        ) : (
                            clientWiseCaseCounts.map((c) => {
                                const max = clientWiseCaseCounts[0]?.count || 1;
                                const pct = max > 0 ? c.count / max : 0;
                                return (
                                    <View key={c.clientId} style={styles.clientRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.clientName} numberOfLines={1}>
                                                {c.name}
                                            </Text>
                                            <Text style={styles.clientMeta}>{c.count} cases</Text>
                                        </View>
                                        <View style={styles.clientBarBg}>
                                            <View
                                                style={[
                                                    styles.clientBarFill,
                                                    { width: `${Math.max(6, Math.round(pct * 100))}%` },
                                                ]}
                                            />
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </View>
                </View>

                {/* Outstanding payments */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Outstanding Payments</Text>
                    <View style={styles.card}>
                        <View style={styles.paymentRow}>
                            <View style={[styles.paymentCard, { borderBottomColor: colors.warning }]}>
                                <Text style={styles.paymentLabel}>OUTSTANDING</Text>
                                <Text style={[styles.paymentValue, { color: colors.warning }]}>
                                    ₹{paymentTotals.pendingAmount.toLocaleString()}
                                </Text>
                                <Text style={styles.paymentHint}>
                                    {paymentTotals.pendingCount} pending record(s)
                                </Text>
                            </View>
                            <View style={[styles.paymentCard, { borderBottomColor: colors.success }]}>
                                <Text style={styles.paymentLabel}>PAID</Text>
                                <Text style={[styles.paymentValue, { color: colors.success }]}>
                                    ₹{paymentTotals.paidAmount.toLocaleString()}
                                </Text>
                                <Text style={styles.paymentHint}>
                                    {paymentTotals.paidCount} paid record(s)
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Report generated for Counsel {user?.name}</Text>
                    <Text style={styles.footerTime}>{new Date().toLocaleDateString()}</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const createStyles = (colors) => {
  const typo = buildTypography(colors);
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: theme.spacing.lg, paddingBottom: 60 },
    kpiRow: { flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.xl },
    kpiCard: {
        flex: 1,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        ...theme.shadows.sm,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    kpiValue: { ...typo.h2, color: colors.slate800 },
    kpiLabel: { ...typo.caption, color: colors.slate500, marginTop: 4 },

    section: { marginBottom: theme.spacing.xl },
    sectionHeader: {
        ...typo.tiny,
        color: colors.slate500,
        letterSpacing: 1,
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    card: {
        backgroundColor: colors.surface,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: colors.slate100,
        ...theme.shadows.sm,
    },

    progressContainer: { marginBottom: 16 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    progressTitle: { ...typo.bodyBold, color: colors.slate800 },
    progressValue: { ...typo.bodyBold, color: colors.primary },
    progressBarBg: { height: 10, backgroundColor: colors.slate100, borderRadius: 5, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: colors.primary },

    divider: { height: 1, backgroundColor: colors.slate100, marginVertical: 12 },
    statDetailRow: { flexDirection: 'row', alignItems: 'center' },
    statDetail: { flex: 1, alignItems: 'center' },
    statDetailNum: { ...typo.subtitle, color: colors.slate800 },
    statDetailLabel: { ...typo.tiny, color: colors.slate400 },
    verticalDivider: { width: 1, height: 30, backgroundColor: colors.slate100 },

    lifecycleRow: { flexDirection: 'row', justifyContent: 'space-between' },
    lifecycleItem: { flex: 1 },
    lifecycleValue: { ...typo.subtitle, color: colors.slate800 },
    lifecycleLabel: { ...typo.tiny, color: colors.slate400 },

    courtRow: { marginBottom: 16 },
    courtHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    courtName: { ...typo.bodyBold, color: colors.slate700, flex: 1 },
    courtCount: { ...typo.caption, color: colors.slate500 },
    courtBarBg: { height: 6, backgroundColor: colors.slate50, borderRadius: 3, overflow: 'hidden' },
    courtBarFill: { height: '100%', backgroundColor: colors.indigo400 },
    courtHint: { ...typo.tiny, color: colors.slate400, marginTop: 4 },
    emptyHint: { ...typo.caption, color: colors.slate400, textAlign: 'center', fontStyle: 'italic' },

    priorityRow: { flexDirection: 'row', gap: 18, alignItems: 'center', justifyContent: 'space-between' },
    legend: { flex: 1 },
    legendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendLabel: { ...typo.bodyBold, color: colors.slate800, flex: 1, marginLeft: 10 },
    legendValue: { ...typo.caption, color: colors.slate600, fontWeight: '900' },

    barChartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, paddingHorizontal: 6 },
    barCol: { flex: 1, alignItems: 'center' },
    bar: { width: 16, borderRadius: 8 },
    barLabel: { ...typo.tiny, color: colors.slate400, textTransform: 'none', marginTop: 10, textAlign: 'center' },

    clientRow: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
    clientName: { ...typo.bodyBold, color: colors.slate800, flex: 1 },
    clientMeta: { ...typo.caption, color: colors.slate500 },
    clientBarBg: { width: 120, height: 10, borderRadius: 999, backgroundColor: colors.slate100, overflow: 'hidden' },
    clientBarFill: { height: '100%', backgroundColor: colors.primary },

    paymentRow: { flexDirection: 'row', gap: 12 },
    paymentCard: { flex: 1, backgroundColor: colors.slate50, padding: 16, borderRadius: theme.radius.lg, borderBottomWidth: 4, borderColor: colors.slate100 },
    paymentLabel: { ...typo.tiny, color: colors.slate500, letterSpacing: 1, fontWeight: '900' },
    paymentValue: { ...typo.h2, marginTop: 6, fontWeight: '900' },
    paymentHint: { ...typo.caption, color: colors.slate500, marginTop: 6 },

    footer: { alignItems: 'center', marginTop: 20 },
    footerText: { ...typo.tiny, color: colors.slate400 },
    footerTime: { ...typo.tiny, color: colors.slate300, fontSize: 10 },
});
};
