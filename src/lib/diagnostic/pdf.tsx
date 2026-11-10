import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Link,
  renderToBuffer,
} from '@react-pdf/renderer';
import fs from 'node:fs';
import path from 'node:path';
import { DIMENSION_IMPACT, DIMENSION_STRENGTH, MATURITY_BANDS, PRIORITY_THRESHOLD } from './data';
import { buildCta } from './cta';

const C = {
  page: '#FFFFFF',
  panel: '#F5F1E7',
  barBg: '#ECE5D4',
  line: '#D8CFB8',
  text: '#221F1A',
  dim: '#6E6656',
  brass: '#8A6D3B',
  brassMid: '#B4915B',
  rust: '#B65C3F',
  sage: '#5E7462',
  sageBar: '#7C9082',
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.page,
    color: C.text,
    fontFamily: 'Helvetica',
    fontSize: 8.4,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  body: { paddingHorizontal: 32, paddingTop: 14, paddingBottom: 30 },
  headerBand: {
    backgroundColor: C.panel,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  logo: { height: 18, width: 96, marginBottom: 6 },
  title: { fontSize: 16, color: C.text, fontFamily: 'Helvetica-Bold' },
  headerName: { fontSize: 9.5, color: C.text, fontFamily: 'Helvetica-Bold' },
  headerOrg: { fontSize: 8, color: C.dim },
  sectionTitle: {
    fontSize: 7.6,
    letterSpacing: 1.2,
    color: C.brass,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
    marginTop: 9,
  },
  para: { fontSize: 8.2, lineHeight: 1.45, color: C.text, marginBottom: 4 },
  dimPara: { fontSize: 7.9, lineHeight: 1.45, color: C.dim },
  lead: { fontFamily: 'Helvetica-Bold', color: C.text },
  divider: { borderTopWidth: 1, borderTopColor: C.line, marginVertical: 9 },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 2 },
  scoreBig: { fontSize: 40, color: C.brassMid, fontFamily: 'Helvetica-Bold', lineHeight: 1 },
  scoreOf: { fontSize: 9, color: C.dim, marginLeft: 5, marginBottom: 3 },
  bandName: { fontSize: 9.5, color: C.rust, fontFamily: 'Helvetica-Bold', marginTop: 2 },
  tableHead: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    paddingBottom: 4,
    marginBottom: 3,
    marginTop: 6,
  },
  thName: { width: '38%', fontSize: 7, letterSpacing: 0.8, color: C.dim, fontFamily: 'Helvetica-Bold' },
  thBar: { width: '38%' },
  thScore: { width: '10%', fontSize: 7, color: C.dim, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  thStatus: { width: '14%', fontSize: 7, color: C.dim, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  tdName: { width: '38%', fontSize: 8.2, color: C.text },
  tdBar: { width: '38%', paddingRight: 10 },
  barBg: { height: 5, backgroundColor: C.barBg, borderRadius: 2, width: '100%' },
  tdScore: { width: '10%', fontSize: 8.2, color: C.text, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  tdStatus: { width: '14%', fontSize: 6.6, letterSpacing: 0.4, textAlign: 'right' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: C.barBg },
  dimName: { fontSize: 8.4, fontFamily: 'Helvetica-Bold', color: C.text, marginTop: 3 },
  ctaLink: { backgroundColor: C.brassMid, paddingVertical: 7, paddingHorizontal: 14, alignSelf: 'flex-start', marginTop: 6 },
  ctaText: { fontSize: 8, color: '#FFFFFF', fontFamily: 'Helvetica-Bold', letterSpacing: 0.8 },
  callTitle: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: C.brass, marginBottom: 3 },
  footer: {
    position: 'absolute',
    bottom: 10,
    left: 32,
    right: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 6.8,
    color: C.dim,
    borderTopWidth: 0.5,
    borderTopColor: C.line,
    paddingTop: 4,
  },
});

export type ReportPdfInput = {
  name: string;
  organisation: string;
  dateLabel: string;
  overall: number;
  band: { key: string; name: string; rangeLabel: string; description: string };
  dimensions: Array<{ key: string; name: string; score: number }>;
};

