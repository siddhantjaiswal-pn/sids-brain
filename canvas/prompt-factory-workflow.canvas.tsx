import {
  Stack, Row, Grid, H1, H2, H3, Text, Card, CardHeader, CardBody,
  Divider, Table, Callout, Pill, Stat, Code,
  useHostTheme, type CanvasHostTheme,
} from 'cursor/canvas';

// ── Design atoms ──────────────────────────────────────────────────────────────

function AccentBar({ children, theme }: { children: string; theme: CanvasHostTheme }) {
  return (
    <div style={{ borderLeft: `3px solid ${theme.accent.primary}`, paddingLeft: 10 }}>
      <span style={{
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.12em',
        textTransform: 'uppercase' as const,
        color: theme.accent.primary,
      }}>
        {children}
      </span>
    </div>
  );
}

function NumBadge({ n, theme }: { n: number; theme: CanvasHostTheme }) {
  return (
    <div style={{
      width: 22,
      height: 22,
      borderRadius: 9999,
      background: theme.accent.primary,
      color: theme.text.onAccent,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 10,
      fontWeight: 800,
      flexShrink: 0,
      margin: '0 auto 6px',
    }}>
      {n}
    </div>
  );
}

type StationRole = 'neutral' | 'accent' | 'warn' | 'success';

function Station({
  n, label, sub, role = 'neutral', theme,
}: {
  n: number; label: string; sub?: string; role?: StationRole; theme: CanvasHostTheme;
}) {
  const isAccent = role === 'accent';
  const isSuccess = role === 'success';
  const isWarn = role === 'warn';

  const bg = isAccent
    ? theme.accent.primary
    : isSuccess
    ? theme.fill.primary
    : theme.fill.secondary;

  const border = isAccent
    ? theme.accent.primary
    : isWarn
    ? theme.stroke.primary
    : theme.stroke.secondary;

  const labelColor = isAccent ? theme.text.onAccent : theme.text.primary;
  const subColor = isAccent ? theme.text.onAccent : theme.text.tertiary;

  const badgeBg = isAccent ? theme.text.onAccent : theme.accent.primary;
  const badgeColor = isAccent ? theme.accent.primary : theme.text.onAccent;

  return (
    <div style={{
      background: bg,
      border: `1.5px solid ${border}`,
      borderRadius: 8,
      padding: '10px 14px',
      minWidth: 100,
      textAlign: 'center',
      flexShrink: 0,
    }}>
      <div style={{
        width: 20,
        height: 20,
        borderRadius: 9999,
        background: badgeBg,
        color: badgeColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 800,
        margin: '0 auto 6px',
        border: `1.5px solid ${border}`,
      }}>
        {n}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: labelColor, lineHeight: 1.3 }}>{label}</div>
      {sub && (
        <div style={{ fontSize: 10, color: subColor, marginTop: 3, lineHeight: 1.3 }}>{sub}</div>
      )}
    </div>
  );
}

function Belt({ theme }: { theme: CanvasHostTheme }) {
  return (
    <div style={{
      color: theme.text.quaternary,
      fontSize: 20,
      padding: '0 5px',
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
      paddingBottom: 4,
    }}>
      →
    </div>
  );
}

function TrackLabel({ children, theme }: { children: string; theme: CanvasHostTheme }) {
  return (
    <div style={{
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
      color: theme.text.quaternary,
      marginBottom: 4,
    }}>
      {children}
    </div>
  );
}

// ── Canvas ────────────────────────────────────────────────────────────────────

