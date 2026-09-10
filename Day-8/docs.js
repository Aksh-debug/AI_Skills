// docs.js
// Static, hardcoded CreditSense loan-policy documents.
// Same 10 docs from Day 5, just inlined here so Day 8 doesn't depend on file reads.

export const docs = [
  {
    id: "doc_01",
    topic: "EMI-to-Income Ratio",
    text: `# CreditSense Loan Policy: EMI-to-Income Ratio (FOIR)

## Overview
The Fixed Obligation to Income Ratio (FOIR) is the primary affordability check used by CreditSense to determine whether an applicant can comfortably service a new loan alongside their existing financial obligations.

## Definition
FOIR is calculated as:

FOIR = (Total Monthly EMI Obligations + Proposed New EMI) / Net Monthly Income × 100

## Threshold Rules
- Salaried applicants: FOIR must not exceed 50% of net monthly income.
- Self-employed applicants: FOIR must not exceed 45% of net monthly income, due to income volatility.
- Applicants with a co-applicant: combined household FOIR must not exceed 55%.

## Income Documentation Required
1. Last 3 months' salary slips (salaried) or last 2 years' ITR (self-employed).
2. Bank statements for the last 6 months showing salary credits or business inflows.
3. Form 16 for the most recent financial year, where applicable.

## Existing Obligation Capture
All existing EMIs are pulled from the applicant's credit bureau report (CIBIL/Experian/Equifax) and cross-verified against bank statement debits. Undisclosed loans discovered during verification result in automatic FOIR recalculation and may trigger application rejection.

## Exceptions
- Applicants with a credit score above 780 may be granted a FOIR relaxation of up to 5 percentage points at the discretion of the credit committee.
- Government employees with pension guarantees may receive a FOIR relaxation of up to 3 percentage points.

## Rejection Trigger
Any application where computed FOIR exceeds the applicable threshold by more than 10 percentage points is auto-rejected without manual review.`
  },
  {
    id: "doc_02",
    topic: "Credit Score Tiers",
    text: `# CreditSense Loan Policy: Credit Score Tiers

## Overview
CreditSense assigns applicants to a pricing and risk tier based on their bureau credit score. This tier determines the base interest rate offered and the level of manual underwriting review required.

## Tier Definitions
- Tier A (Prime): Score 780-900. Lowest interest rate band, minimal manual review, fastest approval turnaround.
- Tier B (Near-Prime): Score 700-779. Standard interest rate band, light manual review.
- Tier C (Subprime): Score 620-699. Elevated interest rate band, mandatory manual underwriting review.
- Tier D (High Risk): Score below 620. Requires collateral or a guarantor; subject to committee approval regardless of other factors.

## Score Sourcing
Scores are pulled from CIBIL by default, with Experian or Equifax used as a fallback when CIBIL data is unavailable or older than 90 days. The most conservative (lowest) of any two available scores is used if they differ by more than 40 points.

## Thin-File Applicants
Applicants with no bureau history ("thin file") are treated as Tier C by default and may qualify for Tier B after 6 months of on-time repayment on any CreditSense product.

## Score Refresh
Credit scores are refreshed at every loan application and again at the midpoint of the loan tenure for loans exceeding 3 years, to support ongoing risk monitoring.

## Tier Movement
An applicant's tier can improve or worsen between applications. A tier downgrade during an active loan does not itself change the applicant's existing interest rate, but is factored into any future top-up or renewal request.`
  },
  {
    id: "doc_03",
    topic: "Collateral Requirements",
    text: `# CreditSense Loan Policy: Collateral Requirements

## Overview
Collateral requirements vary by loan product and applicant risk tier, as defined in the Credit Score Tiers policy. This document defines what qualifies as acceptable collateral and how it is valued.

## Acceptable Collateral Types
1. Residential or commercial real estate with clear title.
2. Fixed deposits held with a CreditSense-partnered bank.
3. Listed equity shares, subject to a 50% haircut on market value.
4. Gold jewelry or coins, valued at 75% of the prevailing gold rate.

## Loan-to-Value (LTV) Limits
- Real estate collateral: maximum LTV of 70%.
- Fixed deposit collateral: maximum LTV of 90%.
- Equity collateral: maximum LTV of 40% after haircut.
- Gold collateral: maximum LTV of 65%.

## Valuation Process
Real estate collateral must be valued by a CreditSense-empanelled valuer within the last 6 months. Valuations older than 6 months are not accepted and must be redone at the applicant's cost.

## Collateral Release
Collateral is released within 15 working days of full loan closure, provided there are no other active liabilities secured against the same asset.

## Insufficient Collateral
If the offered collateral value is insufficient to meet the LTV requirement for the requested loan amount, the applicant may either reduce the loan amount, add a guarantor, or offer supplementary collateral.`
  },
  {
    id: "doc_04",
    topic: "NPA Classification",
    text: `# CreditSense Loan Policy: NPA Classification

## Overview
This document defines how and when a loan account is classified as a Non-Performing Asset (NPA), in line with standard regulatory practice adapted for CreditSense's internal risk framework.

## Classification Trigger
A loan account is classified as an NPA when interest or principal repayment remains overdue for a period of more than 90 days from the due date.

## Sub-Classifications
- Special Mention Account (SMA-0): Overdue 1-30 days. Internal monitoring only, no external reporting.
- SMA-1: Overdue 31-60 days. Flagged for proactive collections outreach.
- SMA-2: Overdue 61-90 days. Escalated to senior collections team.
- NPA (Substandard): Overdue 91-365 days.
- NPA (Doubtful): Overdue beyond 365 days with continued non-payment.
- NPA (Loss): Account identified as uncollectible, pending write-off approval.

## Provisioning Requirement
Once an account is classified as NPA, CreditSense is required to set aside provisioning capital according to its sub-classification, increasing progressively from Substandard through Loss.

## Upgrade Conditions
An NPA account may be upgraded back to standard/performing status only after the borrower clears all overdue interest and principal in full, and the account demonstrates satisfactory conduct for one full quarter thereafter.

## Reporting
NPA status changes are reported to the credit bureaus at the next monthly reporting cycle and directly affect the borrower's credit score.`
  },
  {
    id: "doc_05",
    topic: "Data Privacy Policy",
    text: `# CreditSense Data Privacy Policy

## Overview
This policy governs how CreditSense collects, stores, processes, and shares applicant and customer personal data, in line with applicable data protection regulations.

## Data Collected
1. Identity data: name, date of birth, government ID numbers, photograph.
2. Financial data: income, bank statements, existing liabilities, credit bureau reports.
3. Contact data: address, phone number, email.
4. Behavioral data: application history, repayment history, app usage logs.

## Purpose Limitation
Personal data is collected and processed strictly for the purposes of credit assessment, loan servicing, regulatory reporting, and fraud prevention. Data is not used for unrelated marketing without explicit separate consent.

## Data Retention
- Active loan account data is retained for the life of the loan plus 8 years post-closure, in line with regulatory record-keeping requirements.
- Rejected application data is retained for 2 years, then anonymized.
- Marketing consent data is retained until consent is withdrawn.

## Third-Party Sharing
Data is shared with credit bureaus (CIBIL, Experian, Equifax), regulatory authorities upon lawful request, and empanelled valuers/collection agencies strictly for purposes tied to the applicant's own loan application or account.

## Applicant Rights
Applicants may request access to their stored personal data, request correction of inaccurate data, and request deletion of data no longer required for a legal or regulatory purpose, subject to applicable law.

## Data Security
All personal data is encrypted at rest and in transit. Access is role-based and logged, with periodic access audits conducted by the internal security team.

## Breach Notification
In the event of a data breach affecting personal data, affected applicants are notified within the timeframe required by applicable regulation, along with the relevant supervisory authority.`
  },
  {
    id: "doc_06",
    topic: "Tenure and Prepayment",
    text: `# CreditSense Loan Policy: Tenure and Prepayment

## Overview
This document defines available loan tenures across CreditSense products and the rules governing early and partial prepayment.

## Tenure Options
- Personal loans: 12 to 60 months.
- Home loans: 60 to 360 months.
- Business loans: 12 to 120 months.
- Loan against property: 24 to 180 months.

## Tenure Selection Constraints
Maximum tenure for any applicant is capped such that the loan matures before the applicant's age reaches 65 (salaried) or 70 (self-employed), whichever is applicable.

## Prepayment Types
1. Full prepayment (foreclosure): closing the entire outstanding loan before scheduled tenure completion.
2. Partial prepayment: paying down a portion of the principal ahead of schedule while continuing the loan.

## Prepayment Charges
- Floating-rate loans: no prepayment charge, in line with standard regulatory guidance.
- Fixed-rate loans: prepayment charge of 2% on the outstanding principal if foreclosed within the first 24 months, reducing to 1% thereafter.
- Business loans: prepayment charge of 3% on the outstanding principal regardless of tenure elapsed.

## Partial Prepayment Limits
Partial prepayments are capped at 25% of the outstanding principal per financial year for fixed-rate loans, to preserve interest income predictability. No cap applies to floating-rate loans.

## Lock-In Period
Home loans carry a 6-month lock-in period from disbursement during which no prepayment, full or partial, is permitted.`
  },
  {
    id: "doc_07",
    topic: "KYC Onboarding",
    text: `# CreditSense Policy: KYC Onboarding

## Overview
This document defines the Know Your Customer (KYC) requirements that must be completed before any loan application can proceed to underwriting.

## Mandatory Identity Documents
1. Government-issued photo ID (Aadhaar, Passport, Voter ID, or Driving License).
2. PAN card, mandatory for all applicants regardless of loan amount.
3. Proof of address, which may be the same as the photo ID if it contains a current address, or a separate utility bill/rental agreement not older than 3 months.

## Video KYC
Applicants may complete KYC via a live video call with a CreditSense-trained agent, during which the original ID document is shown on camera and a liveness check is performed. Video KYC sessions are recorded and retained per the Data Privacy Policy.

## In-Person KYC
Required for loan amounts above a defined high-value threshold, or where video KYC liveness checks fail twice. An in-person KYC appointment must be completed at a CreditSense branch or via an authorized field agent.

## Business Applicant KYC
Business loan applicants must additionally provide: certificate of incorporation or partnership deed, GST registration certificate, and the KYC documents of all directors or partners holding more than 15% ownership.

## Re-KYC
Existing customers are required to complete re-KYC every 2 years for low-risk accounts and every 1 year for high-risk accounts, as classified by the internal risk framework.

## Rejection on KYC Grounds
An application is rejected outright, without proceeding to credit assessment, if submitted identity documents are found to be forged, expired, or if the applicant fails liveness verification on both video and in-person attempts.`
  },
  {
    id: "doc_08",
    topic: "Interest Rates and Fees",
    text: `# CreditSense Loan Policy: Interest Rates and Fees

## Overview
This document defines how interest rates are set across products and risk tiers, and lists standard fees applicable to CreditSense loans.

## Rate Types
- Fixed rate: interest rate remains constant for the entire tenure.
- Floating rate: interest rate is linked to CreditSense's internal benchmark rate and resets quarterly.

## Base Rate by Tier
Interest rates are built on top of the applicable base rate, with a tier-based markup: Tier A receives the base rate with no markup, Tier B receives base plus 1.5%, Tier C receives base plus 3.5%, and Tier D receives base plus 5.5% along with mandatory collateral.

## Standard Fees
1. Processing fee: 1% of the sanctioned loan amount, subject to a minimum floor amount, deducted at disbursement.
2. Late payment fee: 2% of the overdue EMI amount per month of delay.
3. Bounce charge: a flat fee applied for every failed auto-debit or cheque bounce.
4. Loan cancellation fee: applicable if the applicant cancels after sanction but before disbursement.

## Fee Waivers
Processing fees may be waived in full for Tier A applicants during promotional periods, and are reduced by 50% for existing CreditSense customers in good standing applying for a subsequent loan.

## Rate Revision Notice
For floating-rate loans, any benchmark rate change is communicated to the borrower at least 15 days before it takes effect on their EMI, along with the option to switch to a fixed rate at prevailing terms.

## Annual Percentage Rate Disclosure
CreditSense discloses the full Annual Percentage Rate, inclusive of processing fee amortized over the first year, in the loan sanction letter to ensure the total cost of borrowing is transparent.`
  },
  {
    id: "doc_09",
    topic: "Disbursement Process",
    text: `# CreditSense Loan Policy: Disbursement Process

## Overview
This document describes the end-to-end process by which a sanctioned loan amount is disbursed to the applicant, including the conditions that must be satisfied first.

## Pre-Disbursement Conditions
1. Signed loan agreement and all sanction-letter conditions accepted by the applicant.
2. Collateral documentation completed and, where applicable, lien marked in favor of CreditSense.
3. Post-dated cheques or e-NACH mandate set up for EMI collection.
4. Insurance (where mandatory for the product) purchased and assigned.

## Disbursement Modes
Disbursement is made via direct bank transfer (NEFT/RTGS/IMPS) to the applicant's registered bank account. For home loans, disbursement may instead be made directly to the seller or builder as per the sale agreement.

## Disbursement Types
- Full disbursement: the entire sanctioned amount released in a single transaction, used for personal and most business loans.
- Staged disbursement: the sanctioned amount released in tranches tied to construction milestones, used for under-construction home loans.

## Staged Disbursement Verification
Each disbursement tranche for staged home loans requires a fresh site inspection report confirming the corresponding construction milestone has been completed before funds are released.

## Disbursement Timeline
Standard disbursement is completed within 3 working days of all pre-disbursement conditions being satisfied. Staged disbursements are processed within 5 working days of each milestone verification.

## Disbursement Cancellation
If pre-disbursement conditions are not met within 60 days of sanction, the sanction lapses and the applicant must reapply, undergoing fresh credit assessment.

## Post-Disbursement Communication
A disbursement confirmation, repayment schedule, and updated loan account statement are sent to the applicant within 24 hours of each disbursement.`
  },
  {
    id: "doc_10",
    topic: "Grievance and Collections",
    text: `# CreditSense Policy: Grievance Redressal and Collections Conduct

## Overview
This document covers two related areas: how CreditSense conducts collections on overdue accounts, and how customer grievances, including those related to collections, are handled.

## Collections Conduct Rules
1. Collection calls are permitted only between 8:00 AM and 7:00 PM local time for the borrower.
2. Collection agents must identify themselves, the company, and the purpose of the call at the start of every interaction.
3. Any threatening, abusive, or misleading language by a collections agent is a direct policy violation subject to disciplinary action.
4. Field visits by collection agents require prior notice to the borrower except in cases of confirmed fraud.

## Collections Escalation Path
Overdue accounts follow the SMA staging defined in the NPA Classification policy: SMA-0 accounts receive automated reminders only; SMA-1 accounts receive agent-led calls; SMA-2 and NPA accounts are escalated to the dedicated recovery team, which may involve legal notices as a last resort.

## Grievance Channels
Customers may raise a grievance via the in-app support chat, a dedicated grievance email address, or by calling the customer care helpline. All channels are logged in the same grievance tracking system.

## Grievance Resolution Timeline
- Acknowledgement of any grievance is sent within 24 hours of receipt.
- Standard grievances are resolved within 7 working days.
- Grievances related to collections conduct violations are prioritized and resolved within 3 working days.

## Escalation to Ombudsman
If a grievance is not resolved to the customer's satisfaction within the standard timeline, or resolution is unsatisfactory, the customer may escalate to the sector's designated ombudsman, whose contact details are provided at every stage of the grievance process.

## Grievance Officer
CreditSense designates a named Grievance Redressal Officer whose contact details are published on the website and in every loan sanction letter, serving as the final internal escalation point before ombudsman referral.`
  }
];

export const queries = [
  { id: "q1", query: "What is the maximum EMI-to-income ratio allowed for a salaried applicant?", expectedDocId: "doc_01" },
  { id: "q2", query: "What credit score range qualifies for the lowest interest tier?", expectedDocId: "doc_02" },
  { id: "q3", query: "When is a loan classified as an NPA?", expectedDocId: "doc_04" },
  { id: "q4", query: "What documents are required for KYC during onboarding?", expectedDocId: "doc_07" },
  { id: "q5", query: "What is the penalty or process for prepaying a loan early?", expectedDocId: "doc_06" }
];