function logoDataUri(): string | null {
  try {
    const p = path.join(process.cwd(), 'public', 'logo.jpg');
    const b = fs.readFileSync(p);
    return `data:image/jpeg;base64,${b.toString('base64')}`;
  } catch {
    return null;
  }
}

function listNames(items: Array<{ name: string }>): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0].name;
  if (items.length === 2) return `${items[0].name} and ${items[1].name}`;
  return items.slice(0, -1).map((i) => i.name).join(', ') + ' and ' + items[items.length - 1].name;
}

function summary(input: ReportPdfInput): string {
  const flagged = input.dimensions.filter((d) => d.score <= 80);
  const healthy = input.dimensions.filter((d) => d.score > 80);
  const weakest = input.dimensions.reduce((a, b) => (b.score < a.score ? b : a));
  const strongest = input.dimensions.reduce((a, b) => (b.score > a.score ? b : a));

  if (healthy.length === 0) {
    return `${input.organisation} scores ${input.overall} out of 100, which places it in the ${input.band.name} band (${input.band.rangeLabel}). All five dimensions sit below the priority threshold of ${PRIORITY_THRESHOLD}, so the gaps reinforce each other. ${weakest.name} scores ${weakest.score}, the lowest of the five, and ${strongest.name} scores ${strongest.score}.`;
  }
  if (flagged.length === 0) {
    return `${input.organisation} scores ${input.overall} out of 100, which places it in the ${input.band.name} band (${input.band.rangeLabel}). All five dimensions sit above the priority threshold of ${PRIORITY_THRESHOLD}. ${strongest.name} is strongest at ${strongest.score}, and ${weakest.name} is lowest at ${weakest.score}. The task now is keeping those practices embedded as AI use changes.`;
  }
  return `${input.organisation} scores ${input.overall} out of 100, which places it in the ${input.band.name} band (${input.band.rangeLabel}). The picture is mixed: ${listNames(healthy)} ${healthy.length === 1 ? 'is' : 'are'} holding up, while ${listNames(flagged)} ${flagged.length === 1 ? 'sits' : 'sit'} below the priority threshold of ${PRIORITY_THRESHOLD}. ${weakest.name} scores ${weakest.score}, and ${strongest.name} scores ${strongest.score}.`;
}

function nextGain(input: ReportPdfInput): string {
  const flagged = input.dimensions.filter((d) => d.score <= 80);
  if (flagged.length === 0) {
    return `No dimension is flagged. The next gain is in keeping the strongest practices stable while AI use changes.`;
  }
  const lowest = [...flagged].sort((a, b) => a.score - b.score).slice(0, 2);
  return `On this evidence, ${listNames(lowest)} ${lowest.length === 1 ? 'has' : 'have'} the most room to improve, because the score is lowest there. Every dimension counts equally toward the overall score, so no dimension is a bigger lever than another.`;
}

function cta(input: ReportPdfInput): { title: string; body: string } {
  return buildCta({
    organisation: input.organisation,
    flagged: input.dimensions.filter((d) => d.score <= 80),
    healthy: input.dimensions.filter((d) => d.score > 80),
  });
}