export default function PromptFactoryWorkflow() {
  const theme = useHostTheme();

  return (
    <Stack gap={32} style={{ padding: 28, maxWidth: 980 }}>

      {/* ── HEADER ── */}
      <Stack gap={10}>
        <Stack gap={8} style={{ alignItems: 'center', textAlign: 'center' }}>
          <Row gap={14} align="center" justify="center">
            <H1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-1px', lineHeight: 1.1 }}>Sid's Prompt Factory</H1>
            <Pill tone="success" active>PRODUCTION</Pill>
          </Row>
          <Text tone="secondary" style={{ maxWidth: 600 }}>
            Every prompt enters raw. None leave uninspected.
            The factory writes, QC-inspects, reworks, and dispatches —
            you only need to describe what the agent should do.
          </Text>
          <Row gap={8} wrap justify="center" style={{ marginTop: 4 }}>
            <Pill tone="info" active size="sm">Track A — New Prompt</Pill>
            <Pill tone="neutral" active size="sm">Track B — Refurbishment</Pill>
            <Pill tone="warning" active size="sm">Rework Loop</Pill>
            <Pill tone="success" active size="sm">9.0+ QC Gate</Pill>
            <Pill tone="deleted" active size="sm">6 Manual Sign-offs</Pill>
            <Pill tone="added" active size="sm">3 Auto-Repairs</Pill>
          </Row>
        </Stack>
      </Stack>

      {/* ── PRODUCTION FLOOR STATS ── */}
      <Stack gap={10}>
        <AccentBar theme={theme}>Production Floor Stats</AccentBar>
        <Grid columns={4} gap={14}>
          <Stat value="11" label="QC Checkpoints" />
          <Stat value="9.0+" label="Pass Threshold" tone="success" />
          <Stat value="6" label="Manual Sign-offs" tone="warning" />
          <Stat value="3" label="Auto-Repairs" tone="info" />
        </Grid>
      </Stack>

      <Divider />

      {/* ── FULL ASSEMBLY LINE (connected) ── */}
      <Stack gap={14}>
        <AccentBar theme={theme}>Full Assembly Line — End to End</AccentBar>
        <Text tone="secondary" size="small" style={{ maxWidth: 640 }}>
          One connected floor. Raw material in at the top, QC-stamped prompt dispatched at the bottom.
          The conveyor belt never stops — a prompt that fails QC loops back to Rework automatically.
        </Text>

        <div style={{
          background: theme.fill.tertiary,
          border: `1px solid ${theme.stroke.secondary}`,
          borderRadius: 10,
          padding: '24px 20px',
          position: 'relative',
          overflow: 'hidden',
        }}>

          {/* BELT 1 — INTAKE */}
          <Stack gap={8}>
            <Row gap={8} align="center">
              <div style={{
                background: theme.accent.primary,
                color: theme.text.onAccent,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.14em',
                padding: '3px 10px',
                borderRadius: 4,
                textTransform: 'uppercase' as const,
                flexShrink: 0,
              }}>
                Belt 1 — Intake
              </div>
              <div style={{ flex: 1, height: 1, background: theme.stroke.tertiary }} />
            </Row>

            <Row gap={0} align="center" wrap>
              <Station n={1} label="Raw Intake" sub='"prompt factory"' role="neutral" theme={theme} />
              <Belt theme={theme} />
              <Station n={2} label="Banner Stamp" sub="Factory opens" role="neutral" theme={theme} />
              <Belt theme={theme} />
              <Station n={3} label="Mode Gate" sub="New or Existing?" role="accent" theme={theme} />
            </Row>
          </Stack>

          {/* Connector belt 1 → 2 */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '6px 0',
          }}>
            <div style={{
              width: 2,
              height: 28,
              background: theme.accent.primary,
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                bottom: -5,
                left: -4,
                color: theme.accent.primary,
                fontSize: 12,
              }}>
                ▼
              </div>
            </div>
          </div>

          {/* BELT 2 — FABRICATION (split tracks) */}
          <Stack gap={8}>
            <Row gap={8} align="center">
              <div style={{
                background: theme.fill.primary,
                color: theme.text.primary,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.14em',
                padding: '3px 10px',
                borderRadius: 4,
                border: `1px solid ${theme.stroke.secondary}`,
                textTransform: 'uppercase' as const,
                flexShrink: 0,
              }}>
                Belt 2 — Fabrication
              </div>
              <div style={{
                fontSize: 10,
                color: theme.text.tertiary,
                fontWeight: 600,
              }}>
                Track splits here
              </div>
              <div style={{ flex: 1, height: 1, background: theme.stroke.tertiary }} />
            </Row>

            <Grid columns={2} gap={12}>
              {/* Track A */}
              <div style={{
                background: theme.bg.editor,
                border: `1.5px solid ${theme.stroke.secondary}`,
                borderRadius: 8,
                padding: '10px 12px',
              }}>
                <Row gap={6} align="center" style={{ marginBottom: 8 }}>
                  <Pill tone="info" size="sm" active>Track A</Pill>
                  <Text size="small" tone="tertiary" weight="semibold">New Prompt</Text>
                </Row>
                <Row gap={0} align="center">
                  <Station n={4} label="Load Material" sub="Your description" role="neutral" theme={theme} />
                  <Belt theme={theme} />
                  <Station n={5} label="Fabricate" sub="Write steps" role="neutral" theme={theme} />
                </Row>
              </div>

              {/* Track B */}
              <div style={{
                background: theme.bg.editor,
                border: `1.5px solid ${theme.stroke.secondary}`,
                borderRadius: 8,
                padding: '10px 12px',
              }}>
                <Row gap={6} align="center" style={{ marginBottom: 8 }}>
                  <Pill tone="neutral" size="sm" active>Track B</Pill>
                  <Text size="small" tone="tertiary" weight="semibold">Refurbishment</Text>
                </Row>
                <Row gap={0} align="center">
                  <Station n={4} label="File Scan" sub="Read & score" role="neutral" theme={theme} />
                  <Belt theme={theme} />
                  <Station n={5} label="QC Report" sub="Show findings" role="accent" theme={theme} />
                  <Belt theme={theme} />
                  <Station n={5} label="Improve?" sub="User confirms" role="warn" theme={theme} />
                </Row>
              </div>
            </Grid>
          </Stack>

          {/* Connector belt 2 → 3 (merge) */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '6px 0',
            position: 'relative',
          }}>
            <div style={{
              width: 2,
              height: 28,
              background: theme.accent.primary,
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                bottom: -5,
                left: -4,
                color: theme.accent.primary,
                fontSize: 12,
              }}>
                ▼
              </div>
            </div>
            <div style={{
              position: 'absolute',
              right: 20,
              top: 10,
              fontSize: 10,
              color: theme.text.tertiary,
              fontWeight: 600,
            }}>
              Tracks merge here
            </div>
          </div>

          {/* BELT 3 — QC + DISPATCH */}
          <Stack gap={8}>
            <Row gap={8} align="center">
              <div style={{
                background: theme.accent.primary,
                color: theme.text.onAccent,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.14em',
                padding: '3px 10px',
                borderRadius: 4,
                textTransform: 'uppercase' as const,
                flexShrink: 0,
              }}>
                Belt 3 — QC + Dispatch
              </div>
              <div style={{ flex: 1, height: 1, background: theme.stroke.tertiary }} />
            </Row>

            {/* QC row */}
            <Row gap={0} align="center" wrap>
              <Station n={6} label="Sign-Off" sub="Confirm steps" role="neutral" theme={theme} />
              <Belt theme={theme} />
              <Station n={7} label="QC Inspect" sub="Score all 10" role="accent" theme={theme} />
              <Belt theme={theme} />
              <Station n={8} label="Rework" sub="Fix all flags" role="warn" theme={theme} />
              <Belt theme={theme} />
              <Station n={9} label="Re-Inspect" sub="Verify 9.0+" role="accent" theme={theme} />
            </Row>

            {/* Rework loop indicator */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              position: 'relative',
            }}>
              <div style={{
                border: `1.5px dashed ${theme.stroke.primary}`,
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                width: '60%',
                height: 24,
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  left: -8,
                  top: -2,
                  color: theme.text.tertiary,
                  fontSize: 12,
                }}>
                  ↑
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: 2,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: 9,
                  fontWeight: 700,
                  color: theme.text.tertiary,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase' as const,
                  whiteSpace: 'nowrap' as const,
                }}>
                  Rework loop — repeats until 9.0+
                </div>
              </div>
            </div>

            {/* Dispatch row */}
            <Row gap={8} align="center">
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                color: theme.text.tertiary,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                flexShrink: 0,
              }}>
                9.0+ reached
              </div>
              <div style={{
                color: theme.accent.primary,
                fontSize: 16,
                flexShrink: 0,
              }}>
                →
              </div>
              <Station n={10} label="Dispatch" sub="output-prompts/" role="success" theme={theme} />
              <Belt theme={theme} />
              <Station n={11} label="Report" sub="Summary printed" role="success" theme={theme} />
            </Row>
          </Stack>
        </div>

        <Callout tone="warning" title="How the Rework Loop operates">
          When QC at Station 7 flags defects, the part routes to Station 8 (Rework).
          The agent batches all sign-off requests — [BRANCH], [TERMINAL], [COMPLETION], [VAGUE], [SOURCE] —
          into one message. You answer once. Auto-repairs ([VOCAB], [ESCALATION], [CROSS-TASK]) run silently.
          Then the part re-enters QC at Station 9. If still below 9.0, it loops again. Once 9.0+ is reached,
          the part exits the loop and moves to Station 10 (Dispatch).
        </Callout>
      </Stack>

      <Divider />

      {/* ── BELT-BY-BELT BREAKDOWN (separate sections) ── */}
      <Stack gap={18}>
        <AccentBar theme={theme}>Belt-by-Belt Breakdown</AccentBar>

        {/* Belt 1 detail */}
        <Stack gap={8}>
          <H2>Belt 1 — Intake</H2>
          <Row gap={0} align="center" wrap>
            <Station n={1} label="Raw Intake" sub='"prompt factory"' role="neutral" theme={theme} />
            <Belt theme={theme} />
            <Station n={2} label="Banner Stamp" sub="Factory opens" role="neutral" theme={theme} />
            <Belt theme={theme} />
            <Station n={3} label="Mode Gate" sub="New or Existing?" role="accent" theme={theme} />
          </Row>
          <Text size="small" tone="secondary">
            You invoke the factory. Banner prints. Agent asks one question: new prompt or existing file?
          </Text>
        </Stack>

        <Divider />

        {/* Belt 2 detail */}
        <Stack gap={8}>
          <H2>Belt 2 — Fabrication Floor</H2>
          <Grid columns={2} gap={14}>
            <Card>
              <CardHeader trailing={<Pill tone="info" size="sm" active>Track A</Pill>}>
                New Prompt
              </CardHeader>
              <CardBody>
                <Stack gap={8}>
                  <Row gap={0} align="center">
                    <Station n={4} label="Load Material" sub="Your description" role="neutral" theme={theme} />
                    <Belt theme={theme} />
                    <Station n={5} label="Fabricate" sub="Steps written" role="neutral" theme={theme} />
                  </Row>
                  <Text size="small" tone="secondary">
                    You provide one description. Agent infers all branching, escalations, and calculations internally.
                  </Text>
                </Stack>
              </CardBody>
            </Card>
            <Card>
              <CardHeader trailing={<Pill tone="neutral" size="sm" active>Track B</Pill>}>
                Existing Prompt — Refurbishment
              </CardHeader>
              <CardBody>
                <Stack gap={10}>
                  <Row gap={0} align="center" wrap>
                    <Station n={4} label="File Scan" sub="Read & score" role="neutral" theme={theme} />
                    <Belt theme={theme} />
                    <Station n={5} label="QC Report" sub="Show findings" role="accent" theme={theme} />
                    <Belt theme={theme} />
                    <Station n={5} label="Improve?" sub="User confirms" role="warn" theme={theme} />
                  </Row>
                  <Text size="small" tone="secondary">
                    Agent reads the <Code>.md</Code> file, immediately runs a full QC scan, and presents the scorecard + all flagged issues. Only then asks: "Want me to improve this prompt?" No edits until you confirm.
                  </Text>
                  <Callout tone="info" title="Initial QC scan is automatic">
                    You see the score and every defect before deciding whether to proceed. Say "fix all flagged issues" or describe specific changes — then the standard rework loop begins.
                  </Callout>
                </Stack>
              </CardBody>
            </Card>
          </Grid>
        </Stack>

        <Divider />

        {/* Belt 3 detail */}
        <Stack gap={8}>
          <H2>Belt 3 — QC + Dispatch</H2>
          <Row gap={0} align="center" wrap>
            <Station n={6} label="Sign-Off" sub="Confirm steps" role="neutral" theme={theme} />
            <Belt theme={theme} />
            <Station n={7} label="QC Inspect" sub="Score all 10" role="accent" theme={theme} />
            <Belt theme={theme} />
            <Station n={8} label="Rework" sub="Fix all flags" role="warn" theme={theme} />
            <Belt theme={theme} />
            <Station n={9} label="Re-Inspect" sub="Verify 9.0+" role="accent" theme={theme} />
            <Belt theme={theme} />
            <Station n={10} label="Dispatch" sub="output-prompts/" role="success" theme={theme} />
            <Belt theme={theme} />
            <Station n={11} label="Report" sub="Summary printed" role="success" theme={theme} />
          </Row>
          <Text size="small" tone="secondary">
            Both tracks merge here. Steps are confirmed, QC-scored, reworked if needed, then dispatched.
          </Text>
        </Stack>
      </Stack>

      <Divider />

      {/* ── FABRICATION FLOOR ── */}
      <Stack gap={14}>
        <AccentBar theme={theme}>Fabrication Floor — Mode Detail</AccentBar>
        <Grid columns={2} gap={16}>
          <Card>
            <CardHeader trailing={<Pill tone="info" size="sm" active>Track A</Pill>}>
              New Prompt — Load Material
            </CardHeader>
            <CardBody>
              <Stack gap={10}>
                <Text>
                  One input from you. The agent infers all branching, escalations, calculations,
                  and data sources — no follow-up questions asked.
                </Text>
                <H3>Load your blueprint with:</H3>
                <Stack gap={5}>
                  {[
                    'Step-by-step workflow in plain English',
                    'Branching conditions — state rules, exemptions, missing data',
                    'Calculations — formula, rounding rules, constraints',
                    'When the agent should escalate and why',
                    'What a successful outcome looks like',
                  ].map((item) => (
                    <Row key={item} gap={8} align="start">
                      <Text tone="tertiary" size="small" style={{ flexShrink: 0 }}>›</Text>
                      <Text size="small">{item}</Text>
                    </Row>
                  ))}
                </Stack>
              </Stack>
            </CardBody>
          </Card>
          <Card>
            <CardHeader trailing={<Pill tone="neutral" size="sm" active>Track B</Pill>}>
              Existing Prompt — Refurbishment Line
            </CardHeader>
            <CardBody>
              <Stack gap={10}>
                <Text>
                  Point to any <Code>.md</Code> task file. The factory runs a full QC scan
                  immediately — scorecard and all flagged defects printed before you answer
                  a single question.
                </Text>
                <H3>Initial QC report shows:</H3>
                <Stack gap={5}>
                  {[
                    'Score out of 10.0 across all dimensions',
                    'Full scorecard table with per-dimension rationale',
                    'Every flagged defect with step number and category',
                  ].map((item) => (
                    <Row key={item} gap={8} align="start">
                      <Text tone="tertiary" size="small" style={{ flexShrink: 0 }}>›</Text>
                      <Text size="small">{item}</Text>
                    </Row>
                  ))}
                </Stack>
                <Callout tone="warning" title="Gate: you decide whether to proceed">
                  After the QC report, the factory asks: "Want me to improve this prompt?" Nothing is touched until you say yes.
                </Callout>
              </Stack>
            </CardBody>
          </Card>
        </Grid>
      </Stack>

      <Divider />

      {/* ── QC INSPECTION CHECKLIST ── */}
      <Stack gap={12}>
        <AccentBar theme={theme}>QC Inspection Checklist — 10 Checkpoints</AccentBar>
        <Row gap={10} align="center">
          <Text tone="secondary">Each checkpoint scored 0–10. Part ships only when overall average reaches</Text>
          <Pill tone="success" active size="sm">9.0 or above</Pill>
        </Row>
        <Table
          headers={['#', 'Checkpoint', 'What gets inspected', 'Common defect found']}
          rows={[
            ['1', 'Specificity', 'Exact field names, document types, and values named everywhere', "Vague refs: 'the loan', 'the document', 'the income'"],
            ['2', 'Clarity', 'Each step: what to check, what to look for, what to do with the result', 'Step checks something but never states what action to take'],
            ['3', 'Conciseness', 'No padding, repetition, or prose that does not belong in instructions', 'Over-explained steps, repeated content, narrative writing'],
            ['4', 'Branch Completeness', 'Every if-condition has a matching else or else if', 'if block with no else — path left unhandled'],
            ['5', 'Path Termination', 'Every branch ends in Complete or Escalate — no dead ends', 'Branch trails off with no stated terminal action'],
            ['6', 'Explicit Completion', "Success path contains 'Use finish with status=completed' verbatim", "Paraphrased as 'complete the task' or missing entirely"],
            ['7', 'Self-Containment', 'No step references what a previous task found or decided', 'Cross-task memory reference — agent has no memory between tasks'],
            ['8', 'Action Vocabulary', 'Canonical Vesta action phrasings used throughout', "Informal: 'check the credit' instead of 'Review the credit report'"],
            ['9', 'Escalation Coverage', 'Every failure path escalates with an explicit quoted reason string', 'Escalation present but missing the reason string in single quotes'],
            ['10', 'Data Source Distinction', 'Loan data reads and document reviews kept clearly separate', "'check income' without specifying search_loan_data_model vs document review"],
            ['11', 'No UI References', 'No step navigates a UI, clicks a button, or picks a field from a screen — agent has no UI access', '"Go to the loan screen and select the field" — agent cannot access any UI'],
          ]}
          columnAlign={['center', 'left', 'left', 'left']}
          striped
          stickyHeader
        />
      </Stack>

      <Divider />

      {/* ── DEFECT REGISTRY ── */}
      <Stack gap={12}>
        <AccentBar theme={theme}>Defect Registry — Rework Rules</AccentBar>
        <Row gap={10} align="center" wrap>
          <Text tone="secondary">8 defect types. Routed to either manual sign-off or auto-repair.</Text>
          <Pill tone="warning" active size="sm">6 need your sign-off</Pill>
          <Pill tone="info" active size="sm">3 are auto-repaired</Pill>
        </Row>
        <Table
          headers={['Defect Tag', 'What triggered it', 'Rework action', 'Sign-off?']}
          rows={[
            ['[BRANCH]', 'if block with no else/else if', 'Asks: "Step N — what happens when condition is not met? Complete or Escalate, with what reason?"', 'Required'],
            ['[TERMINAL]', 'Branch has no terminal action', 'Asks: "Step N — Complete or Escalate? If Escalate, what is the reason?"', 'Required'],
            ['[COMPLETION]', 'Paraphrased or missing finish call', 'Asks: "Step N — replace with Use finish with status=completed verbatim? Confirm or provide phrasing."', 'Required'],
            ['[VAGUE]', 'Generic field or document name', 'Asks: "Step N uses [vague term] — what is the exact field or document name?"', 'Required'],
            ['[SOURCE]', 'Ambiguous data source', 'Asks: "Step N — loan data or document review? If document, what is its name?"', 'Required'],
            ['[VOCAB]', 'Non-canonical action phrasing', 'Auto-replaces with exact canonical Vesta action phrase', 'Auto-repaired'],
            ['[ESCALATION]', 'Escalation missing reason string', 'Auto-adds quoted reason string in single quotes', 'Auto-repaired'],
            ['[CROSS-TASK]', 'Reference to another task output', 'Auto-rewrites as explicit runtime lookup', 'Auto-repaired'],
            ['[UI-ACCESS]', 'Step navigates UI or picks field from screen', 'Asks: "Step N references UI navigation — agent has no UI access. What should it actually retrieve? Loan data or document?"', 'Required'],
          ]}
          columnAlign={['left', 'left', 'left', 'left']}
          rowTone={['warning', 'warning', 'warning', 'warning', 'warning', 'info', 'info', 'info', 'warning']}
        />
        <Callout tone="warning" title="Sign-offs are batched — never one at a time">
          All 6 defects requiring your input are listed in a single message before the Rework Station touches anything.
          You answer everything at once. Then all fixes are applied and QC re-runs.
        </Callout>
      </Stack>

      <Divider />

      {/* ── DISPATCH BAY + TOOLBOX ── */}
      <Grid columns={2} gap={20}>

        {/* Dispatch */}
        <Stack gap={12}>
          <AccentBar theme={theme}>Dispatch Bay — Output Spec</AccentBar>
          <Card>
            <CardHeader trailing={<Pill tone="success" size="sm" active>QC Passed</Pill>}>
              output-prompts/task-slug.md
            </CardHeader>
            <CardBody>
              <Stack gap={10}>
                <Stack gap={5}>
                  {[
                    'Task title',
                    'Checklist Steps only',
                    'No metadata, no External ID, no Completion Conditions',
                  ].map((item) => (
                    <Row key={item} gap={8} align="start">
                      <Text tone="tertiary" size="small" style={{ flexShrink: 0 }}>›</Text>
                      <Text size="small">{item}</Text>
                    </Row>
                  ))}
                </Stack>
                <Callout tone="success" title="Source files are never touched">
                  All output goes to output-prompts/ only. Original task files remain unchanged.
                </Callout>
              </Stack>
            </CardBody>
          </Card>
        </Stack>

        {/* Toolbox */}
        <Stack gap={12}>
          <AccentBar theme={theme}>Factory Toolbox — Related Skills</AccentBar>
          <Stack gap={8}>
            <Card>
              <CardHeader trailing={<Pill size="sm">Manual Line</Pill>}>
                vesta-prompt-designer
              </CardHeader>
              <CardBody>
                <Text size="small">
                  Hand-crafted production. Asks 10 clarifying questions before fabricating
                  a single step. Use when you want full control over every decision.
                </Text>
              </CardBody>
            </Card>
            <Card>
              <CardHeader trailing={<Pill tone="info" size="sm">QC Only</Pill>}>
                score-prompt
              </CardHeader>
              <CardBody>
                <Text size="small">
                  Inspection without rework. Scores any prompt across all 10 checkpoints
                  and flags defects — no fixes, no writes.
                </Text>
              </CardBody>
            </Card>
            <Card>
              <CardHeader trailing={<Pill tone="warning" size="sm">Bulk Run</Pill>}>
                overhaul-objective-prompts
              </CardHeader>
              <CardBody>
                <Text size="small">
                  Factory-wide overhaul. Scores and rewrites every instruction task under
                  a full objective in parallel. Use for a bulk production run.
                </Text>
              </CardBody>
            </Card>
          </Stack>
        </Stack>

      </Grid>

    </Stack>
  );
}
