import React from 'react';
import styles from './UnderIsland.module.scss';

interface IslandProps {
  children: React.ReactNode;
  spread: boolean;
  stylesOnNorm?: React.CSSProperties;
  stylesOnSpread?: React.CSSProperties;
}

export default function UnderIsland({ children, spread, stylesOnNorm, stylesOnSpread }: IslandProps) {
  return (
    <div
      className={`${styles.underIsland} ${spread ? styles.active : ''}`}
      // style={
      //   spread
      //     ? {
      //         ...(stylesOnSpread != undefined ? stylesOnSpread : defaultStylesOnSpread),
      //         // backgroundColor: '#f5f5f5',
      //         // display: 'flex',
      //         // alignItems: 'center',
      //         // justifyContent: 'center',
      //       }
      //     : { ...(stylesOnNorm != undefined ? stylesOnNorm : defaultStylesOnNorm) }
      // }
    >
      <div className={styles.island}></div>
      <div className={styles.islandContent}>ddddd</div>
      <div className={styles.content}>{children}</div>
      {/*{spread ? <div className={styles.spread}>{children}</div> : <div className={styles.collapsed}>{children}</div>}*/}
    </div>
  );
}
