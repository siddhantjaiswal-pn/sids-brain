import {
  BarChart,
  PieChart,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Grid,
  H1,
  H2,
  Stack,
  Stat,
  Table,
  Text,
  useHostTheme,
} from "cursor/canvas";

const TOTAL_ROWS = 839;
const UNIQUE_LOANS = 664;
const ESCALATED = 457;
const NOT_ESCALATED = 382;
const QA_PASS = 641;
const QA_FAIL = 162;
const NO_QA = 36;
const FUNDED = 111;

const escRate = ((ESCALATED / TOTAL_ROWS) * 100).toFixed(1);
const qaPassRate = ((QA_PASS / (QA_PASS + QA_FAIL)) * 100).toFixed(1);

const objData = [
  { name: "Low Doc Review", total: 416, escalated: 276, rate: "66.3%" },
  { name: "Additional Low Doc Review", total: 423, escalated: 181, rate: "42.8%" },
];

const escCategories = [
  { label: "Missing/Discrepant VA LIN", count: 45 },
  { label: "Seasoning / Payment History", count: 41 },
  { label: "Missing Documents", count: 31 },
  { label: "Recoupment Failure", count: 31 },
  { label: "VA Entitlement / Guaranty", count: 25 },
  { label: "Loan Amount Optimization", count: 23 },
  { label: "Missing Original Note/Guarantee", count: 23 },
  { label: "Pricing / Points", count: 21 },
  { label: "Cash to Close / Cash Back", count: 19 },
  { label: "Agent Restart", count: 19 },
  { label: "Pending Title", count: 8 },
];

const qaFailThemes = [
  { label: "Cash to Close", count: 64 },
  { label: "Missing Documents", count: 34 },
  { label: "Recoupment", count: 26 },
  { label: "Seasoning", count: 19 },
  { label: "VA LIN", count: 16 },
  { label: "VA Entitlement ID", count: 13 },
  { label: "QM Points/Fees", count: 1 },
];

const stageData = [
  { stage: "EligibilityReview", escalated: 191, clean: 97 },
  { stage: "Closing", escalated: 167, clean: 155 },
  { stage: "Funding", escalated: 58, clean: 57 },
  { stage: "PostClosing", escalated: 38, clean: 72 },
];

const uwData = [
  { label: "Clear to Close", value: 437 },
  { label: "Conditionally Approve", value: 304 },
  { label: "No Decision", value: 97 },
  { label: "Suspend", value: 1 },
];

const keyFindings = [
  ["1", "54.5% escalation rate — more than half of objectives escalated", "High"],
  ["2", "Low Doc Review escalates at 66.3% vs Additional Low Doc at 42.8% — 23pt gap", "High"],
  ["3", "Missing/Discrepant VA LIN: single largest named escalation reason (45 cases, 9.8%)", "High"],
  ["4", "Seasoning/Payment History: 41 escalations (9.0%) — many near May 1 payment date", "High"],
  ["5", "Cash to Close drives 39.5% of QA failures — agent optimization not meeting reviewer expectations", "High"],
  ["6", "Recoupment failures drive 31 escalations and 16% of QA fails — consistent 36-month limit issue", "Medium"],
  ["7", "EligibilityReview stage has highest absolute escalation count (191) — earlier than expected failures", "Medium"],
  ["8", "103 escalated rows (22.5%) had no parseable reason — note quality gap needs attention", "Medium"],
  ["9", "QA agrees with escalations 73.7% of the time; 20.4% disagreement suggests some over-escalation", "Low"],
  ["10", "111 funded loans (16.7%) represent the resolved/closed portion of the pipeline", "Low"],
];

