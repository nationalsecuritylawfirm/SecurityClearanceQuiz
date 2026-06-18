// Initial quiz data — loaded into localStorage on first visit if no data exists.
// Edit quizzes through the builder UI rather than editing this file directly.

const SEED_QUIZZES = [
  // ─────────────────────────────────────────────
  // Quiz 1: SF-86 Readiness Check
  // ─────────────────────────────────────────────
  {
    id: 'sf86-red-flags',
    slug: 'sf86-red-flags',
    title: 'SF-86 Readiness Check',
    subtitle: 'Do You Have Any Security Clearance Red Flags?',
    groundingNote: '',
    questions: [
      {
        id: 'sf86-q1',
        order: 1,
        text: 'Where are you in the security clearance process?',
        options: [
          { id: 'sf86-q1o1', text: 'I have not submitted the SF-86/SF-85 yet', tier: 1, flags: [] },
          { id: 'sf86-q1o2', text: 'I already submitted the SF-86/SF-85', tier: 1, flags: [] },
          { id: 'sf86-q1o3', text: 'I received a Letter of Interrogatory (LOI), Statement of Reasons (SOR), denial, suspension, or revocation notice', tier: 5, flags: ['LOI, SOR, or formal government action'] },
        ]
      },
      {
        id: 'sf86-q2',
        order: 2,
        text: 'Do you have complete residence, education, employment, foreign travel, and/or criminal record history?',
        options: [
          { id: 'sf86-q2o1', text: 'Yes', tier: 1, flags: [] },
          { id: 'sf86-q2o2', text: 'Mostly, but I am missing some dates, supporting documents, addresses, or supervisor/contact information', tier: 2, flags: ['Information gaps'] },
          { id: 'sf86-q2o3', text: 'I have gaps I am not sure how to explain', tier: 2, flags: ['Information gaps'] },
        ]
      },
      {
        id: 'sf86-q3',
        order: 3,
        text: 'Do you have any foreign contacts, foreign relatives, foreign travel, dual citizenship, foreign property, or foreign financial interests?',
        options: [
          { id: 'sf86-q3o1', text: 'No', tier: 1, flags: [] },
          { id: 'sf86-q3o2', text: 'Yes, but straightforward', tier: 1, flags: [] },
          { id: 'sf86-q3o3', text: 'Yes, and I am not sure what must be listed', tier: 3, flags: ['Foreign interests or contacts'] },
          { id: 'sf86-q3o4', text: 'Yes, and the country or relationship may raise concerns', tier: 3, flags: ['Foreign interests or contacts'] },
        ]
      },
      {
        id: 'sf86-q4',
        order: 4,
        text: 'Do you have financial issues?',
        options: [
          { id: 'sf86-q4o1', text: 'No', tier: 1, flags: [] },
          { id: 'sf86-q4o2', text: 'Past late payments, now resolved', tier: 3, flags: ['Financial issue'] },
          { id: 'sf86-q4o3', text: 'Current delinquent debt', tier: 3, flags: ['Financial issue', 'Current delinquency'] },
          { id: 'sf86-q4o4', text: 'Tax debt, collections, charge-offs, bankruptcy, wage garnishment, or foreclosure', tier: 3, flags: ['Financial issue', 'Tax or bankruptcy issue'] },
          { id: 'sf86-q4o5', text: 'I am not sure what appears on my credit report', tier: 2, flags: ['Unknown credit report issue'] },
        ]
      },
      {
        id: 'sf86-q5',
        order: 5,
        text: 'Any police, criminal, or court history?',
        options: [
          { id: 'sf86-q5o1', text: 'No', tier: 1, flags: [] },
          { id: 'sf86-q5o2', text: 'Yes — older or minor issue, now resolved (such as citations, dismissed, sealed, expunged, or old minor offenses)', tier: 3, flags: ['Police or court history'] },
          { id: 'sf86-q5o3', text: 'Yes — recent or still pending (pending charges, upcoming court dates, currently on probation/parole, or unresolved cases)', tier: 3, flags: ['Police or court history', 'Pending legal matter'] },
          { id: 'sf86-q5o4', text: 'Yes — serious or sensitive matters (such as felony, domestic violence, restraining/protective order, assault/violence, or firearms/explosives)', tier: 3, flags: ['Police or court history', 'Serious criminal matter'] },
          { id: 'sf86-q5o5', text: 'I\'m not sure whether I need to disclose it', tier: 4, flags: ['Disclosure concern'] },
        ]
      },
      {
        id: 'sf86-q6',
        order: 6,
        text: 'Any drug, marijuana, CBD/delta, or controlled substance issue?',
        options: [
          { id: 'sf86-q6o1', text: 'No', tier: 1, flags: [] },
          { id: 'sf86-q6o2', text: 'Past marijuana/THC or controlled substance use', tier: 3, flags: ['Drug or substance issue'] },
          { id: 'sf86-q6o3', text: 'Recent marijuana/THC or controlled substance use', tier: 3, flags: ['Drug or substance issue'] },
          { id: 'sf86-q6o4', text: 'Use while cleared or after starting the clearance process', tier: 3, flags: ['Drug use while cleared'] },
          { id: 'sf86-q6o5', text: 'I am not sure how to answer', tier: 4, flags: ['Disclosure concern'] },
        ]
      },
      {
        id: 'sf86-q7',
        order: 7,
        text: 'Any alcohol-related incidents?',
        options: [
          { id: 'sf86-q7o1', text: 'No', tier: 1, flags: [] },
          { id: 'sf86-q7o2', text: 'One older incident', tier: 3, flags: ['Alcohol incident'] },
          { id: 'sf86-q7o3', text: 'Recent incident(s)', tier: 3, flags: ['Alcohol incident'] },
          { id: 'sf86-q7o4', text: 'Work, school, or military alcohol issue', tier: 3, flags: ['Alcohol incident'] },
          { id: 'sf86-q7o5', text: 'Treatment, relapse, or repeated incidents', tier: 3, flags: ['Alcohol or treatment issue'] },
        ]
      },
      {
        id: 'sf86-q8',
        order: 8,
        text: 'Have you had a prior clearance issue?',
        options: [
          { id: 'sf86-q8o1', text: 'No', tier: 1, flags: [] },
          { id: 'sf86-q8o2', text: 'Prior interim clearance denied', tier: 3, flags: ['Prior clearance issue'] },
          { id: 'sf86-q8o3', text: 'Prior clearance denied, suspended, or revoked', tier: 3, flags: ['Prior clearance issue'] },
          { id: 'sf86-q8o4', text: 'Prior SOR/LOI/interrogatories', tier: 3, flags: ['Prior clearance issue'] },
          { id: 'sf86-q8o5', text: 'I previously omitted or misstated something', tier: 4, flags: ['Disclosure concern', 'Prior omission or misstatement'] },
        ]
      },
      {
        id: 'sf86-q9',
        order: 9,
        text: 'Are you worried about inconsistent, incomplete, or inaccurate answers?',
        options: [
          { id: 'sf86-q9o1', text: 'No', tier: 1, flags: [] },
          { id: 'sf86-q9o2', text: 'Maybe', tier: 4, flags: ['Disclosure concern'] },
          { id: 'sf86-q9o3', text: 'Yes, I omitted something', tier: 4, flags: ['Disclosure concern', 'Omission'] },
          { id: 'sf86-q9o4', text: 'Yes, I gave different information before', tier: 4, flags: ['Disclosure concern', 'Inconsistent information'] },
          { id: 'sf86-q9o5', text: 'Yes, I already submitted and need to correct something', tier: 4, flags: ['Disclosure concern', 'Correction needed'] },
        ]
      },
    ],
    results: [
      {
        tier: 1,
        label: 'Ready to Submit — Keep It Accurate',
        forPeopleWith: 'Complete history, no major issues, and no inconsistency concerns.',
        message: 'Your answers suggest you may be in a good position to continue preparing your questionnaire. The most important next step is accuracy: make sure dates, addresses, contacts, and explanations are complete before submission.',
        ctaText: 'Download the SF-86 final review checklist',
        ctaType: 'download',
      },
      {
        tier: 2,
        label: 'Information Gaps — Gather Details Before Submitting',
        forPeopleWith: 'People missing dates, addresses, employment details, foreign travel details, supervisor contacts, or court records.',
        message: 'Your answers suggest the biggest issue may not be a legal red flag, but missing or incomplete information. Before submitting, gather documents and clarify gaps so your answers are consistent and complete.',
        ctaText: 'Get the SF-86 document checklist',
        ctaType: 'download',
      },
      {
        tier: 3,
        label: 'Potential Red Flags — Explanation May Matter',
        forPeopleWith: 'People with debt, foreign contacts, drug use, alcohol issues, police history, or similar concerns.',
        message: 'Your answers suggest one or more areas may require careful explanation. A red flag does not automatically mean denial, but the way you disclose, explain, and document the issue can matter.',
        ctaText: 'Schedule a pre-submission clearance consultation',
        ctaType: 'schedule',
      },
      {
        tier: 4,
        label: 'Disclosure Accuracy Concern — Be Careful Before Submitting, Updating, or Correcting',
        forPeopleWith: 'People who already submitted, omitted something, gave inconsistent information, or are worried they answered incorrectly.',
        message: 'Your answers suggest the issue may involve disclosure accuracy, consistency, or completeness. Before submitting, updating, or correcting prior answers, consider getting advice on how to explain the issue clearly and accurately.',
        ctaText: 'Speak with a clearance attorney before submitting a correction',
        ctaType: 'contact',
      },
      {
        tier: 5,
        label: 'Government Action — High Urgency',
        forPeopleWith: 'People who received an LOI, SOR, interrogatories, suspension, revocation, denial, or hearing notice.',
        message: 'Your answers suggest the matter may already be in a response or appeal stage. The next step is to identify the document type, agency, allegations, and evidence before submitting anything.',
        ctaText: 'Request an urgent case review',
        ctaType: 'contact',
      },
    ],
    availableFlags: [
      'Information gaps',
      'Foreign interests or contacts',
      'Financial issue',
      'Current delinquency',
      'Tax or bankruptcy issue',
      'Unknown credit report issue',
      'Police or court history',
      'Pending legal matter',
      'Serious criminal matter',
      'Drug or substance issue',
      'Drug use while cleared',
      'Alcohol incident',
      'Alcohol or treatment issue',
      'Prior clearance issue',
      'Disclosure concern',
      'Prior omission or misstatement',
      'Omission',
      'Inconsistent information',
      'Correction needed',
      'LOI, SOR, or formal government action',
    ],
    leadCapture: {
      fields: ['name', 'email', 'phone', 'deadline'],
      issueTypeLabel: '',
      issueTypeOptions: [],
    },
  },

  // ─────────────────────────────────────────────
  // Quiz 2: Debt, Taxes & Security Clearance Risk Check
  // ─────────────────────────────────────────────
  {
    id: 'debt-taxes-clearance-risk',
    slug: 'debt-taxes-clearance-risk',
    title: 'Debt, Taxes & Security Clearance Risk Check',
    subtitle: 'Could Your Financial Issue Affect Your Clearance?',
    groundingNote: 'Financial considerations are a recognized security clearance adjudicative area. CDSE\'s Guideline F training explains that failure to satisfy debts or meet financial obligations can raise concerns, but it also emphasizes that the cause of the debt and the action taken to resolve it can matter more than the raw amount. DCSA also lists financial problems as a self-reporting category for clearance holders, and continuous vetting can include financial and public-record checks.',
    questions: [
      {
        id: 'dt-q1',
        order: 1,
        text: 'Where are you in the security clearance or public trust process?',
        options: [
          { id: 'dt-q1o1', text: 'I have not submitted the SF-86/SF-85/SF-85P yet', tier: 1, flags: [] },
          { id: 'dt-q1o2', text: 'I already submitted and/or have an investigator interview coming up', tier: 1, flags: [] },
          { id: 'dt-q1o3', text: 'I currently hold a clearance, public trust, or sensitive position', tier: 1, flags: [] },
        ]
      },
      {
        id: 'dt-q2',
        order: 2,
        text: 'What financial issue are you most concerned about?',
        options: [
          { id: 'dt-q2o1', text: 'No specific financial issue — I am just checking', tier: 1, flags: [] },
          { id: 'dt-q2o2', text: 'Debt, late payments, collections, charge-offs, or unpaid loans', tier: 3, flags: ['Financial issue', 'Debt or collections'] },
          { id: 'dt-q2o3', text: 'Tax debt, unfiled taxes, IRS issue, or state tax issue', tier: 3, flags: ['Financial issue', 'Tax issue'] },
          { id: 'dt-q2o4', text: 'Bankruptcy, judgment, lien, garnishment, foreclosure, repossession, or eviction', tier: 3, flags: ['Financial issue', 'Bankruptcy or judgment'] },
          { id: 'dt-q2o5', text: 'Gambling, unexplained income/assets, business debt, or multiple financial issues', tier: 3, flags: ['Financial issue', 'Gambling or unexplained assets'] },
        ]
      },
      {
        id: 'dt-q3',
        order: 3,
        text: 'What is the current status of the issue?',
        options: [
          { id: 'dt-q3o1', text: 'There is no financial issue', tier: 1, flags: [] },
          { id: 'dt-q3o2', text: 'Resolved, paid, discharged, settled, or no longer delinquent', tier: 3, flags: ['Resolved financial issue'] },
          { id: 'dt-q3o3', text: 'I am on a payment plan, tax agreement, credit counseling plan, or repayment schedule', tier: 3, flags: ['Payment plan or tax agreement'] },
          { id: 'dt-q3o4', text: 'It is still delinquent, unpaid, unresolved, or I do not have a plan yet', tier: 4, flags: ['Active financial concern', 'Current delinquency'] },
          { id: 'dt-q3o5', text: 'There is active legal or collection action (lawsuit, judgment, garnishment, lien, foreclosure, eviction, or levy)', tier: 4, flags: ['Active financial concern', 'Active legal or collection action'] },
        ]
      },
      {
        id: 'dt-q4',
        order: 4,
        text: 'What caused the financial issue?',
        options: [
          { id: 'dt-q4o1', text: 'There is no financial issue', tier: 1, flags: [] },
          { id: 'dt-q4o2', text: 'Job loss, medical issue, divorce/separation, family emergency, business downturn, or another hardship', tier: 3, flags: ['Financial hardship'] },
          { id: 'dt-q4o3', text: 'Missed payments, budgeting problems, overspending, or repeated late payments', tier: 4, flags: ['Financial issue', 'Repeated financial problems'] },
          { id: 'dt-q4o4', text: 'Tax filing/payment problem, accounting issue, or confusion about what was owed', tier: 3, flags: ['Tax issue'] },
          { id: 'dt-q4o5', text: 'Gambling, unexplained income/assets, or I am not sure how to explain it', tier: 4, flags: ['Gambling or unexplained assets'] },
        ]
      },
      {
        id: 'dt-q5',
        order: 5,
        text: 'What steps have you taken to address it?',
        options: [
          { id: 'dt-q5o1', text: 'No financial issue to address', tier: 1, flags: [] },
          { id: 'dt-q5o2', text: 'Paid, resolved, settled, discharged, or corrected it', tier: 3, flags: ['Resolved financial issue'] },
          { id: 'dt-q5o3', text: 'Set up a payment plan, tax agreement, credit counseling, or repayment schedule and I am following it', tier: 3, flags: ['Payment plan or tax agreement'] },
          { id: 'dt-q5o4', text: 'I am trying to figure out what to do, but I do not have a clear plan yet', tier: 4, flags: ['Active financial concern'] },
          { id: 'dt-q5o5', text: 'No steps yet, stopped paying, ignored it, or fell behind on a plan', tier: 4, flags: ['Active financial concern', 'No action taken'] },
        ]
      },
      {
        id: 'dt-q6',
        order: 6,
        text: 'Do you have documents showing what happened and what you have done?',
        options: [
          { id: 'dt-q6o1', text: 'Yes, I have organized records and proof', tier: 1, flags: [] },
          { id: 'dt-q6o2', text: 'Some, but I am missing key records', tier: 2, flags: ['Missing financial records'] },
          { id: 'dt-q6o3', text: 'No, not yet', tier: 2, flags: ['Missing financial records'] },
          { id: 'dt-q6o4', text: 'I am not sure what documents I need', tier: 2, flags: ['Missing financial records', 'Documentation gap'] },
        ]
      },
      {
        id: 'dt-q7',
        order: 7,
        text: 'Are you worried about how you disclosed, reported, or explained the financial issue?',
        options: [
          { id: 'dt-q7o1', text: 'No', tier: 1, flags: [] },
          { id: 'dt-q7o2', text: 'Maybe — I have not submitted yet', tier: 2, flags: ['Disclosure concern'] },
          { id: 'dt-q7o3', text: 'Maybe — I submitted and am not sure whether I answered correctly', tier: 5, flags: ['Disclosure accuracy concern'] },
          { id: 'dt-q7o4', text: 'Yes, I omitted something or gave the wrong dates, amounts, or status', tier: 5, flags: ['Disclosure accuracy concern', 'Omission or misstatement'] },
          { id: 'dt-q7o5', text: 'Yes, I gave different information before', tier: 5, flags: ['Disclosure accuracy concern', 'Inconsistent information'] },
          { id: 'dt-q7o6', text: 'I hold a clearance and am not sure whether I need to self-report it', tier: 5, flags: ['Self-reporting concern'] },
        ]
      },
      {
        id: 'dt-q8',
        order: 8,
        text: 'Has anyone contacted you about the financial issue?',
        options: [
          { id: 'dt-q8o1', text: 'No', tier: 1, flags: [] },
          { id: 'dt-q8o2', text: 'An investigator, FSO, security office, HR, command, or supervisor asked basic questions', tier: 4, flags: ['Government or security office contact'] },
          { id: 'dt-q8o3', text: 'I was asked for a written statement, documents, or explanation', tier: 5, flags: ['Written request from government'] },
          { id: 'dt-q8o4', text: 'I received an LOI, SOR, interrogatories, denial, suspension, revocation, hearing notice, or appeal deadline', tier: 5, flags: ['LOI, SOR, or formal government action'] },
          { id: 'dt-q8o5', text: 'I have a deadline, the deadline passed, or I am not sure when something is due', tier: 5, flags: ['Deadline concern'] },
        ]
      },
      {
        id: 'dt-q9',
        order: 9,
        text: 'What would you like help with?',
        options: [
          { id: 'dt-q9o1', text: 'Understanding whether the financial issue matters', tier: 1, flags: [] },
          { id: 'dt-q9o2', text: 'Preparing for the SF-86/SF-85/SF-85P or investigator interview', tier: 1, flags: [] },
          { id: 'dt-q9o3', text: 'Gathering documents or explaining mitigation', tier: 3, flags: ['Documentation needed'] },
          { id: 'dt-q9o4', text: 'Fixing, updating, or self-reporting a prior answer', tier: 5, flags: ['Disclosure accuracy concern'] },
          { id: 'dt-q9o5', text: 'Responding to LOI/SOR/interrogatories, denial, suspension, revocation, or appeal', tier: 5, flags: ['LOI, SOR, or formal government action'] },
        ]
      },
    ],
    results: [
      {
        tier: 1,
        label: 'No Major Financial Issue Flagged — Keep It Accurate',
        forPeopleWith: 'People with no financial issue, no missing records, no disclosure concern, and no government contact.',
        message: 'Your answers did not flag an obvious financial clearance concern in this quiz. The most important next step is accuracy: keep your financial, tax, credit, and court-related information complete and consistent if you submit, update, or discuss your background questionnaire.',
        ctaText: 'Download the Financial Clearance Final Review Checklist',
        ctaType: 'download',
      },
      {
        tier: 2,
        label: 'Information or Documentation Gap — Pull Records First',
        forPeopleWith: 'People with unknown credit report issues, missing documents, uncertain tax records, unclear payment status, missing court records, or uncertainty about what must be disclosed.',
        message: 'Your answers suggest the biggest issue may be incomplete information. Before submitting, updating, or explaining anything, gather the records needed to understand the issue clearly. Recommended documents may include credit reports, collection letters, payment records, settlement letters, tax transcripts, IRS/state tax agreements, bankruptcy papers, lien releases, court records, garnishment paperwork, foreclosure/eviction records, or proof of dispute.',
        ctaText: 'Get the Financial Records Checklist',
        ctaType: 'download',
      },
      {
        tier: 3,
        label: 'Resolved or Managed Financial Issue — Document Your Mitigation',
        forPeopleWith: 'People with past debt, late payments, collections, tax issues, bankruptcy, or other financial problems that have been paid, resolved, settled, discharged, disputed with proof, or placed on a payment plan.',
        message: 'Your answers suggest the financial issue may already be resolved or being handled. The key is showing what happened, what changed, and what documents support your explanation. Recommended next step: gather proof of payment, payment plans, tax agreements, counseling records, dispute letters, discharge papers, settlement letters, and evidence that the issue is under control.',
        ctaText: 'Get the Financial Mitigation Checklist',
        ctaType: 'download',
      },
      {
        tier: 4,
        label: 'Active Financial Concern — Action Plan May Matter',
        forPeopleWith: 'People with current delinquent debt, unpaid taxes, unresolved collections, no payment plan, repeated late payments, active lawsuits, judgments, garnishments, liens, foreclosure, eviction, levy, gambling-related financial issues, unexplained income/assets, or financial problems that are still ongoing.',
        message: 'Your answers suggest there may be an active financial issue that needs attention. A financial red flag does not automatically decide the outcome, but the way you address, document, and explain the issue can matter. Recommended next step: identify the total amount, current status, cause of the issue, whether it is ongoing, and what concrete steps you can document.',
        ctaText: 'Schedule a Financial Clearance Strategy Consultation',
        ctaType: 'schedule',
      },
      {
        tier: 5,
        label: 'Disclosure or Government Action Concern — High Urgency',
        forPeopleWith: 'People with a possible omission, inaccurate prior answer, inconsistent information, uncertainty after submitting, self-reporting concern, investigator/security office written request, LOI, SOR, interrogatories, denial, suspension, revocation, hearing, appeal, or deadline.',
        message: 'Your answers suggest the issue may involve disclosure accuracy, self-reporting, or a government response stage. Before submitting a correction, written statement, or response, identify the document type, deadline, agency, allegations, prior answers, and supporting evidence.',
        ctaText: 'Request an Urgent Financial Clearance Case Review',
        ctaType: 'contact',
      },
    ],
    availableFlags: [
      'Financial issue',
      'Debt or collections',
      'Tax issue',
      'Bankruptcy or judgment',
      'Gambling or unexplained assets',
      'Resolved financial issue',
      'Payment plan or tax agreement',
      'Active financial concern',
      'Current delinquency',
      'Active legal or collection action',
      'Financial hardship',
      'Repeated financial problems',
      'No action taken',
      'Missing financial records',
      'Documentation gap',
      'Documentation needed',
      'Disclosure concern',
      'Disclosure accuracy concern',
      'Omission or misstatement',
      'Inconsistent information',
      'Self-reporting concern',
      'Government or security office contact',
      'Written request from government',
      'LOI, SOR, or formal government action',
      'Deadline concern',
    ],
    leadCapture: {
      fields: ['name', 'email', 'phone', 'deadline'],
      issueTypeLabel: 'What type of issue?',
      issueTypeOptions: ['Debt', 'Taxes', 'Bankruptcy', 'Collections', 'Garnishment', 'SOR or LOI', 'Other'],
    },
  },

  // ─────────────────────────────────────────────
  // Quiz 3: Self-Reporting Checker
  // ─────────────────────────────────────────────
  {
    id: 'self-reporting-checker',
    slug: 'self-reporting-checker',
    title: 'Self-Reporting Checker',
    subtitle: 'Do You Need to Report This to Your Security Office?',
    groundingNote: 'DCSA says clearance holders are required to self-report life events or incidents that could affect clearance eligibility, and that agencies may have different self-reporting procedures. DCSA also lists categories such as foreign travel, foreign contacts, loss or compromise of information, financial problems, arrests, psychological/emotional health, substance abuse counseling, outside activities, media contacts, and pre-publication review. CDSE\'s SEAD 3 guide says covered individuals with classified access or sensitive positions have a continuing obligation to recognize, avoid, and report behaviors that may affect continued national security eligibility.',
    questions: [
      {
        id: 'sr-q1',
        order: 1,
        text: 'What best describes your current status?',
        options: [
          { id: 'sr-q1o1', text: 'I currently hold a security clearance', tier: 1, flags: [] },
          { id: 'sr-q1o2', text: 'I hold a public trust or sensitive position', tier: 1, flags: [] },
          { id: 'sr-q1o3', text: 'I am an applicant or recently submitted, but I do not hold the clearance/position yet', tier: 2, flags: ['May not be covered by self-reporting requirements'] },
          { id: 'sr-q1o4', text: 'My access, clearance, or position is already suspended, restricted, or under review', tier: 5, flags: ['Access suspended or under review'] },
        ]
      },
      {
        id: 'sr-q2',
        order: 2,
        text: 'Any foreign travel, foreign contact, or foreign interest issue?',
        options: [
          { id: 'sr-q2o1', text: 'No', tier: 1, flags: [] },
          { id: 'sr-q2o2', text: 'Foreign travel outside the U.S., including planned, recent, or unexpected travel', tier: 3, flags: ['Foreign travel'] },
          { id: 'sr-q2o3', text: 'Foreign spouse, partner, roommate, close contact, or continuing foreign contact', tier: 3, flags: ['Foreign contact or relationship'] },
          { id: 'sr-q2o4', text: 'Foreign citizenship, passport, voting, property, bank account, business, or financial interest', tier: 3, flags: ['Foreign citizenship or financial interest'] },
          { id: 'sr-q2o5', text: 'I am not sure what foreign-related information counts', tier: 2, flags: ['Uncertainty about foreign reporting'] },
        ]
      },
      {
        id: 'sr-q3',
        order: 3,
        text: 'Any police, criminal, DUI, or court issue?',
        options: [
          { id: 'sr-q3o1', text: 'No', tier: 1, flags: [] },
          { id: 'sr-q3o2', text: 'Older or minor matter, now resolved', tier: 2, flags: ['Police or court history'] },
          { id: 'sr-q3o3', text: 'Recent arrest, charge, DUI/DWI, summons, upcoming court date, probation/parole, or unresolved case', tier: 3, flags: ['Police or court history', 'Recent or pending legal matter'] },
          { id: 'sr-q3o4', text: 'Serious or sensitive matter (felony, domestic violence, protective order, violence, firearms/explosives, or drug-related matter)', tier: 3, flags: ['Police or court history', 'Serious criminal matter'] },
          { id: 'sr-q3o5', text: 'I am not sure whether I need to report it', tier: 2, flags: ['Disclosure uncertainty'] },
        ]
      },
      {
        id: 'sr-q4',
        order: 4,
        text: 'Any financial issue?',
        options: [
          { id: 'sr-q4o1', text: 'No', tier: 1, flags: [] },
          { id: 'sr-q4o2', text: 'Past financial issue, now resolved', tier: 2, flags: ['Financial issue'] },
          { id: 'sr-q4o3', text: 'Current delinquent debt, collections, charge-offs, or inability to meet financial obligations', tier: 3, flags: ['Financial issue', 'Current delinquency'] },
          { id: 'sr-q4o4', text: 'Tax debt, bankruptcy, wage garnishment, lien, foreclosure, or eviction', tier: 3, flags: ['Financial issue', 'Tax or bankruptcy issue'] },
          { id: 'sr-q4o5', text: 'I am not sure what appears on my credit report or public records', tier: 2, flags: ['Unknown credit or public records'] },
        ]
      },
      {
        id: 'sr-q5',
        order: 5,
        text: 'Any drug, alcohol, substance, or treatment-related issue?',
        options: [
          { id: 'sr-q5o1', text: 'No', tier: 1, flags: [] },
          { id: 'sr-q5o2', text: 'Older isolated issue, now resolved', tier: 2, flags: ['Drug or alcohol issue'] },
          { id: 'sr-q5o3', text: 'Recent marijuana/THC, drug, CBD/delta, or positive drug test issue', tier: 3, flags: ['Drug or substance issue'] },
          { id: 'sr-q5o4', text: 'DUI/DWI, alcohol-related incident, repeated alcohol incidents, or work/school/military alcohol issue', tier: 3, flags: ['Alcohol incident'] },
          { id: 'sr-q5o5', text: 'Substance abuse counseling/treatment, relapse, or counseling ordered because of conduct or performance', tier: 3, flags: ['Substance counseling or treatment'] },
        ]
      },
      {
        id: 'sr-q6',
        order: 6,
        text: 'Any classified information, security, cyber, media, or outside activity issue?',
        options: [
          { id: 'sr-q6o1', text: 'No', tier: 1, flags: [] },
          { id: 'sr-q6o2', text: 'Lost or mishandled classified/sensitive information, badge, device, credentials, or government property', tier: 5, flags: ['Classified information or security incident'] },
          { id: 'sr-q6o3', text: 'Possible unauthorized disclosure, spillage, cyber/IT misuse, or security violation', tier: 5, flags: ['Unauthorized disclosure or cyber issue'] },
          { id: 'sr-q6o4', text: 'Foreign person asked about sensitive work, suspicious contact, coercion, blackmail, or exploitation concern', tier: 5, flags: ['Suspicious contact or coercion'] },
          { id: 'sr-q6o5', text: 'Outside employment/volunteer activity, foreign business, media contact, publication, public speaking, or concern about another covered person', tier: 3, flags: ['Outside activity or media contact'] },
        ]
      },
      {
        id: 'sr-q7',
        order: 7,
        text: 'Have you already reported the issue?',
        options: [
          { id: 'sr-q7o1', text: 'No, I have not reported it yet', tier: 1, flags: [] },
          { id: 'sr-q7o2', text: 'Yes, I reported it verbally or informally', tier: 2, flags: ['Informal report only'] },
          { id: 'sr-q7o3', text: 'Yes, I reported it in writing', tier: 1, flags: [] },
          { id: 'sr-q7o4', text: 'I may have waited too long', tier: 4, flags: ['Reporting delay'] },
          { id: 'sr-q7o5', text: 'I may have left something out or given inconsistent details', tier: 4, flags: ['Incomplete or inconsistent report'] },
        ]
      },
      {
        id: 'sr-q8',
        order: 8,
        text: 'Has anyone contacted you, or is there a deadline?',
        options: [
          { id: 'sr-q8o1', text: 'No', tier: 1, flags: [] },
          { id: 'sr-q8o2', text: 'My FSO, security office, HR, command, or supervisor asked basic follow-up questions', tier: 3, flags: ['Security office contact'] },
          { id: 'sr-q8o3', text: 'I was asked for a written statement, documents, or explanation', tier: 5, flags: ['Written request from security office'] },
          { id: 'sr-q8o4', text: 'My access was suspended/restricted, or I received formal written questions or notice', tier: 5, flags: ['Access suspended or formal notice'] },
          { id: 'sr-q8o5', text: 'I have a deadline, the deadline passed, or I am not sure when it is due', tier: 5, flags: ['Deadline concern'] },
        ]
      },
      {
        id: 'sr-q9',
        order: 9,
        text: 'What would you like help with?',
        options: [
          { id: 'sr-q9o1', text: 'Figuring out whether or how to report something', tier: 2, flags: [] },
          { id: 'sr-q9o2', text: 'Preparing a self-report or explanation', tier: 3, flags: [] },
          { id: 'sr-q9o3', text: 'Fixing a late, incomplete, or inconsistent report', tier: 4, flags: [] },
          { id: 'sr-q9o4', text: 'Responding to security questions, a deadline, suspension, or access restriction', tier: 5, flags: [] },
          { id: 'sr-q9o5', text: 'Just understanding my risk', tier: 1, flags: [] },
        ]
      },
    ],
    results: [
      {
        tier: 1,
        label: 'No Obvious Reporting Trigger Flagged — Confirm Agency Rules',
        forPeopleWith: 'People with no flagged event, no government contact, no reporting delay, no disclosure concern, and no security-sensitive issue.',
        message: 'Your answers did not flag an obvious self-reporting trigger in this quiz. Reporting procedures can vary by agency, clearance level, and position, so keep records and follow your security office, FSO, command, or agency guidance if anything changes.',
        ctaText: 'Download the Security Clearance Self-Reporting Checklist',
        ctaType: 'download',
      },
      {
        tier: 2,
        label: 'Possible Reporting Issue — Clarify Before You Assume',
        forPeopleWith: 'People with uncertainty about whether they are covered, uncertainty about what counts, older/minor resolved issues, unknown credit/public records, informal reporting, or issues that may depend on agency procedure.',
        message: 'Your answers suggest the reporting answer may depend on details. Before assuming the issue does or does not need to be reported, gather the dates, documents, people involved, current status, and any agency or FSO instructions.',
        ctaText: 'Get the Self-Reporting Preparation Checklist',
        ctaType: 'download',
      },
      {
        tier: 3,
        label: 'Likely Self-Reporting Issue — Prepare a Clear Report',
        forPeopleWith: 'People with foreign travel, foreign contacts, foreign financial interests, arrests, DUI/court issues, financial problems, drug/alcohol issues, treatment-related issues, outside activities, media contacts, publication issues, or concern about another covered person.',
        message: 'Your answers suggest the event may fall within a self-reporting category. The next step is to prepare a clear, accurate summary of what happened, when it happened, who was involved, whether it is ongoing, and what documents support your explanation.',
        ctaText: 'Schedule a Self-Reporting Strategy Consultation',
        ctaType: 'schedule',
      },
      {
        tier: 4,
        label: 'Delay or Disclosure Concern — Be Careful Before Correcting',
        forPeopleWith: 'People with a late report, incomplete report, inconsistent details, omitted facts, or concern that a prior report was inaccurate.',
        message: 'Your answers suggest the issue may involve not only what happened, but also how and when it was reported. Before submitting a correction or supplemental explanation, organize the timeline, documents, and reason the earlier report was delayed or incomplete.',
        ctaText: 'Speak with a clearance attorney before correcting or supplementing a report',
        ctaType: 'contact',
      },
      {
        tier: 5,
        label: 'Security Incident, Formal Inquiry, or Deadline — High Urgency',
        forPeopleWith: 'People with loss or mishandling of classified/sensitive information, unauthorized disclosure, spillage, cyber/IT issue, coercion/blackmail, suspicious foreign contact, written security questions, access restriction, suspension, formal notice, or deadline.',
        message: 'Your answers suggest this may require prompt attention. The next step is to identify the security issue, who contacted you, the deadline, what documents were requested, and what information has already been provided before submitting anything further.',
        ctaText: 'Request an urgent case review',
        ctaType: 'contact',
      },
    ],
    availableFlags: [
      'Foreign travel',
      'Foreign contact or relationship',
      'Foreign citizenship or financial interest',
      'Uncertainty about foreign reporting',
      'Police or court history',
      'Recent or pending legal matter',
      'Serious criminal matter',
      'Disclosure uncertainty',
      'Financial issue',
      'Current delinquency',
      'Tax or bankruptcy issue',
      'Unknown credit or public records',
      'Drug or alcohol issue',
      'Drug or substance issue',
      'Alcohol incident',
      'Substance counseling or treatment',
      'Classified information or security incident',
      'Unauthorized disclosure or cyber issue',
      'Suspicious contact or coercion',
      'Outside activity or media contact',
      'Informal report only',
      'Reporting delay',
      'Incomplete or inconsistent report',
      'Security office contact',
      'Written request from security office',
      'Access suspended or formal notice',
      'Access suspended or under review',
      'May not be covered by self-reporting requirements',
      'Deadline concern',
    ],
    leadCapture: {
      fields: ['name', 'email', 'phone', 'deadline'],
      issueTypeLabel: '',
      issueTypeOptions: [],
    },
  },
];
