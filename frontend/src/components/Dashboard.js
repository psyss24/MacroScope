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
        <div
          className={styles.timestamp}
          style={{ marginBottom: 24 }}
        >
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
        {/* overview cards */}
        <section className={styles.overviewSection}>
          <OverviewCards key={`overview-${refreshKey}`} />
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