function ReportDoc({ input }: { input: ReportPdfInput }) {
  const logo = logoDataUri();
  const flagged = input.dimensions.filter((d) => d.score <= 80);
  const healthy = input.dimensions.filter((d) => d.score > 80);
  const call = cta(input);

  const challenges: Array<{ lead: string; text: string }> = [
    {
      lead: 'Contribution is hard to see. ',
      text: 'AI-assisted output can look polished while the thinking behind it is thin, and managers have no reliable way to tell the difference.',
    },
    {
      lead: 'Standards are undefined. ',
      text: 'Without agreed criteria for what good AI-assisted work looks like, reviews drift towards personal preference, and two managers can judge the same piece of work differently.',
    },
    {
      lead: 'Managers are unequipped. ',
      text: 'Many have had no training in reviewing AI-assisted work, so the conversation becomes a compliance step rather than a coaching one.',
    },
    {
      lead: 'Ownership is diffuse. ',
      text: 'When a decision involving AI goes wrong, responsibility is often attributed to the tool rather than to a person.',
    },
    {
      lead: 'Use is hidden. ',
      text: 'Where AI use carries stigma, people conceal it, and the organisation loses the visibility it needs to improve.',
    },
  ];

  return (
    <Document title={`Performance review maturity report - ${input.organisation}`} author="PerforMetrix">
      <Page size="A4" style={s.page} wrap>
        <View style={s.headerBand} fixed>
          {logo ? <Image src={logo} style={s.logo} /> : <Text style={s.title}>PerforMetrix</Text>}
          <Text style={s.title}>Performance review maturity in the AI era</Text>
        </View>

        <View style={s.body}>
          <View style={{ marginTop: 4 }}>
            <Text style={s.sectionTitle}>PREPARED FOR</Text>
            <Text style={s.headerName}>{input.name}</Text>
            <Text style={s.headerOrg}>{input.organisation}</Text>
            <Text style={s.headerOrg}>{input.dateLabel}</Text>
          </View>

          <Text style={s.sectionTitle}>THE CHALLENGE</Text>
          <Text style={s.para}>
            AI is now part of how work gets done, but performance management has not caught up. Across
            the organisations we work with, the same problems recur.
          </Text>
          {challenges.map((c) => (
            <Text key={c.lead} style={s.para}>
              <Text style={s.lead}>{c.lead}</Text>
              {c.text}
            </Text>
          ))}
          <Text style={s.para}>
            <Text style={s.lead}>What follows. </Text>
            When these behaviours are rare, the risks compound: inconsistent reviews erode trust
            in the process, unexplained or unfair outcomes create exposure, strong contributors
            can be penalised for working differently, and weak work passes because it looks
            polished. AI investment continues without a clear line to performance.
          </Text>
          <Text style={s.para}>
            This diagnostic measures where your organisation stands against these challenges across
            five dimensions. It is based on one respondent's answers, not a consensus.
          </Text>

          <View style={s.divider} />

          <Text style={s.sectionTitle}>OVERALL MATURITY SCORE</Text>
          <View style={s.scoreRow}>
            <Text style={s.scoreBig}>{input.overall}</Text>
            <Text style={s.scoreOf}>/ 100</Text>
          </View>
          <Text style={s.bandName}>{input.band.name}</Text>
          <Text style={s.dimPara}>{input.band.description}</Text>

          <View style={s.tableHead}>
            <Text style={s.thName}>DIMENSION</Text>
            <Text style={s.thBar} />
            <Text style={s.thScore}>SCORE</Text>
            <Text style={s.thStatus}>STATUS</Text>
          </View>
          {input.dimensions.map((d) => {
            const isFlagged = d.score <= 80;
            return (
              <View key={d.key} style={s.tableRow}>
                <Text style={s.tdName}>{d.name}</Text>
                <View style={s.tdBar}>
                  <View style={s.barBg}>
                    <View
                      style={{
                        height: 5,
                        width: `${Math.max(0, Math.min(100, d.score))}%`,
                        backgroundColor: isFlagged ? C.rust : C.sageBar,
                        borderRadius: 2,
                      }}
                    />
                  </View>
                </View>
                <Text style={s.tdScore}>{d.score}</Text>
                <Text style={[s.tdStatus, { color: isFlagged ? C.rust : C.sage }]}>
                  {isFlagged ? 'PRIORITY GAP' : 'ON TRACK'}
                </Text>
              </View>
            );
          })}
        {/* Scoring key */}
        <View style={s.divider} />

        <Text style={s.sectionTitle}>SCORING KEY</Text>
        {MATURITY_BANDS.map((b) => (
          <View key={b.key} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
            <Text style={{ fontSize: 7, color: C.dim }}>{b.rangeLabel}</Text>
            <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.dim }}>{b.name}</Text>
          </View>
        ))}
        <Text style={s.dimPara}>
          Priority gap threshold: {PRIORITY_THRESHOLD} or below. Every dimension counts equally
          toward the overall score — a change in any one dimension moves the total by the same
          amount.
        </Text>
      </View>

        <View style={s.footer} fixed>
          <Text>PerforMetrix - Measuring what really matters</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      <Page size="A4" style={s.page} wrap>
        <View style={s.headerBand} fixed>
          {logo ? <Image src={logo} style={s.logo} /> : <Text style={s.title}>PerforMetrix</Text>}
          <Text style={s.headerOrg}>
            {input.name} · {input.organisation}
          </Text>
        </View>

        <View style={s.body}>
          <Text style={s.sectionTitle}>EXECUTIVE SUMMARY</Text>
          <Text style={s.para}>{summary(input)}</Text>
          <Text style={s.para}>
            <Text style={s.lead}>One person's view. </Text>
            This report is based on one respondent's answers, not a consensus across your
            organisation. It is a starting point for discussion, not a verdict.
          </Text>

          {flagged.length > 0 && (
            <>
              <Text style={s.sectionTitle}>WHAT THIS COULD MEAN FOR {input.organisation.toUpperCase()}</Text>
              {flagged.map((d) => {
                const band = d.score >= 61 ? '61-80' : '0-60';
                const text =
                  (DIMENSION_IMPACT[d.key] && DIMENSION_IMPACT[d.key][band]) ||
                  DIMENSION_IMPACT[d.key]?.[Object.keys(DIMENSION_IMPACT[d.key] || {})[0]] ||
                  '';
                return (
                  <View key={d.key} style={{ marginBottom: 5 }}>
                    <Text style={s.dimName}>{d.name} ({d.score})</Text>
                    <Text style={s.para}>{text}</Text>
                  </View>
                );
              })}
            </>
          )}

          {healthy.length > 0 && (
            <>
              <Text style={s.sectionTitle}>WHAT IS WORKING</Text>
              {healthy.map((d) => (
                <View key={d.key} style={{ marginBottom: 5 }}>
                  <Text style={s.dimName}>{d.name}</Text>
                  <Text style={s.para}>{DIMENSION_STRENGTH[d.key] || ''}</Text>
                </View>
              ))}
            </>
          )}

          <Text style={s.sectionTitle}>WHERE THE NEXT GAIN IS</Text>
          <Text style={s.para}>{nextGain(input)}</Text>

          <Text style={s.sectionTitle}>NEXT STEP</Text>
          <Text style={s.callTitle}>{call.title}</Text>
          <Text style={s.para}>{call.body}</Text>
          <Link src="https://cal.com/growthcircles/multiplesessions" style={s.ctaLink}>
            <Text style={s.ctaText}>BOOK A MEETING</Text>
          </Link>

          <View style={s.divider} />

          <Text style={s.sectionTitle}>METHOD</Text>
          <Text style={s.dimPara}>
            Scores are calculated from 15 behaviour-based questions about how performance is reviewed
            when AI is part of the work. Each dimension is scored from 0 to 100 based on how common
            the behaviour is. The overall score is the average of the five dimensions.
          </Text>

          <Text style={s.sectionTitle}>CONFIDENTIALITY</Text>
          <Text style={s.dimPara}>
            This report was produced for {input.organisation} on {input.dateLabel}. Your answers are
            used only to produce this report and are not shared with anyone else in your organisation.
          </Text>
          <Text style={[s.dimPara, { marginTop: 6, color: C.brass }]}>
            PerforMetrix - Measuring what really matters
          </Text>
        </View>

        <View style={s.footer} fixed>
          <Text>PerforMetrix - Measuring what really matters</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function renderReportPdf(input: ReportPdfInput): Promise<Buffer> {
  const raw = await renderToBuffer(<ReportDoc input={input} />);
  const buf = Buffer.from(raw);
  // pdfkit defaults the header to PDF 1.3 while the output uses transparency,
  // which is a 1.4 feature. Acrobat rejects that mismatch, so stamp 1.7.
  if (buf.subarray(0, 8).toString('latin1').startsWith('%PDF-1.')) {
    buf.write('%PDF-1.7', 0, 'latin1');
  }
  return buf;
}


