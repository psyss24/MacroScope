import React, { useEffect, useState } from "react";
import OverviewCards from "./OverviewCards";
import styles from "./Dashboard.module.css";

const Dashboard = () => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    //refresh every 2 mins
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      setRefreshKey((prev) => prev + 1);
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.dashboard}>
      <div className="container">
        {/* overview cards */}
        <section className={styles.overviewSection}>
          <OverviewCards key={`overview-${refreshKey}`} />
        </section>
        {/* last updated info at the bottom */}
        <div
          style={{
            textAlign: "right",
            color: "var(--muted-text)",
            fontSize: "0.95rem",
            marginTop: 32,
          }}
        >
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
