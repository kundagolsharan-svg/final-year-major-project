import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

const globalStyles = `
  @keyframes gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .animated-gradient-text {
    background: linear-gradient(to right, #6366f1, #a855f7, #ec4899, #f43f5e, #6366f1);
    background-size: 200% auto;
    animation: gradient-shift 6s linear infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    color: #6366f1; /* Fallback for clients that do not support bg clip text */
  }
  .hover-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .hover-card:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 20px 25px -5px rgba(99, 102, 241, 0.1), 0 8px 10px -6px rgba(99, 102, 241, 0.1) !important;
    border-color: rgba(99, 102, 241, 0.3) !important;
  }
  .btn-hover {
    transition: all 0.3s ease;
  }
  .btn-hover:hover {
    transform: scale(1.05);
    box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3) !important;
  }
`;

export default function EmailTemplate({
  userName = "",
  type = "monthly-report",
  data = {},
}) {
  if (type === "monthly-report") {
    return (
      <Html>
        <Head>
          <style>{globalStyles}</style>
        </Head>
        <Preview>Your Monthly Financial Report from SAMPAT</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            <div style={styles.header}>
              <Text style={styles.logoBadge}>✨ SAMPAT Intelligence</Text>
              <Heading style={styles.title} className="animated-gradient-text">
                Your SAMPAT Financial Report
              </Heading>
            </div>

            <Text style={styles.text}>Hello {userName},</Text>
            <Text style={styles.text}>
              Here is your AI-powered financial summary for <strong>{data?.month}</strong>.
            </Text>

            {/* Main Stats */}
            <Section style={styles.statsContainer}>
              <div style={styles.statCard} className="hover-card">
                <Text style={styles.statLabel}>Total Income</Text>
                <Text style={styles.statValuePositive}>₹{data?.stats?.totalIncome}</Text>
              </div>
              <div style={styles.statCard} className="hover-card">
                <Text style={styles.statLabel}>Total Expenses</Text>
                <Text style={styles.statValueNegative}>₹{data?.stats?.totalExpenses}</Text>
              </div>
              <div style={styles.statCard} className="hover-card">
                <Text style={styles.statLabel}>Net Savings</Text>
                <Text style={styles.statValueNet}>
                  ₹{(data?.stats?.totalIncome || 0) - (data?.stats?.totalExpenses || 0)}
                </Text>
              </div>
            </Section>

            {/* Category Breakdown */}
            {data?.stats?.byCategory && (
              <Section style={styles.section} className="hover-card">
                <Heading style={styles.heading}>Expenses by Category</Heading>
                {Object.entries(data?.stats.byCategory).map(
                  ([category, amount], i, arr) => (
                    <div key={category} style={{
                      ...styles.row,
                      borderBottom: i === arr.length - 1 ? 'none' : '1px solid #eef2ff'
                    }}>
                      <Text style={styles.categoryName}>{category}</Text>
                      <Text style={styles.categoryAmount}>₹{amount}</Text>
                    </div>
                  )
                )}
              </Section>
            )}

            {/* AI Insights */}
            {data?.insights && (
              <Section style={{...styles.section, background: 'linear-gradient(to right, #f5f3ff, #eef2ff)'}} className="hover-card">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <Text style={{ fontSize: '18px', marginRight: '8px', margin: 0 }}>🧠</Text>
                  <Heading style={{...styles.heading, margin: 0}}>AI Insights</Heading>
                </div>
                {data.insights.map((insight, index) => (
                  <div key={index} style={styles.insightRow}>
                    <Text style={styles.insightBullet}>•</Text>
                    <Text style={styles.insightText}>{insight}</Text>
                  </div>
                ))}
              </Section>
            )}

            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <a href="https://sampat.app/dashboard" style={styles.button} className="btn-hover">
                View Full Dashboard
              </a>
            </div>

            <Text style={styles.footer}>
              Thank you for using SAMPAT. Keep tracking your finances for better
              financial health!
            </Text>
          </Container>
        </Body>
      </Html>
    );
  }

  if (type === "budget-alert") {
    return (
      <Html>
        <Head>
          <style>{globalStyles}</style>
        </Head>
        <Preview>Budget Alert: You're nearing your limit</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            <div style={styles.header}>
              <Text style={{...styles.logoBadge, background: '#fef2f2', color: '#ef4444'}}>⚠️ Budget Alert</Text>
              <Heading style={styles.title} className="animated-gradient-text">Budget Warning</Heading>
            </div>
            <Text style={styles.text}>Hello {userName},</Text>
            <Text style={styles.text}>
              You have used <strong style={{color: '#ef4444'}}>{data?.percentageUsed?.toFixed(1)}%</strong> of your monthly budget.
            </Text>
            
            <Section style={styles.statsContainer}>
              <div style={styles.statCard} className="hover-card">
                <Text style={styles.statLabel}>Budget Limit</Text>
                <Text style={styles.statValue}>₹{data?.budgetAmount}</Text>
              </div>
              <div style={styles.statCard} className="hover-card">
                <Text style={styles.statLabel}>Spent So Far</Text>
                <Text style={styles.statValueNegative}>₹{data?.totalExpenses}</Text>
              </div>
              <div style={styles.statCard} className="hover-card">
                <Text style={styles.statLabel}>Remaining</Text>
                <Text style={styles.statValueNet}>
                  ₹{(data?.budgetAmount || 0) - (data?.totalExpenses || 0)}
                </Text>
              </div>
            </Section>

            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <a href="https://sampat.app/budget" style={{...styles.button, background: 'linear-gradient(to right, #6366f1, #a855f7)'}} className="btn-hover">
                Review Budget
              </a>
            </div>

            <Text style={styles.footer}>
              Adjust your spending to stay within your goals!
            </Text>
          </Container>
        </Body>
      </Html>
    );
  }

  if (type === "anomaly-alert") {
    return (
      <Html>
        <Head>
          <style>{globalStyles}</style>
        </Head>
        <Preview>Suspicious Transaction Alert from SAMPAT</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            <div style={styles.header}>
              <Text style={{...styles.logoBadge, background: '#fef2f2', color: '#ef4444'}}>🚨 AI Anomaly Detection</Text>
              <Heading style={styles.title} className="animated-gradient-text">Suspicious Transaction</Heading>
            </div>
            
            <Text style={styles.text}>Hello {userName},</Text>
            <Text style={styles.text}>
              Our AI detected a transaction that significantly exceeds your typical
              spending patterns for this category.
            </Text>
            
            <Section style={{...styles.section, background: '#fff5f5', borderColor: '#fecaca'}} className="hover-card">
              <div style={styles.row}>
                <Text style={styles.categoryName}>Merchant</Text>
                <Text style={{...styles.categoryAmount, color: '#111827'}}>{data?.transaction?.description}</Text>
              </div>
              <div style={styles.row}>
                <Text style={styles.categoryName}>Amount</Text>
                <Text style={styles.statValueNegative}>₹{data?.transaction?.amount}</Text>
              </div>
              <div style={styles.row}>
                <Text style={styles.categoryName}>Category</Text>
                <Text style={{...styles.categoryAmount, color: '#4b5563'}}>{data?.transaction?.category}</Text>
              </div>
              <div style={{...styles.row, borderBottom: 'none'}}>
                <Text style={styles.categoryName}>Date</Text>
                <Text style={{...styles.categoryAmount, color: '#4b5563'}}>
                  {data?.transaction?.date ? new Date(data?.transaction.date).toLocaleDateString() : ''}
                </Text>
              </div>
            </Section>

            <Section style={styles.section} className="hover-card">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <Text style={{ fontSize: '18px', marginRight: '8px', margin: 0 }}>🤖</Text>
                <Heading style={{...styles.heading, margin: 0}}>Why was this flagged?</Heading>
              </div>
              <Text style={styles.text}>{data?.reason}</Text>
            </Section>

            <Text style={styles.footer}>
              If this was you, you can ignore this message. If not, please check
              your account immediately.
            </Text>
          </Container>
        </Body>
      </Html>
    );
  }

  if (type === "welcome") {
    return (
      <Html>
        <Head>
          <style>{globalStyles}</style>
        </Head>
        <Preview>Welcome to SAMPAT - Your Financial Journey Begins!</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            <div style={styles.header}>
              <Text style={styles.logoBadge}>✨ Welcome to SAMPAT</Text>
              <Heading style={styles.title} className="animated-gradient-text">
                Hello, {userName}!
              </Heading>
            </div>
            
            <Text style={styles.text}>
              We are absolutely thrilled to have you onboard! You've just taken the first and most important step towards intelligent financial management.
            </Text>
            
            <Section style={{...styles.section, background: 'linear-gradient(135deg, #f5f3ff 0%, #eef2ff 100%)'}} className="hover-card">
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <Text style={{ fontSize: '24px', marginRight: '10px', margin: 0 }}>🚀</Text>
                <Heading style={{...styles.heading, margin: 0, color: '#4f46e5'}}>What's Next?</Heading>
              </div>
              
              <div style={styles.insightRow}>
                <Text style={styles.insightBullet}>1.</Text>
                <Text style={styles.insightText}><strong>Connect an Account:</strong> Start tracking your balance dynamically.</Text>
              </div>
              <div style={styles.insightRow}>
                <Text style={styles.insightBullet}>2.</Text>
                <Text style={styles.insightText}><strong>Scan a Receipt:</strong> Let our AI instantly log your first expense.</Text>
              </div>
              <div style={styles.insightRow}>
                <Text style={styles.insightBullet}>3.</Text>
                <Text style={styles.insightText}><strong>Set a Budget:</strong> We'll alert you before you overspend.</Text>
              </div>
            </Section>

            <div style={{ textAlign: 'center', marginTop: '30px', paddingBottom: '20px' }}>
              <a href="https://sampat.app/dashboard" style={{...styles.button, background: 'linear-gradient(to right, #6366f1, #a855f7)'}} className="btn-hover">
                Go to Dashboard
              </a>
            </div>

            <Text style={styles.footer}>
              Get ready to experience the power of AI-driven personal finance. Let's make every rupee count!
            </Text>
          </Container>
        </Body>
      </Html>
    );
  }

  if (type === "spending-increase") {
    return (
      <Html>
        <Head>
          <style>{globalStyles}</style>
        </Head>
        <Preview>Spending Alert: Increased Spending</Preview>
        <Body style={styles.body}>
          <Container style={styles.container}>
            <div style={styles.header}>
              <Text style={{...styles.logoBadge, background: '#fffbeb', color: '#d97706'}}>📈 Spending Trend</Text>
              <Heading style={styles.title} className="animated-gradient-text">Increased Spending</Heading>
            </div>
            
            <Section style={{...styles.section, textAlign: "center"}} className="hover-card">
              <div style={{ marginBottom: "16px" }}>
                <span style={{ 
                  backgroundColor: "#fee2e2", 
                  color: "#ef4444", 
                  padding: "6px 16px", 
                  borderRadius: "20px", 
                  fontSize: "13px", 
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  {data?.category}
                </span>
              </div>
              <Text style={{ ...styles.text, fontWeight: "700", fontSize: "20px", color: "#111827" }}>
                You've spent ₹{data?.increase?.toLocaleString("en-IN")} more on {data?.category} than last month.
              </Text>
              <Text style={{ ...styles.text, color: "#6b7280", marginTop: "8px" }}>
                That's a <strong style={{color: '#ef4444'}}>{data?.percent}%</strong> increase.
              </Text>
            </Section>

            <Section style={styles.statsContainer}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px" }}>
                <div style={{ flex: 1, textAlign: "center" }} className="hover-card">
                  <Text style={{ ...styles.text, fontSize: "13px", marginBottom: "4px", color: '#6b7280' }}>Last Month</Text>
                  <Text style={{ ...styles.heading, fontSize: "24px", color: "#4b5563", margin: 0 }}>₹{data?.last?.toLocaleString("en-IN")}</Text>
                </div>
                <div style={{ fontSize: "24px", color: "#d1d5db", margin: "0 15px" }}>→</div>
                <div style={{ flex: 1, textAlign: "center" }} className="hover-card">
                  <Text style={{ ...styles.text, fontSize: "13px", marginBottom: "4px", color: '#6b7280' }}>This Month</Text>
                  <Text style={{ ...styles.heading, fontSize: "24px", color: "#ef4444", margin: 0 }}>₹{data?.current?.toLocaleString("en-IN")}</Text>
                </div>
              </div>
            </Section>

            <Text style={styles.footer}>
              Tracking these increases can help you stay within your financial goals. 
              Review your transactions in the dashboard to see where you can save.
            </Text>
          </Container>
        </Body>
      </Html>
    );
  }

  return null;
}

const styles = {
  body: {
    backgroundColor: "#f4f4f5",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    padding: "20px 0",
  },
  container: {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "40px 30px",
    borderRadius: "16px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
    maxWidth: "600px",
  },
  header: {
    textAlign: "center",
    marginBottom: "30px",
  },
  logoBadge: {
    display: "inline-block",
    backgroundColor: "#e0e7ff",
    color: "#4f46e5",
    padding: "6px 16px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    marginBottom: "16px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "800",
    textAlign: "center",
    margin: "0",
    letterSpacing: "-0.5px",
  },
  heading: {
    color: "#111827",
    fontSize: "20px",
    fontWeight: "700",
    margin: "0 0 16px",
    letterSpacing: "-0.3px",
  },
  text: {
    color: "#4b5563",
    fontSize: "16px",
    lineHeight: "24px",
    margin: "0 0 16px",
  },
  section: {
    marginTop: "24px",
    padding: "24px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #eef2ff",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.02)",
  },
  statsContainer: {
    display: "flex",
    gap: "16px",
    marginTop: "24px",
    marginBottom: "24px",
  },
  statCard: {
    flex: "1",
    padding: "20px 16px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #eef2ff",
    textAlign: "center",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
  },
  statLabel: {
    color: "#6b7280",
    fontSize: "13px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    margin: "0 0 8px 0",
  },
  statValue: {
    color: "#111827",
    fontSize: "24px",
    fontWeight: "800",
    margin: "0",
  },
  statValuePositive: {
    color: "#10b981",
    fontSize: "24px",
    fontWeight: "800",
    margin: "0",
  },
  statValueNegative: {
    color: "#ef4444",
    fontSize: "24px",
    fontWeight: "800",
    margin: "0",
  },
  statValueNet: {
    color: "#4f46e5",
    fontSize: "24px",
    fontWeight: "800",
    margin: "0",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "14px 0",
  },
  categoryName: {
    color: "#4b5563",
    fontSize: "15px",
    fontWeight: "600",
    margin: "0",
  },
  categoryAmount: {
    color: "#111827",
    fontSize: "15px",
    fontWeight: "700",
    margin: "0",
  },
  insightRow: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  insightBullet: {
    color: "#4f46e5",
    marginRight: "10px",
    fontWeight: "bold",
    fontSize: "16px",
    margin: "0 10px 0 0",
  },
  insightText: {
    color: "#374151",
    fontSize: "15px",
    lineHeight: "22px",
    margin: "0",
  },
  button: {
    display: "inline-block",
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    padding: "14px 28px",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "16px",
    textDecoration: "none",
    textAlign: "center",
  },
  footer: {
    color: "#9ca3af",
    fontSize: "14px",
    textAlign: "center",
    marginTop: "40px",
    paddingTop: "24px",
    borderTop: "1px solid #f3f4f6",
  },
};