export default function AgentEscalationFindings() {
  const theme = useHostTheme();

  return (
    <Stack gap={28} style={{ padding: "28px 32px", maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <Stack gap={6}>
        <H1>Agent Objective Escalations</H1>
        <Text tone="secondary" size="small">
          VA IRRRL · {TOTAL_ROWS} rows · {UNIQUE_LOANS} unique loans · Mar 28 – Apr 17, 2026
        </Text>
      </Stack>

      {/* Top KPIs */}
      <Grid columns={4} gap={16}>
        <Stat value={UNIQUE_LOANS.toString()} label="Unique Loans" />
        <Stat value={`${escRate}%`} label="Escalation Rate" tone="warning" />
        <Stat value={`${qaPassRate}%`} label="QA Pass Rate" tone="success" />
        <Stat value={FUNDED.toString()} label="Funded Loans" />
      </Grid>

      <Divider />

      {/* Escalation & QA Overview */}
      <Grid columns={2} gap={24}>
        <Stack gap={12}>
          <H2>Escalation Split</H2>
          <Grid columns={2} gap={12}>
            <Stat value={ESCALATED.toString()} label="Escalated" tone="warning" />
            <Stat value={NOT_ESCALATED.toString()} label="Not Escalated" tone="success" />
          </Grid>
          <PieChart
            donut
            size={200}
            data={[
              { label: "Escalated", value: ESCALATED },
              { label: "Not Escalated", value: NOT_ESCALATED },
            ]}
          />
        </Stack>

        <Stack gap={12}>
          <H2>QA Outcomes</H2>
          <Grid columns={3} gap={10}>
            <Stat value={QA_PASS.toString()} label="Pass" tone="success" />
            <Stat value={QA_FAIL.toString()} label="Fail" tone="critical" />
            <Stat value={NO_QA.toString()} label="No Notes" />
          </Grid>
          <PieChart
            donut
            size={200}
            data={[
              { label: "QA Pass", value: QA_PASS },
              { label: "QA Fail", value: QA_FAIL },
              { label: "No Notes", value: NO_QA },
            ]}
          />
        </Stack>
      </Grid>

      <Divider />

      {/* Escalation by Objective */}
      <Stack gap={12}>
        <H2>Escalation Rate by Objective</H2>
        <BarChart
          categories={objData.map((o) => o.name)}
          series={[
            { name: "Escalated", data: objData.map((o) => o.escalated) },
            { name: "Not Escalated", data: objData.map((o) => o.total - o.escalated) },
          ]}
          stacked
          height={140}
        />
        <Table
          headers={["Objective", "Total", "Escalated", "Rate"]}
          rows={objData.map((o) => [o.name, o.total.toString(), o.escalated.toString(), o.rate])}
          rowTone={["warning", undefined]}
        />
      </Stack>

      <Divider />

      {/* Top Escalation Categories & QA Fail Themes */}
      <Grid columns={2} gap={24}>
        <Stack gap={12}>
          <H2>Top Escalation Reasons</H2>
          <Text tone="secondary" size="small">
            From {ESCALATED} escalated rows; 163 had no parseable reason.
          </Text>
          <BarChart
            categories={escCategories.map((c) => c.label)}
            series={[{ name: "Count", data: escCategories.map((c) => c.count) }]}
            horizontal
            height={320}
          />
        </Stack>

        <Stack gap={12}>
          <H2>QA Failure Themes</H2>
          <Text tone="secondary" size="small">
            Themes across {QA_FAIL} QA-failed rows (rows may span multiple categories).
          </Text>
          <BarChart
            categories={qaFailThemes.map((t) => t.label)}
            series={[{ name: "Rows", data: qaFailThemes.map((t) => t.count) }]}
            horizontal
            height={240}
          />
        </Stack>
      </Grid>

      <Divider />

      {/* Stage & Age Breakdown */}
      <Grid columns={2} gap={24}>
        <Stack gap={12}>
          <H2>Escalation by Loan Stage</H2>
          <BarChart
            categories={stageData.map((s) => s.stage)}
            series={[
              { name: "Escalated", data: stageData.map((s) => s.escalated) },
              { name: "Not Escalated", data: stageData.map((s) => s.clean) },
            ]}
            stacked
            height={220}
          />
        </Stack>

        <Stack gap={12}>
          <H2>Age Bucket (Days from Ready)</H2>
          <BarChart
            categories={["00-05", "06-10", "11-15", "16-20"]}
            series={[
              { name: "Escalated", data: [138, 102, 105, 112] },
              { name: "Not Escalated", data: [138, 108, 84, 52] },
            ]}
            stacked
            height={220}
          />
          <Text tone="secondary" size="small">
            Avg days from ready: 9.2 · Range: 0–20
          </Text>
        </Stack>
      </Grid>

      <Divider />

      {/* UW Decision + Error Flags */}
      <Grid columns={2} gap={24}>
        <Stack gap={12}>
          <H2>UW Decision Distribution</H2>
          <Grid columns={2} gap={12}>
            <Stat value="437" label="Clear to Close" tone="success" />
            <Stat value="304" label="Conditionally Approve" />
            <Stat value="97" label="No Decision" tone="warning" />
            <Stat value="1" label="Suspend" tone="critical" />
          </Grid>
        </Stack>

        <Stack gap={12}>
          <H2>Error / Quality Flags</H2>
          <Grid columns={3} gap={12}>
            <Card>
              <CardHeader>Friction (NC)</CardHeader>
              <CardBody>
                <Stat value="36" label="rows" tone="warning" />
                <Text size="small" tone="secondary" style={{ marginTop: 8 }}>
                  Missing VA LIN, high cash-to-close, guaranty discrepancies.
                </Text>
              </CardBody>
            </Card>
            <Card>
              <CardHeader>Eligibility (C)</CardHeader>
              <CardBody>
                <Stat value="7" label="rows" tone="critical" />
                <Text size="small" tone="secondary" style={{ marginTop: 8 }}>
                  Critical eligibility hard stops; guideline failures.
                </Text>
              </CardBody>
            </Card>
            <Card>
              <CardHeader>Compliance (C)</CardHeader>
              <CardBody>
                <Stat value="2" label="rows" tone="critical" />
                <Text size="small" tone="secondary" style={{ marginTop: 8 }}>
                  QM points/fees or regulatory compliance failures.
                </Text>
              </CardBody>
            </Card>
          </Grid>
        </Stack>
      </Grid>

      <Divider />

      {/* Key Findings */}
      <Stack gap={12}>
        <H2>Key Findings</H2>
        <Table
          headers={["#", "Finding", "Impact"]}
          rows={keyFindings}
          rowTone={[
            "warning",
            "warning",
            "warning",
            "warning",
            "warning",
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
          ]}
        />
      </Stack>

      <Text tone="secondary" size="small" style={{ paddingBottom: 12 }}>
        Source: Agent Data (4).xlsx · {TOTAL_ROWS} rows · {UNIQUE_LOANS} unique VA IRRRL loans · Analyzed Apr 17, 2026
      </Text>
    </Stack>
  );
}
