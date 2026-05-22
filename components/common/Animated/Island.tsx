import React from 'react';
import styles from './Island.module.scss';

interface IslandProps {
  children: React.ReactNode;
  spread: boolean;
}

export default function Island({ children, spread }: IslandProps) {
  return (
    <div className={styles.island} style={{ width: spread ? '300px' : '100px' }}>
      <div>{children}</div>
      {/*{spread ? <div className={styles.spread}>{children}</div> : <div className={styles.collapsed}>{children}</div>}*/}
    </div>
  );
}
